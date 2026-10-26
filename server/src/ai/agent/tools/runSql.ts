import { demoPool } from "../../../db/demoPool";
import type { AgentTool } from "./types";

function cleanQuery(raw: string): string {
  const q = raw
    .replace(/```(?:sql)?/gi, "")
    .trim()
    .replace(/;+\s*$/, "");
  if (!q) throw new Error("Empty query");
  if (q.includes(";")) throw new Error("Only one statement is allowed");
  if (!/^(select|with)\b/i.test(q)) throw new Error("Only SELECT queries are allowed");
  return q;
}

export const runSqlTool: AgentTool = {
  name: "run_sql",
  description:
    "Run a read-only PostgreSQL SELECT query on the sample business database. Input: one SQL query. " +
    "Tables: customers(id, name, email, plan) where plan is 'premium' or 'standard'; " +
    "orders(id, customer_id, product, amount, status, ordered_at, shipped_at, expected_delivery, delay_reason) " +
    "where status is 'delivered', 'shipped' or 'delayed'. orders.customer_id references customers.id.",
  run: async (input) => {
    const sql = cleanQuery(input);
    const client = await demoPool.connect();
    try {
      // the restricted role can only read the demo schema, never your app tables
      await client.query("BEGIN READ ONLY");
      await client.query("SET LOCAL ROLE wf_reader");
      await client.query("SET LOCAL statement_timeout = 5000");
      await client.query("SET LOCAL search_path = demo");
      const res = await client.query(sql);
      const rows = res.rows.slice(0, 30);
      const note = res.rows.length > 30 ? ` (showing first 30 of ${res.rows.length})` : "";
      return `${res.rows.length} row(s)${note}:\n${JSON.stringify(rows)}`;
    } finally {
      await client.query("ROLLBACK").catch(() => {});
      client.release();
    }
  },
};