/**
 * Bozza di un evento, cioè i valori del modulo "Nuovo/Modifica evento":
 * creazione dai default, controlli e conversione in `CalendarEvent`.
 * I messaggi d'errore sono chiavi di traduzione (vedi `src/i18n`).
 */
import {
  addDays,
  addMinutes,
  compareLocal,
  daysBetween,
  isDateKey,
  isLocalDateTime,
  minutesBetween,
} from "./datetime";
import {
  isValidRule,
  ruleFromString,
  ruleToString,
  type Frequency,
  type RuleSpec,
} from "./recurrence";
import type { CalendarEvent, DateKey, EventKind } from "./types";

export type RepeatChoice = "none" | "daily" | "weekly" | "monthly" | "yearly" | "custom";
export type RepeatEnd = "never" | "count" | "until";

export interface EventDraft {
  title: string;
  calendarId: string;
  kind: Exclude<EventKind, "holiday">;
  allDay: boolean;
  startDate: DateKey;
  /** `"HH:mm"`, ignorata per gli eventi di tutto il giorno. */
  startTime: string;
  /** Per gli eventi di tutto il giorno è l'ultimo giorno incluso (come lo vede l'utente). */
  endDate: DateKey;
  endTime: string;
  location: string;
  description: string;
  color: string | null;
  repeat: RepeatChoice;
  interval: number;
  byDay: number[];
  repeatEnd: RepeatEnd;
  count: number;
  until: DateKey;
  /** Regola avanzata (es. importata) che l'editor mostra ma non scompone. */
  customRule: string | null;
  reminders: number[];
  done: boolean;
}

export type DraftField =
  "title" | "calendarId" | "start" | "end" | "repeat" | "reminders" | "color";
export type DraftErrors = Partial<Record<DraftField, string>>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const COLOR_RE = /^#[0-9a-f]{6}$/i;
export const MAX_TITLE_LENGTH = 200;
const FREQ_BY_CHOICE: Record<Exclude<RepeatChoice, "none" | "custom">, Frequency> = {
  daily: "DAILY",
  weekly: "WEEKLY",
  monthly: "MONTHLY",
  yearly: "YEARLY",
};

function hourAfter(time: string): { time: string; nextDay: boolean } {
  const next = addMinutes(`2000-01-01T${time}`, 60);
  return { time: next.slice(11), nextDay: next.slice(0, 10) !== "2000-01-01" };
}

/** Bozza vuota per un nuovo elemento nel giorno `day` (e all'ora `time`, se scelta). */
export function draftForNew(
  day: DateKey,
  calendarId: string,
  kind: EventDraft["kind"] = "event",
  time: string | null = null,
): EventDraft {
  const startTime = time ?? "09:00";
  const end = hourAfter(startTime);
  const yearly = kind === "birthday" || kind === "anniversary";
  return {
    title: "",
    calendarId,
    kind,
    allDay: yearly,
    startDate: day,
    startTime,
    endDate: end.nextDay ? addDays(day, 1) : day,
    endTime: kind === "task" ? startTime : end.time,
    location: "",
    description: "",
    color: null,
    repeat: yearly ? "yearly" : "none",
    interval: 1,
    byDay: [],
    repeatEnd: "never",
    count: 10,
    until: addDays(day, 90),
    customRule: null,
    reminders: kind === "task" ? [] : yearly ? [24 * 60] : [10],
    done: false,
  };
}

/** Bozza che riproduce un evento esistente, per modificarlo. */
export function draftFromEvent(event: CalendarEvent): EventDraft {
  const base = draftForNew(
    event.start.slice(0, 10),
    event.calendarId,
    event.kind === "holiday" ? "event" : event.kind,
  );
  const draft: EventDraft = {
    ...base,
    title: event.title,
    allDay: event.allDay,
    startDate: event.start.slice(0, 10),
    startTime: event.allDay ? base.startTime : event.start.slice(11, 16),
    // Per l'utente la fine di un evento di tutto il giorno è l'ultimo giorno incluso.
    endDate: event.allDay ? addDays(event.end, -1) : event.end.slice(0, 10),
    endTime: event.allDay ? base.endTime : event.end.slice(11, 16),
    location: event.location,
    description: event.description,
    color: event.color,
    reminders: [...event.reminders],
    done: event.done,
    repeat: "none",
    customRule: null,
  };
  if (event.rrule) {
    const spec = ruleFromString(event.rrule);
    if (!spec) return { ...draft, repeat: "custom", customRule: event.rrule };
    const choice = (Object.keys(FREQ_BY_CHOICE) as (keyof typeof FREQ_BY_CHOICE)[]).find(
      (key) => FREQ_BY_CHOICE[key] === spec.freq,
    );
    return {
      ...draft,
      repeat: choice ?? "custom",
      interval: spec.interval,
      byDay: spec.byDay,
      repeatEnd: spec.end.type,
      count: spec.end.type === "count" ? spec.end.count : draft.count,
      until: spec.end.type === "until" ? spec.end.until : draft.until,
    };
  }
  return draft;
}

/**
 * Bozza per modificare una sola ripetizione: parte dai valori della serie ma con
 * data, orari e titolo di quella occorrenza; la ripetizione non si modifica qui.
 */
