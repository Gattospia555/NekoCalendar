import { addDays, dateOf } from "@/domain/datetime";
import { minutesUntil } from "@/domain/occurrences";
import type { Occurrence } from "@/domain/types";
import { formatDayShort, formatTimeRange } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { eventStyle, useOccurrenceTitle } from "../occurrenceUtils";
import { Icon } from "./Icons";
import { Cover } from "./OccurrenceBits";

interface NextEventBarProps {
  now: string;
  /** Prossime occorrenze già ordinate. */
  upcoming: Occurrence[];
  onOpen: (occurrence: Occurrence, source?: Element) => void;
  onDone: (occurrence: Occurrence, source?: Element) => void;
}

/** Finestra dell'anello del countdown: l'ultimo giorno, oppure l'ultima settimana. */
const DAY_MINUTES = 24 * 60;
const WEEK_MINUTES = 7 * DAY_MINUTES;
const RING_RADIUS = 18;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

/**
 * Countdown come nel mockup: un anello che si riempie avvicinandosi all'evento
 * (nell'ultimo giorno, o nell'ultima settimana se manca di più) e il tempo che manca.
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
      <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true">
        <circle className="countdown-track" cx="23" cy="23" r={RING_RADIUS} />
        <circle
          className="countdown-ring"
          cx="23"
          cy="23"
          r={RING_RADIUS}
          strokeDasharray={RING_LENGTH}
          strokeDashoffset={RING_LENGTH * (1 - progress)}
          transform="rotate(-90 23 23)"
        />
      </svg>
      <span className="countdown-label">{t("footer.countdown")}</span>
      <span className="countdown-value">{value}</span>
    </div>
  );
}

/** Barra in basso come il player di NekoTune: il prossimo evento a orario e le azioni rapide. */
export function NextEventBar({ now, upcoming, onOpen, onDone }: NextEventBarProps) {
  const { t, language } = useI18n();
  const titleOf = useOccurrenceTitle();
  const next = upcoming.find((o) => !o.allDay && !o.readOnly);
  const today = dateOf(now);

  if (!next) {
    return (
      <footer className="next-bar">
        <p className="next-none">{t("footer.none")}</p>
      </footer>
    );
  }

  const minutes = minutesUntil(next, now);
  const day = dateOf(next.start);
  const badge =
    minutes <= 0
      ? t("footer.now")
      : minutes < 60
        ? t("footer.inMinutes", { n: minutes })
        : day === today
          ? t("footer.inHours", { n: Math.round(minutes / 60) })
          : day === addDays(today, 1)
            ? t("footer.tomorrow")
            : t("footer.onDay", { date: formatDayShort(language, day) });

  return (
    <footer className="next-bar" style={eventStyle(next.color)}>
      <div key={next.key} className="next-main">
        <Cover occurrence={next} size={58} />
        <div className="next-text">
          <div className="next-label">
            <span>{t("footer.label")}</span>
            <span className="badge">
              <Icon name="clock" size={13} /> {badge}
            </span>
          </div>
          <span className="next-title">{titleOf(next)}</span>
          <span className="next-sub">
            {formatTimeRange(language, next.start, next.end, false)}
            {next.location ? ` · ${next.location}` : ""}
          </span>
        </div>
      </div>
      <div className="next-actions">
        <button
          type="button"
          className="pill-btn"
          onClick={(event) => onOpen(next, event.currentTarget)}
        >
          {t("footer.open")}
        </button>
        {next.kind === "task" && (
          <button
            type="button"
            className="primary-btn"
            onClick={(event) => onDone(next, event.currentTarget)}
          >
            <Icon name="check" size={18} />
            {t("footer.done")}
          </button>
        )}
      </div>
      <span className="next-divider" aria-hidden="true" />
      <Countdown minutes={minutes} title={titleOf(next)} />
    </footer>
  );
}
