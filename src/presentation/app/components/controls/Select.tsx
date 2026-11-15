import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "../Icons";
import { popoverStyle, usePopover } from "./usePopover";

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  /** Icona o pallino colorato prima del testo (facoltativo). */
  icon?: ReactNode;
}

interface SelectProps<T extends string> {
  value: T | "";
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  /** Id del pulsante: lo usa l'etichetta del campo (`<label htmlFor>`). */
  id?: string;
  /** Testo per chi usa uno screen reader quando non c'è un'etichetta visibile. */
  ariaLabel?: string;
  /** Testo mostrato quando non c'è un valore (es. "Aggiungi promemoria…"). */
  placeholder?: string;
  /** Icona a sinistra nel pulsante quando non c'è un valore. */
  placeholderIcon?: ReactNode;
  describedBy?: string;
  invalid?: boolean;
  className?: string;
}

/**
 * Menu a tendina della famiglia Neko, al posto del `<select>` di sistema.
 * Schema "listbox" accessibile: frecce, Inizio/Fine, Invio o Spazio per scegliere,
 * Esc per chiudere, una lettera per saltare alla voce che inizia così.
 */
export function Select<T extends string>(props: SelectProps<T>) {
  const { value, options, onChange } = props;
  const listId = useId();
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const preferred = Math.min(options.length, 8) * 40 + 12;
  const { open, setOpen, place } = usePopover(button, list, preferred);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(0);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const show = (index = selectedIndex >= 0 ? selectedIndex : 0) => {
    setActive(index);
    setOpen(true);
    // Il focus passa all'elenco appena è sullo schermo.
    requestAnimationFrame(() => {
      list.current?.focus();
      list.current?.querySelector(`[data-index="${index}"]`)?.scrollIntoView({ block: "nearest" });
    });
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    close();
  };
  const move = (index: number) => {
    const next = Math.max(0, Math.min(options.length - 1, index));
    setActive(next);
    list.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  };

  const onButtonKey = (event: KeyboardEvent) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      show();
    }
  };

  const onListKey = (event: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(active + 1),
      ArrowUp: () => move(active - 1),
      Home: () => move(0),
      End: () => move(options.length - 1),
      Enter: () => choose(active),
      " ": () => choose(active),
      Escape: () => close(),
      Tab: () => close(false),
    };
    const action = keys[event.key];
    if (action) {
      if (event.key !== "Tab") event.preventDefault();
      event.stopPropagation(); // Esc chiude il menu, non la finestra intorno
      action();
      return;
    }
    if (event.key.length === 1) {
      const letter = event.key.toLowerCase();
      const start = active + 1;
      const order = [...options.slice(start), ...options.slice(0, start)];
      const found = order.find((o) => o.label.toLowerCase().startsWith(letter));
      if (found) move(options.indexOf(found));
    }
  };

  return (
    <div
      className={`select${open ? " is-open" : ""}${props.className ? ` ${props.className}` : ""}`}
    >
      <button
        ref={button}
        id={props.id}
        type="button"
        className="input select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={props.describedBy}
        aria-invalid={props.invalid || undefined}
        onClick={() => (open ? close() : show())}
        onKeyDown={onButtonKey}
      >
        {selected?.icon ?? (!selected && props.placeholderIcon)}
        <span className={`select-value${selected ? "" : " is-placeholder"}`}>
          {selected?.label ?? props.placeholder ?? ""}
        </span>
        <Icon name="down" size={16} className="select-chevron" />
      </button>
      {open && (
        <ul
          ref={list}
          id={listId}
          role="listbox"
          tabIndex={-1}
          className={`popover select-list${place?.above ? " is-above" : ""}`}
          style={popoverStyle(place)}
          aria-label={props.ariaLabel}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-${index}`}
              data-index={index}
              role="option"
              aria-selected={option.value === value}
              className={`select-option${index === active ? " is-active" : ""}`}
              onPointerEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              {option.icon}
              <span>{option.label}</span>
              {option.value === value && <Icon name="check" size={16} className="select-check" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
