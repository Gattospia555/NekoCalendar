import { useContext } from "react";
import { AGENDA_DAYS } from "@/domain/calendarGrid";
import { addDays } from "@/domain/datetime";
import { occurrencesOnDay } from "@/domain/occurrences";
import type { DateKey, Occurrence } from "@/domain/types";
import { formatDayLong, formatTimeRange } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { FreshEventContext, useOccurrenceTitle } from "../occurrenceUtils";
import { Icon } from "./Icons";
import { Cover } from "./OccurrenceBits";

interface AgendaViewProps {
  anchor: DateKey;
  today: DateKey;
  occurrences: Occurrence[];
  onOpen: (occurrence: Occurrence) => void;
}

/** Vista "agenda": i prossimi 30 giorni come elenco, raggruppati per giorno. */
export function AgendaView({ anchor, today, occurrences, onOpen }: AgendaViewProps) {
  const { t, language } = useI18n();
  const titleOf = useOccurrenceTitle();
  const freshId = useContext(FreshEventContext);
  const days = Array.from({ length: AGENDA_DAYS }, (_, i) => addDays(anchor, i))
    .map((day) => ({ day, list: occurrencesOnDay(occurrences, day) }))
    .filter((group) => group.list.length > 0);

  if (days.length === 0) return <p className="empty card">{t("agenda.empty")}</p>;

  return (
    <div className="agenda">
      {days.map(({ day, list }) => (
        <section key={day} className="agenda-day card" aria-labelledby={`agenda-${day}`}>
          <h2 id={`agenda-${day}`}>
            {day === today
              ? t("agenda.today")
              : day === addDays(today, 1)
                ? t("agenda.tomorrow")
                : formatDayLong(language, day)}
            {(day === today || day === addDays(today, 1)) && (
              <span className="agenda-date"> · {formatDayLong(language, day)}</span>
            )}
          </h2>
          <ul>
            {list.map((o) => (
              <li key={o.key}>
                <button
                  type="button"
                  className={`agenda-item${o.done ? " chip-done" : ""}${o.eventId === freshId ? " is-fresh" : ""}`}
                  onClick={() => onOpen(o)}
                >
                  <Cover occurrence={o} size={44} />
                  <span className="agenda-time">
                    {formatTimeRange(language, o.start, o.end, o.allDay)}
                  </span>
                  <span className="agenda-main">
                    <span className="agenda-title">{titleOf(o)}</span>
                    {o.location && (
                      <span className="agenda-sub">
                        <Icon name="pin" size={14} /> {o.location}
                      </span>
                    )}
                  </span>
                  {o.recurring && !o.readOnly && (
                    <span className="agenda-badge" title={t("occ.recurring")}>
                      <Icon name="repeat" size={16} />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
