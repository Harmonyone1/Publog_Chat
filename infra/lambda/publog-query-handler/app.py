import json
import os
import re
import time
from typing import Any, Dict, List, Tuple

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


def _build_sql(intent: str, params: Dict[str, Any], limit: int) -> Tuple[str, Dict[str, Any]]:
    limit = max(1, min(limit or ROW_LIMIT_DEFAULT, ROW_LIMIT_MAX))
    plan: Dict[str, Any] = {"intent": intent, "limit": limit}
    if intent == "top_niins_by_revenue":
        year = params.get("year")
        where = f"WHERE year = {int(year)}" if year else ""
        sql = (
            "SELECT niin, total_revenue, orders "
            "FROM price_summary_by_niin_v1 "
            f"{where} "
            "ORDER BY total_revenue DESC "
            f"LIMIT {limit}"
        )
        plan["tables"] = ["price_summary_by_niin_v1"]
        if year: plan["filters"] = {"year": int(year)}
        return sql, plan

    if intent == "price_by_niin":
        niin = _normalize_niin(params.get("niin", ""))
        if not niin:
            raise ValueError("Missing NIIN")
        sql = (
            "SELECT niin, avg(unit_price) AS avg_unit_price, sum(unit_price*quantity) AS total_revenue, count(*) AS orders "
            "FROM fact_procurement_curated_v3 "
            f"WHERE lpad(cast(niin as varchar),9,'0') = '{niin}' "
            "GROUP BY 1 "
            f"LIMIT {limit}"
        )
        plan["tables"] = ["fact_procurement_curated_v3"]
        plan["filters"] = {"niin": niin}
        return sql, plan

    if intent == "price_by_fsc":
        fsc = str(params.get("fsc", "")).zfill(4)
        sql = (
            "SELECT date_trunc('month', award_date) AS month, sum(unit_price*quantity) AS revenue, count(*) AS orders "
            "FROM fact_procurement_curated_v3 "
            f"WHERE fsc = '{fsc}' "
            "GROUP BY 1 ORDER BY 1 "
            f"LIMIT {limit}"
        )
        plan["tables"] = ["fact_procurement_curated_v3"]
        plan["filters"] = {"fsc": fsc}
        plan["grain"] = "month"
        return sql, plan

    if intent == "item_name_search":
        q = str(params.get("query", "")).strip()
        q = q.replace("'", "''")
        sql = (
            "SELECT niin, item_name "
            "FROM dim_item_name "
            f"WHERE item_name ILIKE '%{q}%' "
            f"ORDER BY item_name ASC LIMIT {limit}"
        )
        plan["tables"] = ["dim_item_name"]
        plan["filters"] = {"query": q}
        return sql, plan

    # default
    return f"SELECT niin, item_name FROM dim_item_name LIMIT {limit}", {"tables": ["dim_item_name"], "limit": limit}


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

