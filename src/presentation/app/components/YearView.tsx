import { isSameMonth, monthGrid, yearMonths } from "@/domain/calendarGrid";
import { dateOf, parseDateKey } from "@/domain/datetime";
import type { DateKey, Occurrence } from "@/domain/types";
import { formatDayLong, formatMonth, weekdayNames } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";

interface YearViewProps {
  anchor: DateKey;
  today: DateKey;
  occurrences: Occurrence[];
  onOpenDay: (day: DateKey) => void;
}

/** Vista "anno": 12 mini-mesi; un puntino segna i giorni con almeno un evento. */
export function YearView({ anchor, today, occurrences, onOpenDay }: YearViewProps) {
  const { language } = useI18n();
  const busy = new Set(occurrences.map((o) => dateOf(o.start)));
  const letters = weekdayNames(language, "narrow");

  return (
    <div className="year">
      {yearMonths(anchor).map((first) => (
        <section key={first} className="year-month card" aria-label={formatMonth(language, first)}>
          <h2>{formatMonth(language, first)}</h2>
          <div className="year-grid">
            {letters.map((letter, i) => (
              <span key={`${letter}${i}`} className="year-weekday" aria-hidden="true">
                {letter}
              </span>
            ))}
            {monthGrid(first)
              .flat()
              .map((day) =>
                isSameMonth(day, first) ? (
                  <button
                    key={day}
                    type="button"
                    className={`year-day${day === today ? " is-today" : ""}${busy.has(day) ? " is-busy" : ""}`}
                    aria-label={formatDayLong(language, day)}
                    aria-current={day === today ? "date" : undefined}
                    onClick={() => onOpenDay(day)}
                  >
                    {parseDateKey(day).day}
                  </button>
                ) : (
                  <span key={day} aria-hidden="true" />
                ),
              )}
          </div>
        </section>
      ))}
    </div>
  );
}
