import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarService } from "@/application/calendarService";
import type { Snapshot } from "@/application/store";
import { shiftAnchor, viewRange } from "@/domain/calendarGrid";
import { addDays, dateOf, instantToLocal, systemTimeZone } from "@/domain/datetime";
import type { EventDraft } from "@/domain/eventDraft";
import { buildOccurrences, occurrencesOnDay, upcoming } from "@/domain/occurrences";
import type {
  Calendar,
  CalendarEvent,
  CalendarView,
  DateKey,
  Occurrence,
  Settings,
} from "@/domain/types";

/** Ora locale corrente, aggiornata allo scoccare di ogni minuto (niente timer al secondo). */
function useNow(timeZone: string): string {
  const [now, setNow] = useState(() => instantToLocal(Date.now(), timeZone));
  useEffect(() => {
    let timer = 0;
    const schedule = () => {
      const ms = Date.now();
      timer = window.setTimeout(
        () => {
          setNow(instantToLocal(Date.now(), timeZone));
          schedule();
        },
        60_000 - (ms % 60_000) + 50,
      );
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") setNow(instantToLocal(Date.now(), timeZone));
    };
    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [timeZone]);
  return now;
}

export type Scope = "one" | "all";

/**
 * Come si è arrivati alla vista corrente: decide la direzione dell'animazione
 * (avanti da destra, indietro da sinistra, cambio vista in dissolvenza).
 * `tick` cambia a ogni spostamento, anche quando si preme "Oggi" restando su oggi.
 */
export interface Transition {
  kind: "none" | "next" | "previous" | "view" | "today";
  tick: number;
}

/** Quanto resta evidenziato l'evento appena salvato (deve superare l'animazione). */
const FRESH_MS = 1600;

export function useCalendarApp(service: CalendarService, initial: Snapshot) {
  const [snapshot, setSnapshot] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const settings = useMemo(() => CalendarService.settingsOf(snapshot), [snapshot]);
  const timeZone = useMemo(() => systemTimeZone(), []);
  const now = useNow(timeZone);
  const today = dateOf(now);
  const [view, setView] = useState<CalendarView>(settings.defaultView);
  const [anchor, setAnchor] = useState<DateKey>(today);
  const [transition, setTransition] = useState<Transition>({ kind: "none", tick: 0 });
  const [freshEventId, setFreshEventId] = useState<string | null>(null);

  // L'evidenziazione dell'evento appena salvato si spegne da sola.
  useEffect(() => {
    if (!freshEventId) return;
    const timer = window.setTimeout(() => setFreshEventId(null), FRESH_MS);
    return () => window.clearTimeout(timer);
  }, [freshEventId]);

  const calendars = useMemo(() => snapshot.calendars.filter((c) => !c.deleted), [snapshot]);
  const eventsById = useMemo(() => new Map(snapshot.events.map((e) => [e.id, e])), [snapshot]);

  const query = useCallback(
    (from: DateKey, to: DateKey) =>
      buildOccurrences({
        events: snapshot.events,
        exceptions: snapshot.exceptions,
        calendars,
        from,
        to,
        displayTimeZone: timeZone,
        showHolidays: settings.showHolidays,
        language: settings.language,
      }),
    [snapshot, calendars, timeZone, settings.showHolidays, settings.language],
  );

  const range = useMemo(() => viewRange(view, anchor), [view, anchor]);
  const occurrences = useMemo(() => query(range.from, range.to), [query, range]);
  const nextDays = useMemo(() => query(today, addDays(today, 30)), [query, today]);
  const upcomingList = useMemo(() => upcoming(nextDays, now, 6), [nextDays, now]);
  const todayList = useMemo(() => occurrencesOnDay(nextDays, today), [nextDays, today]);

  /** Task aperti (prima i più urgenti) e gli ultimi completati. */
  const tasks = useMemo(() => {
    const all = snapshot.events.filter((e) => e.kind === "task" && !e.deleted);
    const visible = new Set(calendars.filter((c) => c.visible).map((c) => c.id));
    const open = all
      .filter((e) => !e.done && visible.has(e.calendarId))
      .sort((a, b) => (a.start < b.start ? -1 : 1));
    const done = all.filter((e) => e.done && visible.has(e.calendarId)).slice(-3);
    return [...open, ...done];
  }, [snapshot, calendars]);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
        setSnapshot(await service.load());
        setError(null);
        return true;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
        return false;
      }
    },
    [service],
  );

  const actions = useMemo(
    () => ({
      saveEvent: (draft: EventDraft, existing?: CalendarEvent) =>
        run(async () => {
          const saved = await service.saveDraft(draft, existing);
          setFreshEventId(saved.id);
        }),
      saveOccurrence: (event: CalendarEvent, occurrenceStart: string, draft: EventDraft) =>
        run(async () => {
          await service.editOccurrence(event, occurrenceStart, draft, snapshot.exceptions);
          setFreshEventId(event.id);
        }),
      deleteEvent: (event: CalendarEvent) => run(() => service.deleteEvent(event)),
      deleteOccurrence: (event: CalendarEvent, occurrenceStart: string) =>
        run(() => service.deleteOccurrence(event, occurrenceStart, snapshot.exceptions)),
      setTaskDone: (event: CalendarEvent, done: boolean) =>
        run(() => service.setTaskDone(event, done)),
      setCalendarVisible: (calendar: Calendar, visible: boolean) =>
        run(() => service.setCalendarVisible(calendar, visible)),
      createCalendar: (name: string, color: string) =>
        run(() => service.createCalendar(name, color, calendars.length)),
      saveSettings: (next: Settings) => run(() => service.saveSettings(next)),
    }),
    [run, service, snapshot.exceptions, calendars.length],
  );

  const navigation = useMemo(() => {
    const move = (kind: Transition["kind"]) => setTransition((t) => ({ kind, tick: t.tick + 1 }));
    return {
      setView: (next: CalendarView) => {
        if (next === view) return;
        move("view");
        setView(next);
      },
      setAnchor,
      goToday: () => {
        move("today");
        setAnchor(today);
      },
      previous: () => {
        move("previous");
        setAnchor((a) => shiftAnchor(view, a, -1));
      },
      next: () => {
        move("next");
        setAnchor((a) => shiftAnchor(view, a, 1));
      },
      openDay: (day: DateKey) => {
        move("view");
        setAnchor(day);
        setView("day");
      },
    };
  }, [today, view]);

  const eventOf = useCallback(
    (occurrence: Occurrence) => eventsById.get(occurrence.eventId),
    [eventsById],
  );

  return {
    snapshot,
    settings,
    calendars,
    timeZone,
    now,
    today,
    view,
    anchor,
    transition,
    freshEventId,
    occurrences,
    upcomingList,
    todayList,
    tasks,
    error,
    clearError: () => setError(null),
    actions,
    navigation,
    eventOf,
  };
}

export type CalendarApp = ReturnType<typeof useCalendarApp>;
