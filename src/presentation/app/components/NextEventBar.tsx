import { addDays, dateOf } from "@/domain/datetime";
import { minutesUntil } from "@/domain/occurrences";
import type { Occurrence } from "@/domain/types";
import { formatDayShort, formatTimeRange } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { useOccurrenceTitle } from "../occurrenceUtils";
import { Icon } from "./Icons";
import { Cover } from "./OccurrenceBits";

interface NextEventBarProps {
  now: string;
  /** Prossime occorrenze già ordinate. */
  upcoming: Occurrence[];
  onOpen: (occurrence: Occurrence) => void;
  onDone: (occurrence: Occurrence) => void;
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
    <footer className="next-bar">
      <div className="next-main">
        <Cover occurrence={next} size={58} />
        <div className="next-text">
          <div className="next-label">
            <span>{t("footer.label").toUpperCase()}</span>
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
        <button type="button" className="pill-btn" onClick={() => onOpen(next)}>
          {t("footer.open")}
        </button>
        {next.kind === "task" && (
          <button type="button" className="primary-btn" onClick={() => onDone(next)}>
            <Icon name="check" size={18} />
            {t("footer.done")}
          </button>
        )}
      </div>
    </footer>
  );
}
