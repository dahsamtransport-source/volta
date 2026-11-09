import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { fetchPage, type FieldSalesTable, type Row } from "@/data/client";
import { StateNotice } from "@/components/common/StateNotice";
import { formatDate } from "@/lib/format";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const PAGE_SIZE = 25;
const ISO = /^\d{4}-\d{2}-\d{2}(T|$)/;

function cell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string" && ISO.test(v)) return formatDate(v);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Generic server-paginated grid. Columns come from the actual rows returned (no invented columns). */
export function TableScreen({ table, emptyLabel }: { table: FieldSalesTable; emptyLabel: string }) {
  const [page, setPage] = useState(0);
  const [term, setTerm] = useState("");
  const [column, setColumn] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);

  const q = useQuery({
    queryKey: ["fs", table, page, column, term],
    queryFn: () =>
      fetchPage({
        table,
        page,
        pageSize: PAGE_SIZE,
        search: column && term ? { column, term } : undefined,
      }),
    placeholderData: keepPreviousData,
  });

  const columns = useMemo(() => (q.data?.rows[0] ? Object.keys(q.data.rows[0]) : []), [q.data]);
  const textCols = useMemo(
    () => columns.filter((c) => typeof q.data?.rows[0]?.[c] === "string"),
    [columns, q.data],
  );
  const total = q.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="glass-panel overflow-hidden animate-rise">
      <div className="flex flex-wrap items-center gap-2 border-b p-2.5">
        <select
          value={column}
          onChange={(e) => setColumn(e.target.value)}
          className="h-8 rounded-md border bg-card px-2 text-sm"
          aria-label="عمود البحث"
          disabled={!textCols.length}
        >
          <option value="">اختر عمود البحث</option>
          {textCols.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setPage(0);
          }}
          placeholder="بحث على الخادم…"
          className="h-8 w-56 rounded-md border bg-card px-2 text-sm"
          disabled={!column}
          aria-label="نص البحث"
        />
        <span className="ms-auto text-xs text-muted-foreground">
          {q.isFetching ? (
            "جارٍ التحميل…"
          ) : (
            <>
              الإجمالي: <span className="num">{total}</span>
            </>
          )}
        </span>
      </div>

      {q.isError ? (
        <StateNotice kind="error" title="تعذر تحميل البيانات">
          {(q.error as Error).message === "NOT_CONNECTED"
            ? "غير متصل."
            : (q.error as Error).message}
        </StateNotice>
      ) : q.isPending ? (
        <StateNotice kind="loading" title="جارٍ التحميل…" />
      ) : q.data.rows.length === 0 ? (
        <StateNotice kind="empty" title={emptyLabel}>
          لا توجد سجلات بعد، أو لا تسمح صلاحياتك بعرض أي سجل.
        </StateNotice>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs text-muted-foreground">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    className="whitespace-nowrap px-3 py-2 text-start font-medium"
                    dir="ltr"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.data.rows.map((r, i) => (
                <tr
                  key={String(r.id ?? i)}
                  onClick={() => setSelected(r)}
                  className="cursor-pointer border-t hover:bg-accent/40 focus-within:bg-accent/40"
                >
                  {columns.map((c) => (
                    <td key={c} className="max-w-64 truncate whitespace-nowrap px-3 py-1.5">
                      {cell(r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t p-2 text-xs">
        <button
          className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          <ChevronRight className="size-4" /> السابق
        </button>
        <span className="num">
          {page + 1} / {pages}
        </span>
        <button
          className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-muted disabled:opacity-40"
          disabled={page + 1 >= pages}
          onClick={() => setPage((p) => p + 1)}
        >
          التالي <ChevronLeft className="size-4" />
        </button>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="left" className="w-full overflow-y-auto sm:max-w-md" dir="rtl">
          <SheetHeader>
            <SheetTitle>تفاصيل السجل</SheetTitle>
          </SheetHeader>
          <dl className="mt-2 divide-y px-4 text-sm">
            {selected &&
              Object.entries(selected).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-2 py-2">
                  <dt className="text-xs text-muted-foreground" dir="ltr">
                    {k}
                  </dt>
                  <dd className="col-span-2 break-words">{cell(v)}</dd>
                </div>
              ))}
          </dl>
          <p className="px-4 pt-3 text-xs text-muted-foreground">
            التحرير سيُفعَّل بعد توليد أنواع المخطط والتحقق من سياسات RLS.
          </p>
          <button onClick={() => setSelected(null)} className="sr-only">
            <X /> إغلاق
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
