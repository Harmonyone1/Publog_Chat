import json
import os
import re
import time
from typing import Any, Dict, List, Tuple, Optional
from datetime import date, timedelta

import boto3


ATHENA_DB = os.environ.get("ATHENA_DB", "publog_gold")
ATHENA_WORKGROUP = os.environ.get("ATHENA_WORKGROUP", "wg_publog_readonly")
ATHENA_OUTPUT = os.environ.get("ATHENA_OUTPUT", "")  # optional s3://bucket/prefix
ROW_LIMIT_DEFAULT = int(os.environ.get("ROW_LIMIT_DEFAULT", "100"))
ROW_LIMIT_MAX = int(os.environ.get("ROW_LIMIT_MAX", "1000"))
POLL_TIMEOUT_SEC = int(os.environ.get("TIMEOUT_SEC", "25"))


def _normalize_niin(s: str) -> str:
    s = re.sub(r"\D", "", s or "")
    return s.zfill(9)[:9] if s else s


def _resp_sql(sql: str, columns: List[str], rows: List[List[Any]], elapsed_ms: int, answer: str = "", plan: Dict[str, Any] = None):
    cols = [{"name": c} for c in columns]
    return {
        "answer": answer,
        "sql": sql,
        "mode": "sql",
        "result": {"columns": cols, "rows": rows},
        "elapsed_ms": elapsed_ms,
        "plan": plan or {},
    }


def _athena_query(sql: str) -> Tuple[List[str], List[List[Any]], int, str, str]:
    client = boto3.client("athena")
    start = time.time()
    start_args = {
        "QueryString": sql,
        "QueryExecutionContext": {"Database": ATHENA_DB},
        "WorkGroup": ATHENA_WORKGROUP,
    }
    if ATHENA_OUTPUT:
        start_args["ResultConfiguration"] = {"OutputLocation": ATHENA_OUTPUT}
    qid = client.start_query_execution(**start_args)["QueryExecutionId"]

    # poll
    deadline = start + POLL_TIMEOUT_SEC
    state = "QUEUED"
    while time.time() < deadline and state in ("QUEUED", "RUNNING"):
        time.sleep(0.5)
        resp = client.get_query_execution(QueryExecutionId=qid)
        state = resp["QueryExecution"]["Status"]["State"]

    if state != "SUCCEEDED":
        return [], [], int((time.time() - start) * 1000), qid, state

    res = client.get_query_results(QueryExecutionId=qid)
    rows = res.get("ResultSet", {}).get("Rows", [])
    # headers
    if not rows:
        return [], [], int((time.time() - start) * 1000), qid, "SUCCEEDED"
    headers = [c.get("VarCharValue", "") for c in rows[0].get("Data", [])]

    out_rows: List[List[Any]] = []
    for r in rows[1:ROW_LIMIT_MAX+1]:
        out_rows.append([d.get("VarCharValue", None) for d in r.get("Data", [])])
        if len(out_rows) >= ROW_LIMIT_DEFAULT:
            break
    elapsed_ms = int((time.time() - start) * 1000)
    return headers, out_rows, elapsed_ms, qid, "SUCCEEDED"


def _win_periods(win: Dict[str, Any]) -> Tuple[Dict[str, Any], Optional[Dict[str, Any]]]:
    """Return (current, previous) periods keyed by either dates or years.
    Previous is matched to the same span immediately preceding current.
    """
    if "start_date" in win and "end_date" in win:
        sd = date.fromisoformat(win["start_date"])
        ed = date.fromisoformat(win["end_date"])
        span = (ed - sd).days + 1
        prev_ed = sd - timedelta(days=1)
        prev_sd = prev_ed - timedelta(days=span - 1)
        return ({"start_date": sd, "end_date": ed}, {"start_date": prev_sd, "end_date": prev_ed})
    if "start_year" in win and "end_year" in win:
        sy = int(win["start_year"]); ey = int(win["end_year"])
        n = (ey - sy) + 1
        prev_sy = sy - n; prev_ey = sy - 1
        return ({"start_year": sy, "end_year": ey}, {"start_year": prev_sy, "end_year": prev_ey})
    # default last 12 months and its previous 12 months
    today = date.today(); sd = today - timedelta(days=365)
    prev_ed = sd - timedelta(days=1); prev_sd = prev_ed - timedelta(days=365 - 1)
    return ({"start_date": sd, "end_date": today}, {"start_date": prev_sd, "end_date": prev_ed})


