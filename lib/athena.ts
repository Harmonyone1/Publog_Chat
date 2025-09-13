import { AthenaClient, StartQueryExecutionCommand, GetQueryExecutionCommand, GetQueryResultsCommand } from "@aws-sdk/client-athena";

const region = process.env.AWS_REGION || "us-east-1";
const workGroup = process.env.ATHENA_WORKGROUP || "primary";
const athena = new AthenaClient({ region });

export async function runSql(query: string): Promise<{ columns: string[]; rows: string[][] }> {
  const start = await athena.send(new StartQueryExecutionCommand({ QueryString: query, WorkGroup: workGroup }));
  const id = start.QueryExecutionId!;
  const t0 = Date.now();
  while (true) {
    const ex = await athena.send(new GetQueryExecutionCommand({ QueryExecutionId: id }));
    const state = ex.QueryExecution?.Status?.State;
    if (state === "SUCCEEDED") break;
    if (state === "FAILED" || state === "CANCELLED") {
      throw new Error(ex.QueryExecution?.Status?.StateChangeReason || "Athena query failed");
    }
    if (Date.now() - t0 > 120000) throw new Error("Athena query timeout");
    await new Promise((r) => setTimeout(r, 800));
  }
  const res = await athena.send(new GetQueryResultsCommand({ QueryExecutionId: id, MaxResults: 1000 }));
  const cols = res.ResultSet?.ResultSetMetadata?.ColumnInfo?.map((c) => c.Name || "") || [];
  const rows = (res.ResultSet?.Rows || []).slice(1).map((r) => (r.Data || []).map((d) => d.VarCharValue ?? null) as any) as string[][];
  return { columns: cols, rows };
}

export async function fetchNiinMap(niins: string[]): Promise<Record<string, { item_name: string | null; fsc_title: string | null }>> {
  if (!niins.length) return {};
  const unique = Array.from(new Set(niins.filter(Boolean))).slice(0, 500);
  const inList = unique.map((n) => `'${n.replace(/'/g, "''")}'`).join(",");
  const sql = `
    SELECT niin, item_name, fsc_title
    FROM publog_gold.niin_dim_latest_v1
    WHERE niin IN (${inList})
  `;
  const { columns, rows } = await runSql(sql);
  const idxN = columns.findIndex((c) => /niin/i.test(c));
  const idxI = columns.findIndex((c) => /item_name/i.test(c));
  const idxF = columns.findIndex((c) => /fsc_title/i.test(c));
  const map: Record<string, { item_name: string | null; fsc_title: string | null }> = {};
  for (const r of rows) {
    const n = r[idxN];
    if (!n) continue;
    map[n] = { item_name: (idxI >= 0 ? r[idxI] : null) as any, fsc_title: (idxF >= 0 ? r[idxF] : null) as any };
  }
  return map;
}

export async function fetchFscMap(fscs: string[]): Promise<Record<string, { fsc_title: string | null; fsg_title: string | null }>> {
  if (!fscs.length) return {} as any;
  const unique = Array.from(new Set(fscs.filter(Boolean))).slice(0, 500);
  const inList = unique.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",");
  const sql = `
    SELECT fsc, fsc_name, fsg_name
    FROM publog_gold.dim_fsc
    WHERE fsc IN (${inList})
  `;
  const { columns, rows } = await runSql(sql);
  const idxF = columns.findIndex((c) => c.toLowerCase() === 'fsc');
  const idxFscTitle = columns.findIndex((c) => c.toLowerCase() === 'fsc_name');
  const idxFsgTitle = columns.findIndex((c) => c.toLowerCase() === 'fsg_name');
  const map: Record<string, { fsc_title: string | null; fsg_title: string | null }> = {};
  for (const r of rows) {
    const f = r[idxF];
    if (!f) continue;
    map[f] = {
      fsc_title: (idxFscTitle >= 0 ? (r[idxFscTitle] as any) : null),
      fsg_title: (idxFsgTitle >= 0 ? (r[idxFsgTitle] as any) : null),
    };
  }
  return map;
}
