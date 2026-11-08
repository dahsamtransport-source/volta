/**
 * Decimal-safe fixed-point arithmetic using BigInt (no JS float).
 * Used for client-side DRAFT line-item previews only; server/database values are authoritative.
 */
export const SCALE = 4; // internal precision digits
const FACTOR = 10n ** BigInt(SCALE);

export type Dec = bigint; // value * 10^SCALE

export function parseDec(input: string | number | null | undefined): Dec {
  if (input === null || input === undefined || input === "") return 0n;
  const s = String(input).trim().replace(/[٬,\s]/g, "").replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace("٫", ".");
  if (!/^-?\d*(\.\d*)?$/.test(s) || s === "-" || s === ".") throw new Error(`قيمة رقمية غير صالحة: ${input}`);
  const neg = s.startsWith("-");
  const [intPart = "0", frac = ""] = s.replace("-", "").split(".");
  const fracPadded = (frac + "0".repeat(SCALE + 1)).slice(0, SCALE + 1);
  let v = BigInt(intPart || "0") * FACTOR + BigInt(fracPadded.slice(0, SCALE));
  if (Number(fracPadded[SCALE]) >= 5) v += 1n; // half-up
  return neg ? -v : v;
}

export const add = (a: Dec, b: Dec): Dec => a + b;
export const sub = (a: Dec, b: Dec): Dec => a - b;

export function mul(a: Dec, b: Dec): Dec {
  const p = a * b;
  const half = FACTOR / 2n;
  return p >= 0n ? (p + half) / FACTOR : -((-p + half) / FACTOR);
}

/** Round to `digits` decimals (half-up), staying in internal scale. */
export function round(a: Dec, digits = 2): Dec {
  const step = 10n ** BigInt(SCALE - digits);
  const half = step / 2n;
  const abs = a < 0n ? -a : a;
  const r = ((abs + half) / step) * step;
  return a < 0n ? -r : r;
}

export function toFixed(a: Dec, digits = 2): string {
  const r = round(a, digits);
  const neg = r < 0n;
  const abs = neg ? -r : r;
  const int = abs / FACTOR;
  const frac = (abs % FACTOR).toString().padStart(SCALE, "0").slice(0, digits);
  return `${neg ? "-" : ""}${int}${digits > 0 ? "." + frac : ""}`;
}

export interface DraftLine {
  quantity: string;
  unitPrice: string;
  discountPercent: string;
}

export function lineTotal(l: DraftLine): Dec {
  const gross = mul(parseDec(l.quantity), parseDec(l.unitPrice));
  const disc = mul(gross, mul(parseDec(l.discountPercent), parseDec("0.01")));
  return round(sub(gross, disc), 2);
}

export function linesTotal(lines: DraftLine[]): Dec {
  return lines.reduce((acc, l) => add(acc, lineTotal(l)), 0n);
}