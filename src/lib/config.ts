/** Connection config for the EXISTING external project. Only a publishable/anon key may be used in the browser. */
export const FIELD_SALES_PROJECT_REF = "dymxnmpaaobxoaowksoc";
export const FIELD_SALES_URL = `https://${FIELD_SALES_PROJECT_REF}.supabase.co`;
export const FIELD_SALES_SCHEMA = "field_sales";

export type KeyCheck =
  | { ok: true; key: string }
  | { ok: false; reason: "missing" | "secret_key" | "service_role" | "wrong_project" };

function decodeJwtPayload(key: string): Record<string, unknown> | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try {
    const segment = parts[1];
    if (!segment) return null;
    const b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=")));
  } catch {
    return null;
  }
}

/** Fail closed: reject anything that is not a publishable/anon key for this project. */
export function checkPublishableKey(key: string | undefined | null): KeyCheck {
  if (!key || !key.trim()) return { ok: false, reason: "missing" };
  const k = key.trim();
  if (k.startsWith("sb_secret_")) return { ok: false, reason: "secret_key" };
  if (k.startsWith("sb_publishable_")) return { ok: true, key: k };
  const payload = decodeJwtPayload(k);
  if (!payload) return { ok: false, reason: "missing" };
  if (payload["role"] === "service_role") return { ok: false, reason: "service_role" };
  if (payload["ref"] && payload["ref"] !== FIELD_SALES_PROJECT_REF) return { ok: false, reason: "wrong_project" };
  return { ok: true, key: k };
}

export function getKeyCheck(): KeyCheck {
  return checkPublishableKey(import.meta.env["VITE_FIELD_SALES_PUBLISHABLE_KEY"] as string | undefined);
}

export const KEY_REASON_TEXT: Record<Exclude<KeyCheck, { ok: true }>["reason"], string> = {
  missing: "لم يتم إعداد المفتاح العام (publishable/anon) بعد.",
  secret_key: "تم رفض المفتاح: هذا مفتاح سري ولا يجوز استخدامه في المتصفح.",
  service_role: "تم رفض المفتاح: مفتاح service_role محظور في المتصفح.",
  wrong_project: "تم رفض المفتاح: لا يخص مشروع لحج زيوت.",
};