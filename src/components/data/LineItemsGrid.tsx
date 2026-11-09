import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { lineTotal, linesTotal, toFixed, parseDec, type DraftLine } from "@/lib/decimal";
import { formatMoney } from "@/lib/format";

const blank = (): DraftLine & { key: string } => ({
  key: crypto.randomUUID(),
  quantity: "1",
  unitPrice: "",
  discountPercent: "0",
});

function safe(fn: () => string) {
  try {
    return fn();
  } catch {
    return "—";
  }
}

/** Local draft calculator. Not persisted; database totals remain authoritative. */
export function LineItemsGrid({ currency = "YER" }: { currency?: string }) {
  const [lines, setLines] = useState([blank()]);
  const update = (key: string, field: keyof DraftLine, v: string) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, [field]: v } : l)));
  const invalid = (v: string) => {
    try {
      parseDec(v);
      return false;
    } catch {
      return true;
    }
  };

  return (
    <div className="glass-panel overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="text-sm font-medium">
          حاسبة البنود{" "}
          <span className="text-xs font-normal text-muted-foreground">
            (مسودة محلية — لا تُحفظ)
          </span>
        </div>
        <button
          onClick={() => setLines((l) => [...l, blank()])}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" /> بند
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-xs text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-start">#</th>
            <th className="px-2 text-start">الكمية</th>
            <th className="px-2 text-start">سعر الوحدة</th>
            <th className="px-2 text-start">خصم %</th>
            <th className="px-2 text-start">الإجمالي</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.key} className="border-t">
              <td className="px-2 text-xs text-muted-foreground num">{i + 1}</td>
              {(["quantity", "unitPrice", "discountPercent"] as const).map((f) => (
                <td key={f} className="px-1 py-1">
                  <input
                    inputMode="decimal"
                    aria-label={`${f} ${i + 1}`}
                    value={l[f]}
                    onChange={(e) => update(l.key, f, e.target.value)}
                    aria-invalid={invalid(l[f])}
                    className="num h-8 w-full rounded border bg-card px-2 text-end aria-[invalid=true]:border-destructive"
                  />
                </td>
              ))}
              <td className="px-2 num text-end" data-testid={`line-total-${i}`}>
                {safe(() => toFixed(lineTotal(l)))}
              </td>
              <td className="px-1">
                <button
                  aria-label="حذف البند"
                  onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                  className="rounded p-1 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between border-t bg-muted/40 px-3 py-2 text-sm">
        <span>الإجمالي التقديري</span>
        <span className="font-semibold num" data-testid="grand-total">
          {safe(() => formatMoney(toFixed(linesTotal(lines)), currency))}
        </span>
      </div>
    </div>
  );
}
