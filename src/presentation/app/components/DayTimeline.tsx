import { useContext } from "react";
import { weekDays } from "@/domain/calendarGrid";
import { compareOccurrences, occurrencesOnDay } from "@/domain/occurrences";
import type { DateKey, Occurrence } from "@/domain/types";
import { formatDayLong, formatTime, formatTimeRange, weekdayNames } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { eventStripe } from "../eventPalette";
import { eventStyle, FreshEventContext, useOccurrenceTitle } from "../occurrenceUtils";
import { Icon } from "./Icons";
import { Cover, OccurrenceChip } from "./OccurrenceBits";

interface DayTimelineProps {
  anchor: DateKey;
  today: DateKey;
  now: string;
  /** Occorrenze del giorno mostrato. */
  occurrences: Occurrence[];
  /** Occorrenze della settimana del giorno mostrato: servono per i pallini della striscia. */
  weekOccurrences: Occurrence[];
  onOpen: (occurrence: Occurrence, source?: Element) => void;
  onSelectDay: (day: DateKey) => void;
  onNew: (day: DateKey, source?: Element) => void;
}

/** Al massimo quattro pallini per giorno nella striscia della settimana. */
const MAX_DOTS = 4;

/** Striscia dei sette giorni: si vede subito quali giorni sono pieni e si salta da uno all'altro. */
function WeekStrip(props: {
  anchor: DateKey;
  today: DateKey;
  occurrences: Occurrence[];
  onSelectDay: (day: DateKey) => void;
}) {
  const { t, language } = useI18n();
  const days = weekDays(props.anchor);
  const names = weekdayNames(language, "short");
  return (
    <div className="week-strip" role="group" aria-label={t("day.week")}>
      {days.map((day, i) => {
        const colors = [
          ...new Set(occurrencesOnDay(props.occurrences, day).map((o) => eventStripe(o.color))),
        ].slice(0, MAX_DOTS);
        return (
          <button
            key={day}
            type="button"
            className={`week-day${day === props.today ? " is-today" : ""}`}
            aria-pressed={day === props.anchor}
            aria-label={formatDayLong(language, day)}
            onClick={() => props.onSelectDay(day)}
          >
            <span className="week-day-name">{names[i]}</span>
            <span className="week-day-number">{Number(day.slice(8))}</span>
            <span className="week-day-dots" aria-hidden="true">
              {colors.map((color) => (
                <i key={color} style={{ background: color }} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Vista Giorno come una linea del tempo: icone grandi, le cose passate sbiadite,
 * la linea di "adesso" e il prossimo impegno in evidenza.
 */
export function DayTimeline(props: DayTimelineProps) {
  const { t, language } = useI18n();
  const titleOf = useOccurrenceTitle();
  const freshId = useContext(FreshEventContext);
  const { anchor, today, now } = props;
  const list = occurrencesOnDay(props.occurrences, anchor);
  const allDay = list.filter((o) => o.allDay);
  const timed = list.filter((o) => !o.allDay).sort(compareOccurrences);
  const isToday = anchor === today;
  const isPast = (o: Occurrence) => anchor < today || (isToday && o.end <= now);
  // Il prossimo impegno di oggi (o quello in corso) è messo in evidenza.
  const next = isToday ? timed.find((o) => o.end > now && !o.done) : undefined;
  // La linea di "adesso" va prima del primo impegno che non è ancora iniziato.
  const nowIndex = isToday ? timed.findIndex((o) => o.start > now) : -1;

  return (
    <div className="day-view card">
      <WeekStrip
        anchor={anchor}
        today={today}
        occurrences={props.weekOccurrences}
        onSelectDay={props.onSelectDay}
      />

      {allDay.length > 0 && (
        <div className="day-allday">
          <span className="section-label">{t("week.allDay")}</span>
          <div className="day-allday-chips">
            {allDay.map((o) => (
              <OccurrenceChip key={o.key} occurrence={o} onOpen={props.onOpen} />
            ))}
          </div>
        </div>
      )}

      {timed.length === 0 ? (
        <div className="day-empty">
          {allDay.length === 0 && <p>{t("day.empty")}</p>}
          <button
            type="button"
            className="pill-btn"
            onClick={(event) => props.onNew(anchor, event.currentTarget)}
          >
            <Icon name="plus" size={18} />
            {t("day.add")}
          </button>
        </div>
      ) : (
        <ol className="timeline">
          {timed.map((o, i) => {
            const classes = [
              "tl-item",
              isPast(o) ? "is-past" : "",
              o === next ? "is-next" : "",
              o.done ? "is-done" : "",
              o.eventId === freshId ? "is-fresh" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <li key={o.key} className={classes} style={eventStyle(o.color)}>
                {i === nowIndex && (
                  <span className="tl-now" aria-hidden="true">
                    <span className="tl-now-time">{formatTime(now)}</span>
                  </span>
                )}
                <span className="tl-time">{formatTime(o.start)}</span>
                <Cover occurrence={o} size={52} />
                <button
                  type="button"
                  className="tl-card"
                  onClick={(event) => props.onOpen(o, event.currentTarget)}
                >
                  <span className="tl-title">{titleOf(o)}</span>
                  <span className="tl-sub">
                    {formatTimeRange(language, o.start, o.end, false)}
                    {o.location ? ` · ${o.location}` : ""}
                  </span>
                </button>
                {o.done && (
                  <span className="tl-check" aria-label={t("occ.done")}>
                    <Icon name="check" size={14} />
                  </span>
                )}
              </li>
            );
          })}
          {isToday && nowIndex === -1 && (
            <li className="tl-item tl-end" aria-hidden="true">
              <span className="tl-now">
                <span className="tl-now-time">{formatTime(now)}</span>
              </span>
            </li>
          )}
        </ol>
      )}
      {timed.length > 0 && (
        <button
          type="button"
          className="ghost-btn day-add"
          onClick={(event) => props.onNew(anchor, event.currentTarget)}
        >
          <Icon name="plus" size={18} />
          {t("day.add")}
        </button>
      )}
    </div>
  );
}
