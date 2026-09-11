import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Locale, Localized } from "@shared/content";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (value: Localized) => string;
}>({
  locale: "fr",
  setLocale: () => undefined,
  t: (value) => value.fr,
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("fr");
  const value = useMemo(() => ({ locale, setLocale, t: (entry: Localized) => entry[locale] }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
