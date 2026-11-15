import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import type { CalendarView, Language, Settings, ThemePreference } from "@/domain/types";
import { greetingKey } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { Select } from "./controls/Select";
import { Dialog } from "./Dialog";
import { Icon, type IconName } from "./Icons";

interface SettingsDialogProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onClose: () => void;
}

/** Una sezione delle impostazioni: icona tonda, titolo e contenuto. */
function Section({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <section className="settings-section" aria-labelledby={id}>
      <h3 id={id} className="settings-title">
        <span className="round-icon" aria-hidden="true">
          <Icon name={icon} size={16} />
        </span>
        {title}
      </h3>
      <div className="settings-body">{children}</div>
    </section>
  );
}

/** Le scorciatoie da tastiera, mostrate come tasti. */
const SHORTCUTS: [
  string[],
  "shortcut.new" | "shortcut.today" | "shortcut.move" | "shortcut.views",
][] = [
  [["N"], "shortcut.new"],
  [["T"], "shortcut.today"],
  [["←", "→"], "shortcut.move"],
  [["1", "5"], "shortcut.views"],
];

/** Impostazioni: ogni modifica si salva subito (nessun pulsante "Salva" da ricordare). */
export function SettingsDialog({ settings, onChange, onClose }: SettingsDialogProps) {
  const { t } = useI18n();
  const uid = useId();
  const [name, setName] = useState(settings.displayName);
  const themes: [ThemePreference, string, IconName][] = [
    ["auto", t("settings.themeAuto"), "monitor"],
    ["light", t("settings.themeLight"), "sun"],
    ["dark", t("settings.themeDark"), "moon"],
  ];
  const greeting = t(greetingKey(new Date().getHours()));

  // Il nome si salva uscendo dal campo; chiudendo con Esc o "Fatto" lo salviamo comunque.
  const close = () => {
    if (name.trim() !== settings.displayName) onChange({ ...settings, displayName: name.trim() });
    onClose();
  };

  // Gruppo di scelte (radio): le frecce passano da un tema all'altro, come i radio veri.
  const onThemeKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const index = themes.findIndex(([value]) => value === settings.theme);
    const next = themes[(index + step + themes.length) % themes.length][0];
    onChange({ ...settings, theme: next });
    event.currentTarget.querySelector<HTMLElement>(`[data-theme-value="${next}"]`)?.focus();
  };

  return (
    <Dialog
      title={t("settings.title")}
      onClose={close}
      wide
      footer={
        <>
          <span className="spacer" />
          <button type="button" className="primary-btn" onClick={close}>
            {t("settings.done")}
          </button>
        </>
      }
    >
      <div className="settings">
        <Section icon="sun" title={t("settings.look")}>
          <div
            className="theme-cards"
            role="radiogroup"
            aria-label={t("settings.theme")}
            onKeyDown={onThemeKey}
          >
            {themes.map(([value, label, icon]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={settings.theme === value}
                tabIndex={settings.theme === value ? 0 : -1}
                data-theme-value={value}
                className={`theme-card theme-card--${value}`}
                onClick={() => onChange({ ...settings, theme: value })}
              >
                <span className="theme-preview" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="theme-label">
                  <Icon name={icon} size={16} />
                  {label}
                </span>
              </button>
            ))}
          </div>
        </Section>

        <Section icon="globe" title={t("settings.languageAndStart")}>
          <div className="form-row">
            <div className="field">
              <label htmlFor={`${uid}-lang`}>{t("settings.language")}</label>
              <Select
                id={`${uid}-lang`}
                value={settings.language}
                onChange={(language: Language) => onChange({ ...settings, language })}
                options={[
                  { value: "it", label: "Italiano" },
                  { value: "en", label: "English" },
                ]}
              />
            </div>
            <div className="field">
              <label htmlFor={`${uid}-view`}>{t("settings.defaultView")}</label>
              <Select
                id={`${uid}-view`}
                value={settings.defaultView}
                onChange={(defaultView: CalendarView) => onChange({ ...settings, defaultView })}
                options={(["day", "week", "month", "year", "agenda"] as const).map((view) => ({
                  value: view,
                  label: t(`view.${view}`),
                }))}
              />
            </div>
          </div>
        </Section>

        <Section icon="user" title={t("settings.you")}>
          <div className="field">
            <label htmlFor={`${uid}-name`}>{t("settings.displayName")}</label>
            <input
              id={`${uid}-name`}
              className="input"
              value={name}
              maxLength={40}
              placeholder={t("settings.namePlaceholder")}
              aria-describedby={`${uid}-name-preview`}
              onChange={(event) => setName(event.target.value)}
              onBlur={() => onChange({ ...settings, displayName: name.trim() })}
            />
            <p id={`${uid}-name-preview`} className="settings-hint">
              {t("settings.namePreview", {
                greeting: name.trim() ? `${greeting}, ${name.trim()}` : greeting,
              })}
            </p>
          </div>
        </Section>

        <Section icon="calendar" title={t("settings.calendar")}>
          <label className="switch-row">
            <span>
              <span className="switch-title">{t("settings.holidays")}</span>
              <span className="settings-hint">{t("settings.holidaysHint")}</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={settings.showHolidays}
              onChange={(event) => onChange({ ...settings, showHolidays: event.target.checked })}
            />
          </label>
        </Section>

        <Section icon="keyboard" title={t("settings.shortcutsTitle")}>
          <ul className="shortcut-list">
            {SHORTCUTS.map(([keys, label]) => (
              <li key={label}>
                <span className="shortcut-keys">
                  {keys.map((key, i) => (
                    <span key={key}>
                      {i > 0 && <span className="shortcut-sep">{keys[0] === "1" ? "–" : ""}</span>}
                      <kbd>{key}</kbd>
                    </span>
                  ))}
                </span>
                <span>{t(label)}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section icon="shield" title={t("settings.data")}>
          <p className="settings-hint">{t("settings.dataNote")}</p>
        </Section>
      </div>
    </Dialog>
  );
}
