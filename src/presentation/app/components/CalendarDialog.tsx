import { useId, useState } from "react";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { Dialog } from "./Dialog";
import { EVENT_COLORS } from "../occurrenceUtils";

interface CalendarDialogProps {
  onCreate: (name: string, color: string) => void;
  onClose: () => void;
}

export function CalendarDialog({ onCreate, onClose }: CalendarDialogProps) {
  const { t } = useI18n();
  const uid = useId();
  const [name, setName] = useState("");
  const [color, setColor] = useState(EVENT_COLORS[3]);
  const valid = name.trim().length > 0;

  const submit = () => {
    if (valid) onCreate(name.trim(), color);
  };

  return (
    <Dialog
      title={t("calendars.dialogTitle")}
      onClose={onClose}
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="pill-btn" onClick={onClose}>
            {t("event.cancel")}
          </button>
          <button type="button" className="primary-btn" disabled={!valid} onClick={submit}>
            {t("calendars.create")}
          </button>
        </>
      }
    >
      <form
        className="event-form"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="field">
          <label htmlFor={`${uid}-name`}>{t("calendars.name")}</label>
          <input
            id={`${uid}-name`}
            className="input"
            value={name}
            maxLength={100}
            autoFocus
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <fieldset className="colors">
          <legend>{t("calendars.color")}</legend>
          <div className="swatches">
            {EVENT_COLORS.map((value) => (
              <label key={value} className="swatch">
                <input
                  type="radio"
                  name={`${uid}-color`}
                  checked={color === value}
                  onChange={() => setColor(value)}
                />
                <span style={{ background: value }} aria-hidden="true" />
                <span className="sr-only">{value}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
