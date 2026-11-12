import type { Calendar, CalendarView } from "@/domain/types";
import { HOLIDAYS_COLOR } from "@/domain/occurrences";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { CatLogo, Icon, type IconName } from "./Icons";

interface SidebarProps {
  view: CalendarView;
  calendars: Calendar[];
  showHolidays: boolean;
  upcomingCount: number;
  onShowCalendar: () => void;
  onShowAgenda: () => void;
  onToggleCalendar: (calendar: Calendar, visible: boolean) => void;
  onToggleHolidays: (visible: boolean) => void;
  onAddCalendar: () => void;
  onOpenSettings: () => void;
}

function NavItem(props: {
  icon: IconName;
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`nav-item${props.active ? " is-active" : ""}`}
      aria-current={props.active ? "page" : undefined}
      onClick={props.onClick}
    >
      <Icon name={props.icon} />
      <span>{props.label}</span>
      {props.count ? <span className="nav-count">{props.count}</span> : null}
    </button>
  );
}

export function Sidebar(props: SidebarProps) {
  const { t } = useI18n();
  return (
    <aside className="sidebar" aria-label={t("nav.main")}>
      <div className="brand">
        <span className="brand-tile">
          <CatLogo size={30} color="#d08b62" />
        </span>
        <span className="brand-name">NekoCalendar</span>
      </div>

      <nav className="nav">
        <NavItem
          icon="calendar"
          label={t("nav.calendar")}
          active={props.view !== "agenda"}
          onClick={props.onShowCalendar}
        />
        <NavItem
          icon="list"
          label={t("nav.upcoming")}
          active={props.view === "agenda"}
          count={props.upcomingCount}
          onClick={props.onShowAgenda}
        />
      </nav>

      <div className="group-head">
        <span>{t("calendars.title")}</span>
        <button
          type="button"
          className="mini-btn"
          aria-label={t("calendars.add")}
          onClick={props.onAddCalendar}
        >
          <span>
            <Icon name="plus" size={16} />
          </span>
        </button>
      </div>
      <ul className="calendar-list">
        {props.calendars.map((calendar) => (
          <li key={calendar.id}>
            <label className="calendar-row">
              <input
                type="checkbox"
                checked={calendar.visible}
                style={{ accentColor: calendar.color }}
                onChange={(event) => props.onToggleCalendar(calendar, event.target.checked)}
              />
              <span>{calendar.name}</span>
            </label>
          </li>
        ))}
        <li>
          <label className="calendar-row">
            <input
              type="checkbox"
              checked={props.showHolidays}
              style={{ accentColor: HOLIDAYS_COLOR }}
              onChange={(event) => props.onToggleHolidays(event.target.checked)}
            />
            <span>{t("calendars.holidays")}</span>
          </label>
        </li>
      </ul>

      <div className="sidebar-foot">
        <NavItem
          icon="gear"
          label={t("nav.settings")}
          active={false}
          onClick={props.onOpenSettings}
        />
        <span className="saved-note">
          <Icon name="cloud" size={16} />
          {t("nav.synced")}
        </span>
      </div>
    </aside>
  );
}
