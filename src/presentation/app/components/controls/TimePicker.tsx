import { useId, useRef, useState, type KeyboardEvent } from "react";
import { parseClockTime as parseTime } from "@/domain/datetime";
import { Icon } from "../Icons";
import { popoverStyle, usePopover } from "./usePopover";

interface TimePickerProps {
  /** Ora "HH:MM" (24 ore). */
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

/** Gli orari proposti nell'elenco: ogni quarto d'ora. */
const TIMES = Array.from({ length: 96 }, (_, i) => {
  const minutes = i * 15;
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
});

/**
 * Campo orario: si può scrivere (es. "9.30") oppure scegliere dall'elenco dei quarti d'ora.
 * Schema "combobox" accessibile: frecce per scorrere l'elenco, Invio per scegliere, Esc.
 */
export function TimePicker({ value, onChange, ariaLabel }: TimePickerProps) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const { open, setOpen, place } = usePopover(input, list, 280);
  const [text, setText] = useState(value);
  const [shown, setShown] = useState(value);
  const [active, setActive] = useState(0);

  // Il valore può cambiare da fuori (es. spostando l'inizio si sposta anche la fine).
  if (shown !== value) {
    setShown(value);
    setText(value);
  }

  const nearest = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return Math.min(95, Math.round((h * 60 + m) / 15));
  };
  const scrollTo = (index: number) =>
    list.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "center" });

  const show = () => {
    const index = nearest(parseTime(text) ?? value);
    setActive(index);
    setOpen(true);
    requestAnimationFrame(() => scrollTo(index));
  };
  const commit = (time: string) => {
    setText(time);
    onChange(time);
    setOpen(false);
  };

  const onKey = (event: KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return show();
      const next = Math.max(0, Math.min(95, active + (event.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      scrollTo(next);
    } else if (event.key === "Enter") {
      event.preventDefault();
      commit(open ? TIMES[active] : (parseTime(text) ?? value));
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className={`picker time-picker${open ? " is-open" : ""}`}>
      <Icon name="clock" size={16} className="time-icon" />
      <input
        ref={input}
        className="input time-input"
        role="combobox"
        inputMode="numeric"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        value={text}
        maxLength={5}
        // Si apre con un clic o con la freccia giù, non solo passando con Tab.
        onClick={() => !open && show()}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={onKey}
        onBlur={() => {
          setOpen(false);
          // Scritto a mano: se è valido si tiene, altrimenti torna l'orario di prima.
          const parsed = parseTime(text);
          if (parsed && parsed !== value) onChange(parsed);
          setText(parsed ?? value);
        }}
      />
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`popover select-list time-list${place?.above ? " is-above" : ""}`}
          style={popoverStyle(place)}
        >
          {TIMES.map((time, index) => (
            <li
              key={time}
              id={`${listId}-${index}`}
              data-index={index}
              role="option"
              aria-selected={time === value}
              className={`select-option${index === active ? " is-active" : ""}`}
              // mousedown: sceglie prima che il campo perda il focus
              onMouseDown={(event) => {
                event.preventDefault();
                commit(time);
              }}
            >
              <span>{time}</span>
              {time === value && <Icon name="check" size={16} className="select-check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
