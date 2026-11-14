import { addDays, dateOf } from "@/domain/datetime";
import { nekoMessage } from "@/domain/neko";
import { minutesUntil } from "@/domain/occurrences";
import type { CalendarEvent, Occurrence } from "@/domain/types";
import {
  formatDayShort,
  formatTime,
  formatTimeRange,
  formatWeekdayDay,
} from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import nekoAwake from "../../assets/neko/neko-awake.svg";
import nekoSleepy from "../../assets/neko/neko-sleepy.svg";
import { emojiUrl, iconOf } from "../emoji";
import { eventStyle, useOccurrenceTitle } from "../occurrenceUtils";
import { Icon } from "./Icons";

interface NekoPanelProps {
  now: string;
  /** Prossime occorrenze (in corso o future), già ordinate. */
  upcoming: Occurrence[];
  tasks: CalendarEvent[];
  onOpen: (occurrence: Occurrence, source?: Element) => void;
  onToggleTask: (task: CalendarEvent, done: boolean, source?: Element) => void;
  onDone: (occurrence: Occurrence, source?: Element) => void;
}

/** Finestra dell'anello del countdown: l'ultimo giorno, oppure l'ultima settimana. */
const DAY_MINUTES = 24 * 60;
const WEEK_MINUTES = 7 * DAY_MINUTES;
const RING_RADIUS = 28;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
/** Quanti eventi dei giorni successivi mostrare in "In arrivo". */
const COMING = 4;

/**
 * Countdown: un anello che si riempie avvicinandosi all'evento (nell'ultimo giorno,
 * o nell'ultima settimana se manca di più) e il tempo che manca al centro.
 * Si aggiorna con l'ora dell'app, una volta al minuto: nessun timer in più.
 */
function Countdown({ minutes, title }: { minutes: number; title: string }) {
  const { t } = useI18n();
  const left = Math.max(minutes, 0);
  const value =
    left < 60
      ? t("footer.countdownMinutes", { n: left })
      : left < DAY_MINUTES
        ? t("footer.countdownHours", { n: Math.round(left / 60) })
        : t("footer.countdownDays", { n: Math.ceil(left / DAY_MINUTES) });
  const window = left < DAY_MINUTES ? DAY_MINUTES : WEEK_MINUTES;
  const progress = Math.min(Math.max(1 - left / window, 0), 1);
  return (
    <div className="countdown" role="img" aria-label={t("footer.countdownLabel", { value, title })}>
      <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
        <circle className="countdown-track" cx="36" cy="36" r={RING_RADIUS} />
        <circle
          className="countdown-ring"
          cx="36"
          cy="36"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - progress)}
          transform="rotate(-90 36 36)"
        />
      </svg>
      <span className="countdown-value" aria-hidden="true">
        {value}
      </span>
    </div>
  );
}

/**
 * Colonna destra: Neko che parla dei prossimi impegni, il countdown del prossimo evento,
 * le attività da fare e gli eventi in arrivo nei giorni successivi.
 */
export function NekoPanel({ now, upcoming, tasks, onOpen, onToggleTask, onDone }: NekoPanelProps) {
  const { t, language } = useI18n();
  const titleOf = useOccurrenceTitle();
  const today = dateOf(now);

  const message = nekoMessage(now, upcoming);
  const time =
    message.key === "later"
      ? message.time
      : message.time
        ? t("neko.atTime", { time: message.time })
        : "";
  // Se manca l'ora resta uno spazio prima del punto: lo togliamo.
  const said = t(`neko.${message.key}`, {
    title: message.title,
    minutes: message.minutes,
    time,
  }).replace(/\s+([.,!])/g, "$1");

  const next = upcoming.find((o) => !o.allDay && !o.readOnly);
  const minutes = next ? minutesUntil(next, now) : 0;

  // In arrivo: i primi eventi dei giorni successivi, uno per evento (niente ripetizioni).
  const seen = new Set<string>();
  // Il prossimo evento è già nel countdown: non lo ripetiamo.
  if (next) seen.add(next.eventId);
  const coming = upcoming.filter((o) => {
    if (dateOf(o.start) <= today || o.kind === "task" || seen.has(o.eventId)) return false;
    seen.add(o.eventId);
    return true;
  });
  const whenLabel = (o: Occurrence) => {
    const day = dateOf(o.start);
    const dayLabel =
      day === addDays(today, 1) ? t("agenda.tomorrow") : formatWeekdayDay(language, day);
    return o.allDay ? dayLabel : `${dayLabel} · ${formatTime(o.start)}`;
  };

  return (
    <aside className="neko-panel" aria-label={t("panel.upcoming")}>
      <section className="neko-card panel" style={next ? eventStyle(next.color) : undefined}>
        <img
          className="neko-cat"
          src={message.sleepy ? nekoSleepy : nekoAwake}
          alt={t(message.sleepy ? "neko.altSleepy" : "neko.alt")}
          width={132}
          height={110}
        />
        <p className="section-label">{t("neko.label")}</p>
        <p className="neko-says" aria-live="polite">
          {said}
        </p>
        {next && (
          <div key={next.key} className="next-box">
            <Countdown minutes={minutes} title={titleOf(next)} />
            <div className="next-text">
              <span className="next-title">{titleOf(next)}</span>
              <span className="next-sub">
                {dateOf(next.start) === today
                  ? formatTimeRange(language, next.start, next.end, false)
                  : `${formatDayShort(language, dateOf(next.start))} · ${formatTime(next.start)}`}
                {next.location ? ` · ${next.location}` : ""}
              </span>
              <span className="next-actions">
                <button
                  type="button"
                  className="pill-btn small-btn"
                  onClick={(event) => onOpen(next, event.currentTarget)}
                >
                  {t("footer.open")}
                </button>
                {next.kind === "task" && (
                  <button
                    type="button"
                    className="primary-btn small-btn"
                    onClick={(event) => onDone(next, event.currentTarget)}
                  >
                    <Icon name="check" size={16} />
                    {t("footer.done")}
                  </button>
                )}
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="panel-tasks">
        <h2 id="panel-tasks" className="section-label">
          {t("panel.tasks")}
        </h2>
        {tasks.length === 0 ? (
          <p className="panel-empty">{t("panel.noTasks")}</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <label className={`task-row${task.done ? " is-done" : ""}`}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(event) =>
                      onToggleTask(task, event.target.checked, event.currentTarget)
                    }
                  />
                  <img
                    className="task-emoji"
                    src={emojiUrl(iconOf(task), "3d")}
                    alt=""
                    width={24}
                    height={24}
                  />
                  <span className="task-title">{task.title}</span>
                  <span className="task-due">
                    {dateOf(task.start) === today
                      ? formatTime(task.start) || t("agenda.today")
                      : formatDayShort(language, dateOf(task.start))}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" aria-labelledby="panel-coming">
        <h2 id="panel-coming" className="section-label">
          {t("panel.coming")}
        </h2>
        {coming.length === 0 ? (
          <p className="panel-empty">{t("panel.nothingComing")}</p>
        ) : (
          <ul className="coming-grid">
            {coming.slice(0, COMING).map((o) => (
              <li key={o.key}>
                <button
                  type="button"
                  className="coming-card"
                  style={eventStyle(o.color)}
                  onClick={(event) => onOpen(o, event.currentTarget)}
                >
                  <img src={emojiUrl(iconOf(o), "3d")} alt="" width={52} height={52} />
                  <span className="coming-label">
                    <span className="coming-title">{titleOf(o)}</span>
                    <span className="coming-when">{whenLabel(o)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
