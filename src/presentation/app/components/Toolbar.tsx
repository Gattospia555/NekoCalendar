import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { AGENDA_DAYS } from "@/domain/calendarGrid";
import { addDays, isoWeekNumber, parseDateKey, startOfWeek } from "@/domain/datetime";
import type { CalendarView, DateKey } from "@/domain/types";
import { formatDate, formatDayLong, formatMonthYear } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import type { Transition } from "../useCalendarApp";
import { Icon } from "./Icons";

const VIEWS: CalendarView[] = ["day", "week", "month", "year", "agenda"];

/**
 * Selettore delle viste con un indicatore che scivola sotto il pulsante scelto:
 * fa capire a colpo d'occhio da dove si arriva e dove si è.
 */
function ViewSwitcher({
  view,
  onView,
}: {
  view: CalendarView;
  onView: (view: CalendarView) => void;
}) {
  const { t, language } = useI18n();
  const group = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  // Misura il pulsante attivo (anche quando cambiano lingua o larghezza della finestra).
  useLayoutEffect(() => {
    const container = group.current;
    if (!container) return;
    const measure = () => {
      const active = container.querySelector<HTMLElement>('button[aria-pressed="true"]');
      if (active) setPill({ left: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [view, language]);

  const pillStyle: CSSProperties | undefined = pill
    ? { transform: `translateX(${pill.left}px)`, width: pill.width }
    : undefined;

  return (
    <div ref={group} className="segmented" role="group" aria-label={t("toolbar.views")}>
      {pill && <span className="segmented-pill" style={pillStyle} aria-hidden="true" />}
      {VIEWS.map((v) => (
        <button key={v} type="button" aria-pressed={v === view} onClick={() => onView(v)}>
          {t(`view.${v}`)}
        </button>
      ))}
    </div>
  );
}

interface ToolbarProps {
  view: CalendarView;
  anchor: DateKey;
  /** Come si è arrivati al periodo mostrato: il titolo entra nella stessa direzione. */
  transition: Transition["kind"];
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onView: (view: CalendarView) => void;
  onNewEvent: () => void;
}

export function Toolbar(props: ToolbarProps) {
  const { t, language } = useI18n();
  const { view, anchor } = props;

  let title: string;
  let subtitle = "";
  if (view === "day") title = formatDayLong(language, anchor);
  else if (view === "year") title = String(parseDateKey(anchor).year);
  else if (view === "agenda") {
    title = t("view.agenda");
    subtitle = `${formatDate(language, anchor)} – ${formatDate(language, addDays(anchor, AGENDA_DAYS - 1))}`;
  } else {
    title = formatMonthYear(language, view === "week" ? startOfWeek(anchor) : anchor);
    if (view === "week") subtitle = t("toolbar.weekNumber", { n: isoWeekNumber(anchor) });
  }
  // L'anno in terracotta, come nel mockup ("Novembre 2026").
  const match = /^(.*?)(\s\d{4})$/.exec(title);

  return (
    <div className="toolbar">
      <div className="toolbar-title">
        <h1 key={title} className={`enter-${props.transition}`}>
          {match ? (
            <>
              {match[1]}
              <span className="accent">{match[2]}</span>
            </>
          ) : (
            title
          )}
        </h1>
        <span className="toolbar-sub">{subtitle}</span>
      </div>
      <div className="toolbar-nav">
        <button
          type="button"
          className="round-btn"
          aria-label={t("toolbar.previous")}
          onClick={props.onPrevious}
        >
          <Icon name="left" />
        </button>
        <button
          type="button"
          className="round-btn"
          aria-label={t("toolbar.next")}
          onClick={props.onNext}
        >
          <Icon name="right" />
        </button>
        <button type="button" className="pill-btn" onClick={props.onToday}>
          {t("toolbar.today")}
        </button>
      </div>
      <ViewSwitcher view={view} onView={props.onView} />
      <button type="button" className="primary-btn" onClick={props.onNewEvent}>
        <Icon name="plus" size={18} />
        {t("toolbar.newEvent")}
      </button>
    </div>
  );
}
