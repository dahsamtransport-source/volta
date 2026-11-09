/**
 * Normalize Yemeni mobile numbers to E.164 for Supabase Phone Auth.
 * Accepts +967XXXXXXXXX, 00967XXXXXXXXX, 967XXXXXXXXX, 07XXXXXXXX,
 * and the common nine-digit local form. Arabic-Indic digits are accepted.
 */

function toAsciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x660 && code <= 0x669 ? code - 0x660 : code - 0x6f0);
  });
}

function isPhoneCharactersOnly(value: string): boolean {
  return /^[+\d\s().-]+$/.test(value);
}

export function normalizeYemenPhone(value: string): string | null {
  const input = toAsciiDigits(value.trim());
  if (!input || input.includes("@") || !isPhoneCharactersOnly(input)) return null;

  const compact = input.replace(/[\s().-]/g, "");
  const plusCount = (compact.match(/\+/g) ?? []).length;
  if (plusCount > 1 || (plusCount === 1 && !compact.startsWith("+"))) return null;

  let digits = compact.replace(/\D/g, "");
  if (compact.startsWith("+") && !digits.startsWith("967")) return null;

  if (digits.startsWith("00967")) digits = digits.slice(5);
  else if (digits.startsWith("967")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);

  if (digits.length !== 9 || !digits.startsWith("7")) return null;
  return "+967" + digits;
}

export function isPhoneLike(value: string): boolean {
  return isPhoneCharactersOnly(toAsciiDigits(value.trim()));
}
