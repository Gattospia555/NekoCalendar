import { useLayoutEffect, useRef, useState } from "react";
import { isSameMonth, monthGrid } from "@/domain/calendarGrid";
import { parseDateKey } from "@/domain/datetime";
import { occurrencesOnDay } from "@/domain/occurrences";
import type { DateKey, Occurrence } from "@/domain/types";
import { formatDayLong, weekdayNames } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { OccurrenceChip } from "./OccurrenceBits";

/** Spazio occupato in una casella da numero del giorno e margini, da ogni etichetta e da "+N". */
const CELL_CHROME_PX = 39;
const CHIP_PX = 25;
const MORE_PX = 21;
const GAP_PX = 3;

interface Capacity {
  /** Etichette che entrano se si mostrano tutte. */
  all: number;
  /** Etichette che entrano lasciando posto a "+N altri". */
  withMore: number;
}

/**
 * Quante etichette entrano in una casella, misurando l'altezza reale delle righe:
 * finestra grande, più eventi visibili; finestra piccola, "+N altri" invece di testo tagliato.
 * Si ricalcola solo quando la griglia cambia dimensione (nessun controllo continuo).
 */
function useChipCapacity() {
  const grid = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState<Capacity>({ all: 3, withMore: 2 });
  useLayoutEffect(() => {
    const element = grid.current;
    const row = element?.querySelector<HTMLElement>(".month-row");
    if (!element || !row) return;
    const measure = () => {
      const free = row.clientHeight - CELL_CHROME_PX;
      const all = Math.max(1, Math.floor((free + GAP_PX) / CHIP_PX));
      const withMore = Math.max(0, Math.floor((free - MORE_PX + GAP_PX) / CHIP_PX));
      setCapacity((old) =>
        old.all === all && old.withMore === withMore ? old : { all, withMore },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, []);
  return { grid, capacity };
}

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
  const { grid, capacity } = useChipCapacity();

  return (
    <div ref={grid} className="month card" role="grid" aria-label={t("view.month")}>
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
            const shown = list.length > capacity.all ? list.slice(0, capacity.withMore) : list;
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
