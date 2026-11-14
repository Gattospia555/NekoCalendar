import { addDays, dateOf, minutesBetween } from "./datetime";
import type { Occurrence } from "./types";

/**
 * Neko, il gatto di NekoCalendar: cosa dice e com'è il cielo, in base all'ora e
 * agli impegni. Logica pura: l'interfaccia traduce la chiave in un testo (IT/EN).
 */

/** Momento della giornata: decide il colore del cielo (lo sfondo) e l'umore di Neko. */
export type SkyPeriod = "morning" | "afternoon" | "evening" | "night";

/** Mattina 5-12, pomeriggio 12-18, sera 18-22, notte 22-5. */
export function skyPeriod(now: string): SkyPeriod {
  const hour = Number(now.slice(11, 13));
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

/** Le frasi di Neko: ognuna è una chiave dei testi `neko.<chiave>`. */
export type NekoMessageKey =
  "now" | "soon" | "later" | "task" | "tomorrow" | "free" | "sleepy" | "sleepyTomorrow";

export interface NekoMessage {
  key: NekoMessageKey;
  /** Titolo dell'impegno di cui parla (vuoto se non parla di un impegno). */
  title: string;
  /** Minuti che mancano (solo per "soon"). */
  minutes: number;
  /** Ora dell'impegno, "HH:MM" (solo per "later" e "tomorrow"). */
  time: string;
  /** Neko dorme? (di notte): l'interfaccia mostra il gatto con gli occhi chiusi. */
  sleepy: boolean;
}

/** Entro quanti minuti un impegno è "tra poco". */
const SOON_MINUTES = 60;

/**
 * Cosa dice Neko adesso. Regole, in ordine:
 * 1. di notte ha sonno (e se c'è qualcosa domani lo ricorda);
 * 2. un impegno in corso: "adesso c'è…";
 * 3. un impegno entro un'ora: "tra N minuti…";
 * 4. più tardi oggi: "oggi alle HH:MM…";
 * 5. un'attività da fare oggi ancora aperta;
 * 6. la sera, senza altro oggi: "domani…";
 * 7. altrimenti giornata libera.
 *
 * @param now ora locale "YYYY-MM-DDTHH:MM"
 * @param upcoming occorrenze future o in corso, ordinate (come `upcoming()`)
 */
export function nekoMessage(now: string, upcoming: readonly Occurrence[]): NekoMessage {
  const today = dateOf(now);
  const period = skyPeriod(now);
  // Dopo mezzanotte "domani" è già oggi: di notte Neko parla del primo impegno che viene.
  const tomorrow = period === "night" && Number(now.slice(11, 13)) < 5 ? today : addDays(today, 1);
  const base = { title: "", minutes: 0, time: "", sleepy: false };
  const timed = upcoming.filter((o) => !o.allDay && o.kind !== "holiday" && !o.done);
  const firstTomorrow = upcoming.find(
    (o) => dateOf(o.start) === tomorrow && o.start > now && o.kind !== "holiday" && !o.done,
  );
  const tomorrowMessage = (key: "tomorrow" | "sleepyTomorrow", sleepy: boolean) =>
    firstTomorrow
      ? {
          ...base,
          key,
          sleepy,
          title: firstTomorrow.title,
          time: firstTomorrow.allDay ? "" : firstTomorrow.start.slice(11, 16),
        }
      : null;

  if (period === "night") {
    return tomorrowMessage("sleepyTomorrow", true) ?? { ...base, key: "sleepy", sleepy: true };
  }

  // Un'attività non è "in corso": ha solo una scadenza.
  const current = timed.find(
    (o) => o.kind !== "task" && minutesBetween(o.start, now) >= 0 && minutesBetween(now, o.end) > 0,
  );
  if (current) return { ...base, key: "now", title: current.title };

  const nextToday = timed.find((o) => dateOf(o.start) === today && o.start > now);
  if (nextToday) {
    const minutes = minutesBetween(now, nextToday.start);
    if (minutes <= SOON_MINUTES) return { ...base, key: "soon", title: nextToday.title, minutes };
    return { ...base, key: "later", title: nextToday.title, time: nextToday.start.slice(11, 16) };
  }

  const task = upcoming.find((o) => o.kind === "task" && !o.done && dateOf(o.start) === today);
  if (task) return { ...base, key: "task", title: task.title };

  if (period === "evening") {
    const message = tomorrowMessage("tomorrow", false);
    if (message) return message;
  }
  return { ...base, key: "free" };
}
