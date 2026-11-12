import { isSameMonth, monthGrid } from "@/domain/calendarGrid";
import { parseDateKey } from "@/domain/datetime";
import { occurrencesOnDay } from "@/domain/occurrences";
import type { DateKey, Occurrence } from "@/domain/types";
import { formatDayLong, weekdayNames } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { OccurrenceChip } from "./OccurrenceBits";

/** Etichette visibili per giorno; oltre si mostra "+N altri". */
const MAX_CHIPS = 3;

interface MonthViewProps {
  anchor: DateKey;
  today: DateKey;
  occurrences: Occurrence[];
  onOpen: (occurrence: Occurrence) => void;
  onNewOnDay: (day: DateKey) => void;
  onOpenDay: (day: DateKey) => void;
}

export function MonthView({
  anchor,
  today,
  occurrences,
  onOpen,
  onNewOnDay,
  onOpenDay,
}: MonthViewProps) {
  const { t, language } = useI18n();
  const weeks = monthGrid(anchor);
  const names = weekdayNames(language, "short");

  return (
    <div className="month card" role="grid" aria-label={t("view.month")}>
      <div className="month-head" role="row">
        {names.map((name) => (
          <div key={name} role="columnheader" className="month-weekday">
            {name.toUpperCase()}
          </div>
        ))}
      </div>
      {weeks.map((week) => (
        <div key={week[0]} className="month-row" role="row">
          {week.map((day, index) => {
            const list = occurrencesOnDay(occurrences, day);
            const shown = list.length > MAX_CHIPS ? list.slice(0, MAX_CHIPS - 1) : list;
            const hidden = list.length - shown.length;
            const classes = [
              "month-cell",
              isSameMonth(day, anchor) ? "" : "is-other",
              day === today ? "is-today" : "",
              index >= 5 ? "is-weekend" : "",
            ].join(" ");
            return (
              <div key={day} role="gridcell" className={classes} onClick={() => onNewOnDay(day)}>
                <button
                  type="button"
                  className="day-number"
                  aria-label={t("month.showDay", { date: formatDayLong(language, day) })}
                  aria-current={day === today ? "date" : undefined}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenDay(day);
                  }}
                >
                  {parseDateKey(day).day}
                </button>
                {day === today && (
                  <span className="today-label">{t("agenda.today").toUpperCase()}</span>
                )}
                <div className="month-chips">
                  {shown.map((o) => (
                    <OccurrenceChip key={o.key} occurrence={o} onOpen={onOpen} />
                  ))}
                  {hidden > 0 && (
                    <button
                      type="button"
                      className="more-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        onOpenDay(day);
                      }}
                    >
                      {t("month.more", { count: hidden })}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