export function draftForOccurrence(
  event: CalendarEvent,
  occurrence: { start: string; end: string; title: string },
): EventDraft {
  const base = draftFromEvent(event);
  return {
    ...base,
    title: occurrence.title,
    startDate: occurrence.start.slice(0, 10),
    startTime: event.allDay ? base.startTime : occurrence.start.slice(11, 16),
    endDate: event.allDay ? addDays(occurrence.end, -1) : occurrence.end.slice(0, 10),
    endTime: event.allDay ? base.endTime : occurrence.end.slice(11, 16),
    repeat: "none",
    customRule: null,
  };
}

function startOf(draft: EventDraft): string {
  return draft.allDay ? draft.startDate : `${draft.startDate}T${draft.startTime}`;
}

function endOf(draft: EventDraft): string {
  if (draft.kind === "task") return startOf(draft); // un task ha solo la scadenza
  return draft.allDay ? addDays(draft.endDate, 1) : `${draft.endDate}T${draft.endTime}`;
}

/** Regola RRULE della bozza, o `null` se non si ripete. */
export function ruleOf(draft: EventDraft): string | null {
  if (draft.repeat === "none") return null;
  if (draft.repeat === "custom") return draft.customRule;
  const spec: RuleSpec = {
    freq: FREQ_BY_CHOICE[draft.repeat],
    interval: draft.interval,
    byDay: draft.repeat === "weekly" ? draft.byDay : [],
    end:
      draft.repeatEnd === "count"
        ? { type: "count", count: draft.count }
        : draft.repeatEnd === "until"
          ? { type: "until", until: draft.until }
          : { type: "never" },
  };
  return ruleToString(spec, draft.allDay);
}

/** Controlla la bozza. Un oggetto vuoto significa "tutto a posto". */
export function validateDraft(draft: EventDraft): DraftErrors {
  const errors: DraftErrors = {};
  const title = draft.title.trim();
  if (!title) errors.title = "errors.titleRequired";
  else if (title.length > MAX_TITLE_LENGTH) errors.title = "errors.titleTooLong";
  if (!draft.calendarId) errors.calendarId = "errors.calendarRequired";
  if (draft.color !== null && !COLOR_RE.test(draft.color)) errors.color = "errors.colorInvalid";

  const startValid = isDateKey(draft.startDate) && (draft.allDay || TIME_RE.test(draft.startTime));
  if (!startValid) errors.start = "errors.startInvalid";
  if (draft.kind !== "task") {
    const endValid = isDateKey(draft.endDate) && (draft.allDay || TIME_RE.test(draft.endTime));
    if (!endValid) errors.end = "errors.endInvalid";
    else if (startValid) {
      const ok = draft.allDay
        ? daysBetween(draft.startDate, draft.endDate) >= 0
        : minutesBetween(startOf(draft), endOf(draft)) > 0;
      if (!ok) errors.end = "errors.endBeforeStart";
    }
  }

  if (draft.repeat !== "none") {
    if (draft.repeat === "custom") {
      if (!draft.customRule || !isValidRule(draft.customRule))
        errors.repeat = "errors.repeatInvalid";
    } else if (!Number.isInteger(draft.interval) || draft.interval < 1 || draft.interval > 999) {
      errors.repeat = "errors.intervalInvalid";
    } else if (
      draft.repeatEnd === "count" &&
      (!Number.isInteger(draft.count) || draft.count < 1 || draft.count > 9999)
    ) {
      errors.repeat = "errors.countInvalid";
    } else if (
      draft.repeatEnd === "until" &&
      (!isDateKey(draft.until) || draft.until < draft.startDate)
    ) {
      errors.repeat = "errors.untilInvalid";
    }
  }

  if (draft.reminders.some((m) => !Number.isInteger(m) || m < 0 || m > 60 * 24 * 28)) {
    errors.reminders = "errors.reminderInvalid";
  }
  return errors;
}

export interface EventIdentity {
  id: string;
  tzid: string;
  updatedHlc: string;
}

/** Trasforma una bozza valida in evento (lancia un errore se la bozza non è valida). */
export function eventFromDraft(draft: EventDraft, identity: EventIdentity): CalendarEvent {
  const errors = validateDraft(draft);
  if (Object.keys(errors).length > 0)
    throw new RangeError(`Bozza non valida: ${Object.keys(errors).join(", ")}`);
  const start = startOf(draft);
  const end = endOf(draft);
  if (!draft.allDay && (!isLocalDateTime(start) || compareLocal(end, start) < 0)) {
    throw new RangeError("Orari non validi");
  }
  return {
    id: identity.id,
    calendarId: draft.calendarId,
    kind: draft.kind,
    title: draft.title.trim(),
    description: draft.description.trim(),
    location: draft.location.trim(),
    allDay: draft.allDay,
    start,
    end,
    tzid: identity.tzid,
    rrule: ruleOf(draft),
    color: draft.color,
    reminders: [...new Set(draft.reminders)].sort((a, b) => a - b),
    done: draft.kind === "task" ? draft.done : false,
    updatedHlc: identity.updatedHlc,
    deleted: false,
  };
}
