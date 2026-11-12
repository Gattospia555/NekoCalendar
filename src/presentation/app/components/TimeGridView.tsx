import { useEffect, useRef } from "react";
import { weekDays } from "@/domain/calendarGrid";
import { minutesBetween, parseDateKey, weekdayIndex } from "@/domain/datetime";
import { layoutDay, occurrencesOnDay } from "@/domain/occurrences";
import type { DateKey, Occurrence } from "@/domain/types";
import { formatDayLong, formatTimeRange, weekdayNames } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { tint, useOccurrenceTitle } from "../occurrenceUtils";
import { OccurrenceChip } from "./OccurrenceBits";

/** Altezza di un'ora in pixel. */
const HOUR_PX = 52;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

interface TimeGridProps {
  mode: "day" | "week";
  anchor: DateKey;
  today: DateKey;
  now: string;
  occurrences: Occurrence[];
  onOpen: (occurrence: Occurrence) => void;
  onNewAt: (day: DateKey, time: string) => void;
  onOpenDay: (day: DateKey) => void;
}

/** Viste "giorno" e "settimana": colonne di giorni con le ore in verticale. */
export function TimeGridView({
  mode,
  anchor,
  today,
  now,
  occurrences,
  onOpen,
  onNewAt,
  onOpenDay,
}: TimeGridProps) {
  const { t, language } = useI18n();
  const titleOf = useOccurrenceTitle();
  const days = mode === "week" ? weekDays(anchor) : [anchor];
  const names = weekdayNames(language, "short");
  const scroller = useRef<HTMLDivElement>(null);

  // All'apertura mostra la mattina (o l'ora corrente, se è più tardi).
  useEffect(() => {
    const hour = Math.max(7, Number(now.slice(11, 13)) - 1);
    scroller.current?.scrollTo({ top: Math.min(hour, 16) * HOUR_PX });
    // Solo al cambio di vista o di periodo, non a ogni minuto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, anchor]);

  const allDay = days.map((day) => occurrencesOnDay(occurrences, day).filter((o) => o.allDay));
  const nowMinute = minutesBetween(`${today}T00:00`, now);

  return (
    <div className={`timegrid card timegrid-${mode}`}>
      <div
        className="timegrid-head"
        style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        <span />
        {days.map((day) => (
          <button
            key={day}
            type="button"
            className={`timegrid-day${day === today ? " is-today" : ""}`}
            aria-label={formatDayLong(language, day)}
            onClick={() => onOpenDay(day)}
          >
            <span className="timegrid-weekday">{names[weekdayIndex(day)].toUpperCase()}</span>
            <span className="timegrid-date">{parseDateKey(day).day}</span>
          </button>
        ))}
        <span className="allday-label">{t("week.allDay")}</span>
        {allDay.map((list, i) => (
          <div key={days[i]} className="allday-cell">
            {list.map((o) => (
              <OccurrenceChip key={o.key} occurrence={o} onOpen={onOpen} />
            ))}
          </div>
        ))}
      </div>

      <div className="timegrid-body" ref={scroller}>
        <div
          className="timegrid-inner"
          style={{
            gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))`,
            height: 24 * HOUR_PX,
          }}
        >
          <div className="hours" aria-hidden="true">
            {HOURS.map((h) => (
              <span key={h} style={{ top: h * HOUR_PX }}>
                {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
              </span>
            ))}
          </div>
          {days.map((day) => (
            <div
              key={day}
              className="day-column"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const minute = Math.floor(((event.clientY - rect.top) / HOUR_PX) * 2) * 30;
                const clamped = Math.min(Math.max(minute, 0), 23 * 60 + 30);
                onNewAt(
                  day,
                  `${String(Math.floor(clamped / 60)).padStart(2, "0")}:${String(clamped % 60).padStart(2, "0")}`,
                );
              }}
            >
              {layoutDay(occurrences, day).map((block) => (
                <button
                  key={block.occurrence.key}
                  type="button"
                  className={`block${block.occurrence.done ? " chip-done" : ""}`}
                  style={{
                    ...tint(block.occurrence.color),
                    top: (block.startMinute / 60) * HOUR_PX,
                    height: Math.max(
                      ((block.endMinute - block.startMinute) / 60) * HOUR_PX - 2,
                      18,
                    ),
                    left: `calc(${(block.column / block.columns) * 100}% + 2px)`,
                    width: `calc(${100 / block.columns}% - 4px)`,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpen(block.occurrence);
                  }}
                >
                  <span className="block-title">{titleOf(block.occurrence)}</span>
                  <span className="block-time">
                    {formatTimeRange(language, block.occurrence.start, block.occurrence.end, false)}
                  </span>
                </button>
              ))}
              {day === today && (
                <span
                  className="now-line"
                  style={{ top: (nowMinute / 60) * HOUR_PX }}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
