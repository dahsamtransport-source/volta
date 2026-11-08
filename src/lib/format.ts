export const LOCALE = "ar-YE";
export const DEFAULT_CURRENCY = "YER";

export function formatNumber(v: number | string | null | undefined, digits = 0): string {
  if (v === null || v === undefined || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return String(v);
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(n);
}

/** Display-only formatting of a decimal string from the server (authoritative). */
export function formatMoney(v: string | number | null | undefined, currency = DEFAULT_CURRENCY): string {
  if (v === null || v === undefined || v === "") return "—";
  return `${formatNumber(v, currency === "YER" ? 0 : 2)} ${currency === "YER" ? "ر.ي" : currency}`;
}

export function formatDate(v: string | Date | null | undefined): string {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  if (Number.isNaN(d.getTime())) return String(v);
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: "Asia/Aden" }).format(d);
}

/** Yemen mobile: +967 7X XXX XXXX */
export function formatYemenPhone(raw: string | null | undefined): string {
  if (!raw) return "—";
  const d = raw.replace(/\D/g, "").replace(/^00967|^967/, "").replace(/^0/, "");
  if (d.length === 9) return `+967 ${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return raw;
}