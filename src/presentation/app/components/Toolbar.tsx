import { AGENDA_DAYS } from "@/domain/calendarGrid";
import { addDays, isoWeekNumber, parseDateKey, startOfWeek } from "@/domain/datetime";
import type { CalendarView, DateKey } from "@/domain/types";
import { formatDate, formatDayLong, formatMonthYear } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { Icon } from "./Icons";

const VIEWS: CalendarView[] = ["day", "week", "month", "year", "agenda"];

interface ToolbarProps {
  view: CalendarView;
  anchor: DateKey;
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
        <h1>
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
      <div className="segmented" role="group" aria-label={t("toolbar.views")}>
        {VIEWS.map((v) => (
          <button key={v} type="button" aria-pressed={v === view} onClick={() => props.onView(v)}>
            {t(`view.${v}`)}
          </button>
        ))}
      </div>
      <button type="button" className="primary-btn" onClick={props.onNewEvent}>
        <Icon name="plus" size={18} />
        {t("toolbar.newEvent")}
      </button>
    </div>
  );
}
