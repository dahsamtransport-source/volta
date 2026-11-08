/**
 * Normalize local Yemeni mobile numbers for Supabase Phone Auth.
 * Accepts +967XXXXXXXXX, 00967XXXXXXXXX, 967XXXXXXXXX, 07XXXXXXXX,
 * or the common nine-digit local form. Invalid phone-like input is rejected.
 */
export function normalizeYemenPhone(value: string): string | null {
  const input = value.trim();
  if (!input || input.includes("@")) return null;

  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00967")) digits = digits.slice(2);
  if (digits.startsWith("967")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length !== 9 || !digits.startsWith("7")) return null;
  return "+967" + digits;
}

export function isPhoneLike(value: string): boolean {
  return /^[+\d\s().-]+$/.test(value.trim());
}
