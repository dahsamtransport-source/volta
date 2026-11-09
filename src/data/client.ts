import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { FIELD_SALES_SCHEMA, FIELD_SALES_URL, getKeyCheck } from "@/lib/config";

/**
 * Typed data boundary. Database types MUST be generated from the live schema:
 *   npx supabase gen types typescript --project-id dymxnmpaaobxoaowksoc --schema field_sales > src/data/database.types.ts
 * Until then rows are untyped records — no columns are invented here.
 */
export const FIELD_SALES_TABLES = [
  "districts",
  "representatives",
  "products",
  "establishments",
  "representative_districts",
  "visits",
  "opportunities",
  "quotes",
  "quote_items",
  "sales",
  "sale_items",
  "sync_events",
  "audit_log",
] as const;
export type FieldSalesTable = (typeof FIELD_SALES_TABLES)[number];
export type Row = Record<string, unknown>;

let client: SupabaseClient | null = null;

export function getClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const k = getKeyCheck();
  if (!k.ok) return null;
  if (!client) {
    client = createClient(FIELD_SALES_URL, k.key, {
      db: { schema: FIELD_SALES_SCHEMA },
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "lahj-field-sales-auth" },
    });
  }
  return client;
}

export interface PageQuery {
  table: FieldSalesTable;
  page: number;
  pageSize: number;
  search?: { column: string; term: string };
  orderBy?: string;
}

export interface PageResult {
  rows: Row[];
  total: number | null;
}

/** Server-side pagination; RLS enforced by the database. */
export async function fetchPage(q: PageQuery): Promise<PageResult> {
  const c = getClient();
  if (!c) throw new Error("NOT_CONNECTED");
  let req = c
    .from(q.table)
    .select("*", { count: "exact" })
    .range(q.page * q.pageSize, q.page * q.pageSize + q.pageSize - 1);
  if (q.search?.term) req = req.ilike(q.search.column, `%${q.search.term}%`);
  if (q.orderBy) req = req.order(q.orderBy, { ascending: false });
  const { data, error, count } = await req;
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as Row[], total: count };
}

export type ProbeResult = { table: FieldSalesTable; ok: boolean; message: string };

/** Probe schema exposure/grants per table (head count, no data). */
export async function probeTables(): Promise<ProbeResult[]> {
  const c = getClient();
  if (!c) return FIELD_SALES_TABLES.map((t) => ({ table: t, ok: false, message: "غير متصل" }));
  return Promise.all(
    FIELD_SALES_TABLES.map(async (t) => {
      const { error } = await c.from(t).select("*", { count: "exact", head: true });
      return { table: t, ok: !error, message: error ? error.message : "متاح (وفق صلاحيات RLS)" };
    }),
  );
}