def _period_where(p: Dict[str, Any], alias: str = "f") -> str:
    a = alias + "."
    if "start_date" in p and "end_date" in p:
        sd = p["start_date"].isoformat() if isinstance(p["start_date"], date) else str(p["start_date"]) 
        ed = p["end_date"].isoformat() if isinstance(p["end_date"], date) else str(p["end_date"]) 
        return f"{a}award_date BETWEEN date '{sd}' AND date '{ed}'"
    if "start_year" in p and "end_year" in p:
        return f"{a}award_year BETWEEN {int(p['start_year'])} AND {int(p['end_year'])}"
    return "1=1"


def _compute_insights(intent: str, params: Dict[str, Any], win: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Compute lightweight insight cards for overview intents."""
    cards: List[Dict[str, Any]] = []
    cur, prev = _win_periods(win)

    # Build entity filter and joins
    filt: List[str] = []
    join_cage = False
    if intent.startswith("company_"):
        cage = str(params.get("seller_cage", "")).strip().upper()
        cq = str(params.get("company_query", "")).strip()
        if cage:
            filt.append(f"upper(f.seller_cage) = '{cage}'")
        elif cq:
            join_cage = True
            cq_esc = cq.replace("'", "''")
            filt.append(f"lower(c.company_name) LIKE lower('%{cq_esc}%')")
    elif intent.startswith("niin_"):
        n = params.get("niin")
        if n:
            n = re.sub(r"\D", "", n or "").zfill(9)[:9]
            filt.append(f"f.niin = '{n}'")
    elif intent.startswith("fsc_"):
        fsc = str(params.get("fsc", "")).zfill(4)
        if fsc:
            filt.append(f"f.fsc = '{fsc}'")

    def base_from() -> str:
        return "FROM fact_procurement_enriched f " + ("LEFT JOIN dim_cage c ON f.seller_cage = c.cage_code " if join_cage else "")

    # Movers: delta% current vs previous
    where_cur = _period_where(cur)
    where_prev = _period_where(prev)
    extra = (" AND " + " AND ".join(filt)) if filt else ""
    sql_cur = f"SELECT sum(f.amount) AS rev {base_from()} WHERE {where_cur}{extra}"
    sql_prev = f"SELECT sum(f.amount) AS rev {base_from()} WHERE {where_prev}{extra}"
    h1, r1, *_ = _athena_query(sql_cur)
    h2, r2, *_ = _athena_query(sql_prev)
    try:
        cur_rev = float(r1[0][0]) if r1 and r1[0][0] is not None else 0.0
        prev_rev = float(r2[0][0]) if r2 and r2[0][0] is not None else 0.0
    except Exception:
        cur_rev, prev_rev = 0.0, 0.0
    delta_pct = None
    if prev_rev > 0:
        delta_pct = (cur_rev - prev_rev) / prev_rev
    cards.append({
        "type": "movers",
        "metrics": {"current_revenue": cur_rev, "previous_revenue": prev_rev, "delta_pct": delta_pct},
        "evidence": {"sql_current": sql_cur, "sql_previous": sql_prev}
    })

    # Concentration (HHI)
    if intent.startswith("company_"):
        # HHI across NIINs for this company
        sql_hhi = f"""
        WITH x AS (
          SELECT f.niin, sum(f.amount) AS rev {base_from()} WHERE {_period_where(cur)}{extra} GROUP BY f.niin
        )
        SELECT SUM(POWER(rev / NULLIF((SELECT SUM(rev) FROM x),0), 2)) AS hhi FROM x
        """.strip()
    elif intent.startswith("niin_"):
        # HHI across sellers for this NIIN
        sql_hhi = f"""
        WITH x AS (
          SELECT f.seller_cage, sum(f.amount) AS rev {base_from()} WHERE {_period_where(cur)}{extra} GROUP BY f.seller_cage
        )
        SELECT SUM(POWER(rev / NULLIF((SELECT SUM(rev) FROM x),0), 2)) AS hhi FROM x
        """.strip()
    else:
        sql_hhi = f"SELECT CAST(NULL AS double) AS hhi"
    hh, rh, *_ = _athena_query(sql_hhi)
    hhi = float(rh[0][0]) if rh and rh[0][0] is not None else None
    cards.append({"type": "concentration", "metrics": {"hhi": hhi}, "evidence": {"sql": sql_hhi}})

    # Volatility + anomaly (last 12 months)
    sql_series = (
        "SELECT date_trunc('month', f.award_date) AS month, SUM(f.amount) AS revenue "
        + base_from() +
        f"WHERE f.award_date >= date_add('month', -12, current_date){extra} GROUP BY 1 ORDER BY 1"
    )
    hs, rs, *_ = _athena_query(sql_series)
    series = []
    for row in rs:
        try:
            series.append(float(row[1]))
        except Exception:
            pass
    vol = None; mean = None; z = None
    if series:
        n = len(series)
        mean = sum(series) / n
        if n > 1:
            var = sum((x - mean) ** 2 for x in series) / (n - 1)
            std = var ** 0.5
            vol = std
            if std and std > 0:
                z = (series[-1] - mean) / std
    cards.append({
        "type": "volatility",
        "metrics": {"stddev": vol, "mean": mean},
        "evidence": {"sql": sql_series}
    })
    cards.append({
        "type": "anomalies",
        "metrics": {"z_score_latest": z, "flag": (abs(z) > 2) if z is not None else None},
        "evidence": {"sql": sql_series}
    })

    return cards


def _intent_from_question(q: str) -> Tuple[str, Dict[str, Any]]:
    ql = (q or "").strip()
    qlow = ql.lower()
    params: Dict[str, Any] = {}

    # Extract year if present
    m = re.search(r"(19|20)\d{2}", qlow)
    if m:
        params["year"] = int(m.group(0))

    # Detect NIIN in text
    m2 = re.search(r"niin\D*([0-9]{1,9})", qlow)
    if m2:
        params["niin"] = _normalize_niin(m2.group(1))

    # suppliers/vendors/companies
    if ("supplier" in qlow) or ("suppliers" in qlow) or ("vendor" in qlow) or ("vendors" in qlow) or ("company" in qlow) or ("companies" in qlow):
        # e.g., "top companies by revenue", "top suppliers last 3 years"
        return "top_suppliers_by_revenue", params

    if "top" in qlow and ("niin" in qlow) and ("revenue" in qlow or "spend" in qlow or "sales" in qlow):
        return "top_niins_by_revenue", params
    if ("price" in qlow or "unit price" in qlow) and "niin" in qlow and params.get("niin"):
        return "price_by_niin", params
    if ("fsc" in qlow) and ("price" in qlow or "revenue" in qlow):
        # try extract fsc
        m3 = re.search(r"fsc\D*(\d{3,4})", qlow)
        if m3: params["fsc"] = m3.group(1)
        return "price_by_fsc", params
    if "item name" in qlow or "containing" in qlow or "contains" in qlow:
        # crude keyword between quotes
        m4 = re.search(r"'([^']+)'|\"([^\"]+)\"", q)
        if m4:
            params["query"] = (m4.group(1) or m4.group(2)).strip()
        else:
            # last token heuristic
            parts = ql.split()
            if parts:
                params["query"] = parts[-1]
        return "item_name_search", params

    # default fallbacks
    if params.get("niin"):
        return "price_by_niin", params
    return "item_name_search", params


def _resolve_window(params: Dict[str, Any]) -> Dict[str, Any]:
    """Resolve a time window. Defaults to last 12 months."""
    from datetime import date, timedelta
    today = date.today()
    out: Dict[str, Any] = {}
    n = params.get("last_n"); unit = str(params.get("last_unit",""))
    if n and unit:
        try:
            n = int(n)
        except Exception:
            n = None
    if n and unit:
        if unit.startswith("year"):
            start = date(today.year - n, 1, 1)
            out["start_year"], out["end_year"] = start.year, today.year
            out["grain"] = "year" if n >= 3 else "month"
            return out
        if unit.startswith("month"):
            start = today - timedelta(days=30*n)
            out["start_date"], out["end_date"] = start.isoformat(), today.isoformat()
            out["grain"] = "month"
            return out
    sy = params.get("start_year"); ey = params.get("end_year")
    if sy or ey:
        if not sy: sy = today.year - 3
        if not ey: ey = today.year
        out["start_year"], out["end_year"] = int(sy), int(ey)
        out["grain"] = "year" if (int(ey)-int(sy)) >= 3 else "month"
        return out
    y = params.get("year")
    if y:
        out["start_year"], out["end_year"] = int(y), int(y)
        out["grain"] = "month"
        return out
    start = today - timedelta(days=365)
    out["start_date"], out["end_date"] = start.isoformat(), today.isoformat()
    out["grain"] = "month"
    return out


def _build_sql(intent: str, params: Dict[str, Any], limit: int) -> Tuple[str, Dict[str, Any]]:
    limit = max(1, min(limit or ROW_LIMIT_DEFAULT, ROW_LIMIT_MAX))
    plan: Dict[str, Any] = {"intent": intent, "limit": limit}
    win = _resolve_window(params)
    plan["window"] = {k: win[k] for k in ("start_date","end_date","start_year","end_year","grain") if k in win}

    def year_clause(alias: Optional[str] = None) -> str:
        a = (alias + ".") if alias else ""
        if "start_year" in win and "end_year" in win:
            return f"WHERE {a}award_year BETWEEN {int(win['start_year'])} AND {int(win['end_year'])}"
        if "start_year" in win:
            return f"WHERE {a}award_year >= {int(win['start_year'])}"
        if "end_year" in win:
            return f"WHERE {a}award_year <= {int(win['end_year'])}"
        if "start_date" in win and "end_date" in win:
            return f"WHERE {a}award_date BETWEEN date '{win['start_date']}' AND date '{win['end_date']}'"
        return ""

    wide_years = ("start_year" in win and "end_year" in win and (int(win["end_year"]) - int(win["start_year"]) >= 3))

    # Top NIINs (routes to yearly mart for wide windows)
    if intent == "top_niins_by_revenue":
        topn = int(params.get("topn") or limit)
        topn = max(1, min(topn, ROW_LIMIT_MAX))
        if wide_years:
            sy = int(win.get("start_year")); ey = int(win.get("end_year"))
            sql = (
                "SELECT niin, SUM(revenue) AS total_revenue, SUM(orders) AS orders "
                "FROM niin_by_year_v1 "
                f"WHERE year BETWEEN {sy} AND {ey} "
                "GROUP BY 1 ORDER BY total_revenue DESC "
                f"LIMIT {topn}"
            )
            plan["tables"] = ["niin_by_year_v1"]
            return sql, plan
        where = year_clause("f")
        sql = (
            "SELECT f.niin, SUM(f.amount) AS total_revenue, COUNT(*) AS orders "
            "FROM fact_procurement_enriched f "
            f"{where} GROUP BY 1 ORDER BY total_revenue DESC LIMIT {topn}"
        )
        plan["tables"] = ["fact_procurement_enriched"]
        return sql, plan

    if intent == "top_suppliers_by_revenue":
        topn = int(params.get("topn") or limit)
        topn = max(1, min(topn, ROW_LIMIT_MAX))
        if wide_years:
            sy = int(win.get("start_year")); ey = int(win.get("end_year"))
            sql = (
                "SELECT seller_cage, company_name, SUM(revenue) AS total_revenue, SUM(orders) AS orders "
                "FROM vendor_by_year_v1 "
                f"WHERE year BETWEEN {sy} AND {ey} "
                "GROUP BY 1,2 ORDER BY total_revenue DESC "
                f"LIMIT {topn}"
            )
            plan["tables"] = ["vendor_by_year_v1"]
            return sql, plan
        where = year_clause("f")
        sql = (
            "SELECT f.seller_cage, c.company_name, SUM(f.amount) AS total_revenue, COUNT(*) AS orders "
            "FROM fact_procurement_enriched f LEFT JOIN dim_cage c ON f.seller_cage = c.cage_code "
            f"{where} GROUP BY 1,2 ORDER BY total_revenue DESC LIMIT {topn}"
        )
        plan["tables"] = ["fact_procurement_enriched","dim_cage"]
        return sql, plan

    if intent == "price_by_niin":
        niin = _normalize_niin(params.get("niin", ""))
        if not niin:
            raise ValueError("Missing NIIN")
        sql = (
            "SELECT niin, avg(unit_price) AS avg_unit_price, sum(amount) AS total_revenue, count(*) AS orders "
            "FROM fact_procurement_enriched "
            f"WHERE niin = '{niin}' GROUP BY 1 LIMIT {limit}"
        )
        plan["tables"] = ["fact_procurement_enriched"]
        plan["filters"] = {"niin": niin}
        return sql, plan

    if intent == "price_by_fsc":
        fsc = str(params.get("fsc", "")).zfill(4)
        sql = (
            "SELECT date_trunc('month', award_date) AS month, sum(amount) AS revenue, count(*) AS orders "
            "FROM fact_procurement_enriched "
            f"WHERE fsc = '{fsc}' GROUP BY 1 ORDER BY 1 LIMIT {limit}"
        )
        plan["tables"] = ["fact_procurement_enriched"]
        plan["filters"] = {"fsc": fsc}
        plan["grain"] = "month"
        return sql, plan

    if intent == "item_name_search":
        q = str(params.get("query", "")).strip().replace("'","''")
        sql = (
            "SELECT niin, item_name FROM dim_item_label "
            f"WHERE lower(item_name) LIKE lower('%{q}%') ORDER BY item_name ASC LIMIT {limit}"
        )
        plan["tables"] = ["dim_item_label"]
        plan["filters"] = {"query": q}
        return sql, plan

    # default
    return f"SELECT niin, item_name FROM dim_item_label LIMIT {limit}", {"tables": ["dim_item_label"], "limit": limit}


def handler(event, context):
    try:
        body = event.get("body") if isinstance(event, dict) else None
        if isinstance(body, str):
            try:
                payload = json.loads(body)
            except Exception:
                payload = {}
        elif isinstance(event, dict) and ("question" in event or "intent" in event):
            payload = event
        else:
            payload = {}

        question = str(payload.get("question", "")).strip()
        intent = payload.get("intent")
        params = payload.get("params") or {}
        limit = int(payload.get("limit") or ROW_LIMIT_DEFAULT)

        if not intent:
            intent, auto_params = _intent_from_question(question)
            # merge auto_params into params if not present
            for k, v in (auto_params or {}).items():
                params.setdefault(k, v)

        sql, plan = _build_sql(intent, params, limit)
        headers, rows, elapsed_ms, qid, state = _athena_query(sql)

        # If Athena timed out/failed return async hint
        if not headers and not rows:
            return {
                "statusCode": 202,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({
                    "answer": "Query accepted; running asynchronously.",
                    "result": {"columns": [], "rows": []},
                    "sql": sql,
                    "elapsed_ms": elapsed_ms,
                    "query_id": qid,
                    "state": state,
                    "plan": plan,
                }),
            }

        resp = _resp_sql(sql, headers, rows, elapsed_ms, answer="", plan=plan)
        # Attach insight cards for overviews
        if intent in {"company_overview","niin_overview","pn_overview","contract_overview","fsc_overview"}:
            try:
                win = plan.get("window", {})
                resp["insight_cards"] = _compute_insights(intent, params, win)
            except Exception as _:
                # keep response even if insights fail
                resp["insight_cards"] = []
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "Cache-Control": "no-store"},
            "body": json.dumps(resp),
        }
    except Exception as e:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"answer": "", "error": str(e)}),
        }
