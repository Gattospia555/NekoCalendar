import { createContext, useContext, type CSSProperties } from "react";
import type { Occurrence } from "@/domain/types";
import { useI18n } from "@/presentation/i18n/I18nContext";

/** Colore dell'evento come variabile CSS (le tinte chiare/scure le calcola il CSS). */
export function tint(color: string): CSSProperties {
  return { "--event-color": color } as CSSProperties;
}

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

/** Colori proposti per eventi e calendari (oltre al colore del calendario). */
export const EVENT_COLORS = [
  "#c58463",
  "#d06a8c",
  "#4f7fb8",
  "#2f7f86",
  "#2e9a5e",
  "#c99a00",
  "#8a63c8",
  "#7a6a5f",
];
