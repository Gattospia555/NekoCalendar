import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Language } from "@/domain/types";
import { translate, type Params } from "./i18n";
import type { MessageKey } from "./messages";

interface I18n {
  language: Language;
  t: (key: MessageKey | string, params?: Params) => string;
}

const I18nContext = createContext<I18n>({
  language: "it",
  t: (key, params) => translate("it", key, params),
});

/** Fornisce la lingua scelta a tutta l'interfaccia. */
export function I18nProvider({ language, children }: { language: Language; children: ReactNode }) {
  const value = useMemo<I18n>(
    () => ({ language, t: (key, params) => translate(language, key, params) }),
    [language],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18n {
  return useContext(I18nContext);
}
