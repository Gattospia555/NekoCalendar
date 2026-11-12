import { useMemo } from "react";
import type { CalendarView, DateKey } from "@/domain/types";
import type { CalendarApp } from "../useCalendarApp";
import { runTransition } from "./viewTransition";

/**
 * La navigazione del calendario con le animazioni: stessi comandi di
 * `app.navigation`, ma ogni spostamento passa da una View Transition.
 * - avanti / indietro: la pagina si alza o scende come un calendario da muro;
 * - cambio vista e "Oggi": dissolvenza con un leggero zoom;
 * - apertura di un giorno: la casella cliccata si allarga fino alla vista Giorno.
 */
export function useAnimatedNavigation(navigation: CalendarApp["navigation"], view: CalendarView) {
  return useMemo(
    () => ({
      previous: () => runTransition("previous", navigation.previous),
      next: () => runTransition("next", navigation.next),
      goToday: () => runTransition("today", navigation.goToday),
      setView: (next: CalendarView) => {
        if (next !== view) runTransition("view", () => navigation.setView(next));
      },
      openDay: (day: DateKey, source?: Element) =>
        runTransition("zoom", () => navigation.openDay(day), { source, target: "zoom" }),
    }),
    [navigation, view],
  );
}
