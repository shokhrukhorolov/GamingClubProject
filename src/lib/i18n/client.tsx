"use client";

import { createContext, useContext } from "react";
import { Locale } from "./config";
import { Dictionary } from "./dictionaries";

type LocaleContextValue = { locale: Locale; t: Dictionary };

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={{ locale, t: dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Convenience: returns the dictionary directly. */
export function useT(): Dictionary {
  return useLocale().t;
}
