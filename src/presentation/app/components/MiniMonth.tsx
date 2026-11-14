import { useMemo, useState } from "react";
import { monthGrid } from "@/domain/calendarGrid";
import { addDays, addMonths, startOfMonth } from "@/domain/datetime";
import { busyDays } from "@/domain/occurrences";
import type { DateKey, Occurrence } from "@/domain/types";
import { formatDayLong, formatMonthYear, weekdayNames } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { Icon } from "./Icons";

interface MiniMonthProps {
  /** Giorno mostrato nel calendario grande: il mini calendario lo segue. */
  anchor: DateKey;
  today: DateKey;
  /** Occorrenze di un intervallo `[from, to)`: servono per i pallini dei giorni pieni. */
  query: (from: DateKey, to: DateKey) => Occurrence[];
  onPick: (day: DateKey, source?: Element) => void;
}

/**
 * Mini calendario del mese nella colonna sinistra: si sfoglia da solo con le frecce
 * e, cliccando un giorno, apre quel giorno nella vista Giorno.
 */
export function MiniMonth({ anchor, today, query, onPick }: MiniMonthProps) {
  const { t, language } = useI18n();
  // Il mese sfogliato con le frecce; quando il calendario grande cambia mese, si riparte da lì.
  const anchorMonth = startOfMonth(anchor);
  const [shown, setShown] = useState({ base: anchorMonth, month: anchorMonth });
  if (shown.base !== anchorMonth) setShown({ base: anchorMonth, month: anchorMonth });
  const month = shown.month;
  const setMonth = (change: (m: DateKey) => DateKey) =>
    setShown((s) => ({ ...s, month: change(s.month) }));

  const weeks = useMemo(() => monthGrid(month), [month]);
  const from = weeks[0][0];
  const to = addDays(weeks[5][6], 1);
  const busy = useMemo(() => busyDays(query(from, to), from, to), [query, from, to]);
  const letters = weekdayNames(language, "narrow");

  return (
    <section className="mini-month" aria-label={t("mini.title")}>
      <div className="mini-head">
        <span className="mini-title">{formatMonthYear(language, month)}</span>
        <button
          type="button"
          className="mini-nav"
          aria-label={t("mini.previous")}
          onClick={() => setMonth((m) => addMonths(m, -1))}
        >
          <Icon name="left" size={14} />
        </button>
        <button
          type="button"
          className="mini-nav"
          aria-label={t("mini.next")}
          onClick={() => setMonth((m) => addMonths(m, 1))}
        >
          <Icon name="right" size={14} />
        </button>
      </div>
      <div className="mini-grid">
        {letters.map((letter, i) => (
          <span key={i} className="mini-weekday" aria-hidden="true">
            {letter}
          </span>
        ))}
        {weeks.flat().map((day) => {
          const classes = [
            "mini-day",
            day === today ? "is-today" : "",
            day === anchor ? "is-selected" : "",
            startOfMonth(day) !== month ? "is-other" : "",
            busy.has(day) ? "is-busy" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={day}
              type="button"
              className={classes}
              aria-label={formatDayLong(language, day)}
              aria-current={day === today ? "date" : undefined}
              onClick={(event) => onPick(day, event.currentTarget)}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>
    </section>
  );
}
