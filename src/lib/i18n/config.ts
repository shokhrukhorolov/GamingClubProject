export const LOCALES = ["ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";
export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined): value is Locale {
  return value === "ru" || value === "en";
}
