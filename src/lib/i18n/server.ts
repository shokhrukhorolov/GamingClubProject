import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, Locale } from "./config";
import { dictionaryFor, Dictionary } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaryFor(await getLocale());
}
