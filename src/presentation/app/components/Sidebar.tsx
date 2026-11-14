import type { CSSProperties } from "react";
import type { Calendar, DateKey, Occurrence } from "@/domain/types";
import { HOLIDAYS_COLOR } from "@/domain/occurrences";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { eventStripe } from "../eventPalette";
import { CatLogo, Icon } from "./Icons";
import { MiniMonth } from "./MiniMonth";

interface SidebarProps {
  anchor: DateKey;
  today: DateKey;
  calendars: Calendar[];
  showHolidays: boolean;
  query: (from: DateKey, to: DateKey) => Occurrence[];
  onNewEvent: (source?: Element) => void;
  onPickDay: (day: DateKey, source?: Element) => void;
  onToggleCalendar: (calendar: Calendar, visible: boolean) => void;
  onToggleHolidays: (visible: boolean) => void;
  onAddCalendar: () => void;
  onOpenSettings: () => void;
}

/** Riga di un calendario: casella colorata (con la spunta) e nome. */
function CalendarRow(props: {
  name: string;
  color: string;
  checked: boolean;
  onChange: (visible: boolean) => void;
}) {
  return (
    <li>
      <label className="calendar-row" style={{ "--cal-color": props.color } as CSSProperties}>
        <input
          type="checkbox"
          checked={props.checked}
          onChange={(event) => props.onChange(event.target.checked)}
        />
        <span>{props.name}</span>
      </label>
    </li>
  );
}

/**
 * Colonna sinistra, tutta "calendario": marchio, nuovo evento, mini calendario del mese
 * e i calendari da mostrare o nascondere. In fondo le impostazioni.
 */
export function Sidebar(props: SidebarProps) {
  const { t } = useI18n();
  return (
    <aside className="sidebar panel" aria-label={t("nav.main")}>
      <div className="brand">
        <span className="brand-tile">
          <CatLogo size={28} color="#d08b62" />
        </span>
        <span className="brand-name">NekoCalendar</span>
      </div>

      <button
        type="button"
        className="primary-btn new-event-btn"
        onClick={(event) => props.onNewEvent(event.currentTarget)}
      >
        <Icon name="plus" size={18} />
        {t("toolbar.newEvent")}
      </button>

      <MiniMonth
        anchor={props.anchor}
        today={props.today}
        query={props.query}
        onPick={props.onPickDay}
      />

      <div className="group-head">
        <span className="section-label">{t("calendars.title")}</span>
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
          <CalendarRow
            key={calendar.id}
            name={calendar.name}
            color={eventStripe(calendar.color)}
            checked={calendar.visible}
            onChange={(visible) => props.onToggleCalendar(calendar, visible)}
          />
        ))}
        <CalendarRow
          name={t("calendars.holidays")}
          color={eventStripe(HOLIDAYS_COLOR)}
          checked={props.showHolidays}
          onChange={props.onToggleHolidays}
        />
      </ul>

      <div className="sidebar-foot">
        <button type="button" className="nav-item" onClick={props.onOpenSettings}>
          <span className="round-icon">
            <Icon name="gear" size={18} />
          </span>
          <span>{t("nav.settings")}</span>
        </button>
        <span className="saved-note">
          <Icon name="cloud" size={16} />
          {t("nav.synced")}
        </span>
      </div>
    </aside>
  );
}
