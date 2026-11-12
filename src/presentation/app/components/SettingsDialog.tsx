import { useId, useState } from "react";
import type { CalendarView, Language, Settings, ThemePreference } from "@/domain/types";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { Dialog } from "./Dialog";

interface SettingsDialogProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}

/** Impostazioni: ogni modifica si salva subito (nessun pulsante "Salva" da ricordare). */
export function SettingsDialog({ settings, onChange, onClose }: SettingsDialogProps) {
  const { t } = useI18n();
  const uid = useId();
  const [name, setName] = useState(settings.displayName);
  const themes: [ThemePreference, string][] = [
    ["auto", t("settings.themeAuto")],
    ["light", t("settings.themeLight")],
    ["dark", t("settings.themeDark")],
  ];

  return (
    <Dialog
      title={t("settings.title")}
      onClose={onClose}
      footer={
        <button type="button" className="primary-btn" onClick={onClose}>
          {t("event.close")}
        </button>
      }
    >
      <div className="event-form">
        <fieldset className="field">
          <legend>{t("settings.theme")}</legend>
          <div className="segmented">
            {themes.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={settings.theme === value}
                onClick={() => onChange({ ...settings, theme: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="form-row">
          <div className="field">
            <label htmlFor={`${uid}-lang`}>{t("settings.language")}</label>
            <select
              id={`${uid}-lang`}
              className="input"
              value={settings.language}
              onChange={(event) =>
                onChange({ ...settings, language: event.target.value as Language })
              }
            >
              <option value="it">Italiano</option>
              <option value="en">English</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor={`${uid}-view`}>{t("settings.defaultView")}</label>
            <select
              id={`${uid}-view`}
              className="input"
              value={settings.defaultView}
              onChange={(event) =>
                onChange({ ...settings, defaultView: event.target.value as CalendarView })
              }
            >
              {(["day", "week", "month", "year", "agenda"] as const).map((view) => (
                <option key={view} value={view}>
                  {t(`view.${view}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor={`${uid}-name`}>{t("settings.displayName")}</label>
          <input
            id={`${uid}-name`}
            className="input"
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            onBlur={() => onChange({ ...settings, displayName: name.trim() })}
          />
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={settings.showHolidays}
            onChange={(event) => onChange({ ...settings, showHolidays: event.target.checked })}
          />
          {t("settings.holidays")}
        </label>

        <p className="muted small">{t("settings.shortcuts")}</p>
        <p className="muted small">{t("settings.dataNote")}</p>
      </div>
    </Dialog>
  );
}
