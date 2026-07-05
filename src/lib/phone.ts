/**
 * Normalize a phone number to a canonical form for storage and lookup:
 * strips spaces, dashes, and parentheses, keeping only digits and a leading +.
 * "+998 90 123-45-67" -> "+998901234567"
 */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}
