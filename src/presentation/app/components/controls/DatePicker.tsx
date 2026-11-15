import { useId, useRef, useState, type KeyboardEvent } from "react";
import { monthGrid } from "@/domain/calendarGrid";
import { addDays, addMonths, isDateKey, startOfMonth, todayIn } from "@/domain/datetime";
import type { DateKey } from "@/domain/types";
import { formatDate, formatDayLong, formatMonthYear, weekdayNames } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { Icon } from "../Icons";
import { popoverStyle, usePopover } from "./usePopover";

interface DatePickerProps {
  value: DateKey;
  onChange: (value: DateKey) => void;
  id?: string;
  ariaLabel?: string;
  describedBy?: string;
  invalid?: boolean;
}

/** Oggi nel fuso del computer. */
const today = () => todayIn(Date.now(), Intl.DateTimeFormat().resolvedOptions().timeZone);

/**
 * Campo data con un piccolo calendario a comparsa, al posto di quello di sistema.
 * Tastiera: frecce (giorno e settimana), Pagina su/giù (mese), Invio per scegliere, Esc.
 */
export function DatePicker({ value, onChange, ...props }: DatePickerProps) {
  const { t, language } = useI18n();
  const gridId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const { open, setOpen, place } = usePopover(button, panel, 360);
  const safe = isDateKey(value) ? value : today();
  const [focus, setFocus] = useState<DateKey>(safe);
  const month = startOfMonth(focus);
  const letters = weekdayNames(language, "narrow");
  const now = today();

  const show = () => {
    setFocus(safe);
    setOpen(true);
    requestAnimationFrame(() => panel.current?.querySelector<HTMLElement>(".dp-grid")?.focus());
  };
  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
  const pick = (day: DateKey) => {
    onChange(day);
    close();
  };

  const onGridKey = (event: KeyboardEvent) => {
    const moves: Record<string, () => DateKey> = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      PageUp: () => addMonths(focus, -1),
      PageDown: () => addMonths(focus, 1),
    };
    if (moves[event.key]) {
      event.preventDefault();
      setFocus(moves[event.key]());
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pick(focus);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  return (
    <div className={`picker${open ? " is-open" : ""}`}>
      <button
        ref={button}
        id={props.id}
        type="button"
        className="input select-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          props.ariaLabel ? `${props.ariaLabel}: ${formatDate(language, safe)}` : undefined
        }
        aria-describedby={props.describedBy}
        aria-invalid={props.invalid || undefined}
        onClick={() => (open ? close() : show())}
      >
        <Icon name="calendar" size={16} className="select-lead" />
        <span className="select-value">{formatDate(language, safe)}</span>
        <Icon name="down" size={16} className="select-chevron" />
      </button>
      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-label={props.ariaLabel ?? t("mini.title")}
          className={`popover date-panel${place?.above ? " is-above" : ""}`}
          style={popoverStyle(place, 288)}
        >
          <div className="mini-head">
            <span className="mini-title">{formatMonthYear(language, month)}</span>
            <button
              type="button"
              className="mini-nav"
              aria-label={t("mini.previous")}
              onClick={() => setFocus(addMonths(focus, -1))}
            >
              <Icon name="left" size={14} />
            </button>
            <button
              type="button"
              className="mini-nav"
              aria-label={t("mini.next")}
              onClick={() => setFocus(addMonths(focus, 1))}
            >
              <Icon name="right" size={14} />
            </button>
          </div>
          <div
            className="mini-grid dp-grid"
            role="grid"
            tabIndex={0}
            aria-labelledby={gridId}
            aria-activedescendant={`${gridId}-${focus}`}
            onKeyDown={onGridKey}
          >
            <span id={gridId} className="sr-only">
              {formatMonthYear(language, month)}
            </span>
            {letters.map((letter, i) => (
              <span key={i} className="mini-weekday" aria-hidden="true">
                {letter}
              </span>
            ))}
            {monthGrid(month)
              .flat()
              .map((day) => (
                <button
                  key={day}
                  id={`${gridId}-${day}`}
                  type="button"
                  tabIndex={-1}
                  className={[
                    "mini-day",
                    day === now ? "is-now" : "",
                    day === safe ? "is-selected" : "",
                    day === focus ? "is-focus" : "",
                    startOfMonth(day) !== month ? "is-other" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-label={formatDayLong(language, day)}
                  aria-pressed={day === safe}
                  onClick={() => pick(day)}
                >
                  {Number(day.slice(8))}
                </button>
              ))}
          </div>
          <div className="date-panel-foot">
            <button type="button" className="ghost-btn small-btn" onClick={() => pick(now)}>
              {t("toolbar.today")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
