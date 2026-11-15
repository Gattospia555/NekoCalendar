import { createContext, useContext } from "react";
import type { Occurrence } from "@/domain/types";
import { useI18n } from "@/presentation/i18n/I18nContext";

export { eventStyle } from "./eventPalette";

/** Titolo completo di un'occorrenza, con l'età per compleanni e anniversari. */
export function useOccurrenceTitle() {
  const { t } = useI18n();
  return (occurrence: Occurrence) =>
    occurrence.years
      ? `${occurrence.title} · ${t("occ.years", { n: occurrence.years })}`
      : occurrence.title;
}

/** Id dell'evento appena salvato: le sue etichette fanno un breve "pop" per farsi trovare. */
export const FreshEventContext = createContext<string | null>(null);

/** Classe CSS da aggiungere alle etichette dell'evento appena salvato. */
export function useFreshClass(eventId: string): string {
  return useContext(FreshEventContext) === eventId ? " is-fresh" : "";
}
