import { useId, useState, type ReactNode } from "react";
import { convertLocal, dateOf, weekdayIndex } from "@/domain/datetime";
import {
  draftForOccurrence,
  draftFromEvent,
  validateDraft,
  type DraftErrors,
  type EventDraft,
  type RepeatChoice,
} from "@/domain/eventDraft";
import type { Calendar, CalendarEvent, Occurrence } from "@/domain/types";
import {
  formatDayLong,
  formatReminder,
  formatTimeRange,
  weekdayNames,
} from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { EVENT_HUES, eventStripe, HUE_STRIPES } from "../eventPalette";
import type { Scope } from "../useCalendarApp";
import { Dialog } from "./Dialog";
import { Icon } from "./Icons";

export type EditorTarget =
  | { mode: "new"; draft: EventDraft }
  | { mode: "edit"; event: CalendarEvent; occurrence: Occurrence | null }
  | { mode: "readonly"; occurrence: Occurrence };

const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60, 120, 1440, 2880, 10080];
const REPEATS: RepeatChoice[] = ["none", "daily", "weekly", "monthly", "yearly"];

interface EventEditorProps {
  target: EditorTarget;
  calendars: Calendar[];
  timeZone: string;
  onClose: () => void;
  onSave: (draft: EventDraft, scope: Scope) => void;
  onDelete: (scope: Scope) => void;
}

function Field({
  label,
  error,
  children,
  id,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Bozza iniziale: per "solo questa volta" parte dall'occorrenza, riportata nell'orologio dell'evento. */
function initialDraft(target: EditorTarget, scope: Scope, timeZone: string): EventDraft | null {
  if (target.mode === "new") return target.draft;
  if (target.mode === "readonly") return null;
  const { event, occurrence } = target;
  if (scope === "one" && occurrence) {
    const back = (value: string) =>
      event.allDay ? value : convertLocal(value, timeZone, event.tzid);
    return draftForOccurrence(event, {
      start: back(occurrence.start),
      end: back(occurrence.end),
      title: occurrence.title,
    });
  }
  return draftFromEvent(event);
}

export function EventEditor({
  target,
  calendars,
  timeZone,
  onClose,
  onSave,
  onDelete,
}: EventEditorProps) {
  const { t, language } = useI18n();
  const uid = useId();
  const recurringOccurrence =
    target.mode === "edit" && Boolean(target.event.rrule) && Boolean(target.occurrence);
  const [scope, setScope] = useState<Scope>("all");
  const [draft, setDraft] = useState<EventDraft | null>(() =>
    initialDraft(target, "all", timeZone),
  );
  const [errors, setErrors] = useState<DraftErrors>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (target.mode === "readonly" || !draft) {
    const occurrence = target.mode === "readonly" ? target.occurrence : null;
    return (
      <Dialog
        title={occurrence?.title ?? ""}
        onClose={onClose}
        footer={
          <button type="button" className="pill-btn" onClick={onClose}>
            {t("event.close")}
          </button>
        }
      >
        {occurrence && (
          <p>
            {formatDayLong(language, dateOf(occurrence.start))} · {t(`kind.${occurrence.kind}`)}
          </p>
        )}
        <p className="muted">{t("event.holidayNote")}</p>
      </Dialog>
    );
  }

  const set = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) =>
    setDraft({ ...draft, [key]: value });
  const one = scope === "one";
  const isTask = draft.kind === "task";
  const errorText = (key: keyof DraftErrors) =>
    errors[key] ? t(errors[key] as string) : undefined;
  const id = (name: string) => `${uid}-${name}`;
  const described = (key: keyof DraftErrors) => (errors[key] ? `${id(key)}-error` : undefined);

  const changeScope = (next: Scope) => {
    setScope(next);
    setDraft(initialDraft(target, next, timeZone));
    setErrors({});
  };

  const changeKind = (kind: EventDraft["kind"]) => {
    const yearly = kind === "birthday" || kind === "anniversary";
    setDraft({
      ...draft,
      kind,
      allDay: yearly ? true : draft.allDay,
      repeat: yearly && draft.repeat === "none" ? "yearly" : draft.repeat,
    });
  };

  const save = () => {
    const found = validateDraft(one ? { ...draft, repeat: "none" } : draft);
    setErrors(found);
    if (Object.keys(found).length === 0) onSave(draft, scope);
  };

  const weekdays = weekdayNames(language, "short");
  const title =
    target.mode === "new"
      ? t("event.newTitle")
      : one
        ? t("event.editOccurrenceTitle")
        : t("event.editTitle");

  return (
    <Dialog
      title={title}
      onClose={onClose}
      wide
      footer={
        <>
          {target.mode === "edit" &&
            (confirmDelete ? (
              <button type="button" className="danger-btn" onClick={() => onDelete(scope)}>
                <Icon name="trash" size={18} />
                {t("event.confirmDelete", { title: draft.title })}
              </button>
            ) : (
              <button
                type="button"
                className="ghost-btn danger-text"
                onClick={() => setConfirmDelete(true)}
              >
                <Icon name="trash" size={18} />
                {t("event.delete")}
              </button>
            ))}
          <span className="spacer" />
          <button type="button" className="pill-btn" onClick={onClose}>
            {t("event.cancel")}
          </button>
          <button type="button" className="primary-btn" onClick={save}>
            {t("event.save")}
          </button>
        </>
      }
    >
      <form
        className="event-form"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {recurringOccurrence && (
          <fieldset className="scope">
            <legend>{t("scope.editQuestion")}</legend>
            <div className="segmented">
              {(["one", "all"] as Scope[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={scope === value}
                  onClick={() => changeScope(value)}
                >
                  {value === "one" ? t("scope.thisOne") : t("scope.all")}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <Field label={t("event.title")} error={errorText("title")} id={id("title")}>
          <input
            id={id("title")}
            className="input input-title"
            value={draft.title}
            placeholder={t("event.titlePlaceholder")}
            maxLength={200}
            autoFocus
            aria-invalid={Boolean(errors.title)}
            aria-describedby={described("title")}
            onChange={(event) => set("title", event.target.value)}
          />
        </Field>

        {!one && (
          <div className="form-row">
            <Field label={t("event.kind")} id={id("kind")}>
              <select
                id={id("kind")}
                className="input"
                value={draft.kind}
                onChange={(event) => changeKind(event.target.value as EventDraft["kind"])}
              >
                {(["event", "task", "birthday", "anniversary"] as const).map((kind) => (
                  <option key={kind} value={kind}>
                    {t(`kind.${kind}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("event.calendar")} error={errorText("calendarId")} id={id("calendar")}>
              <select
                id={id("calendar")}
                className="input"
                value={draft.calendarId}
                onChange={(event) => set("calendarId", event.target.value)}
              >
                {calendars.map((calendar) => (
                  <option key={calendar.id} value={calendar.id}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {!one && (
          <label className="check-row">
            <input
              type="checkbox"
              checked={draft.allDay}
              onChange={(event) => set("allDay", event.target.checked)}
            />
            {t("event.allDay")}
          </label>
        )}

        <div className="form-row">
          <Field
            label={isTask ? t("event.due") : t("event.start")}
            error={errorText("start")}
            id={id("start")}
          >
            <div className="date-time">
              <input
                id={id("start")}
                type="date"
                className="input"
                value={draft.startDate}
                aria-invalid={Boolean(errors.start)}
                aria-describedby={described("start")}
                onChange={(event) => {
                  const startDate = event.target.value;
                  // Sposta anche la fine, così la durata resta la stessa.
                  const endDate =
                    draft.endDate < startDate || draft.endDate === draft.startDate
                      ? startDate
                      : draft.endDate;
                  setDraft({ ...draft, startDate, endDate });
                }}
              />
              {!draft.allDay && (
                <input
                  type="time"
                  className="input"
                  aria-label={`${isTask ? t("event.due") : t("event.start")} · ${t("event.time")}`}
                  value={draft.startTime}
                  onChange={(event) => set("startTime", event.target.value)}
                />
              )}
            </div>
          </Field>
          {!isTask && (
            <Field label={t("event.end")} error={errorText("end")} id={id("end")}>
              <div className="date-time">
                <input
                  id={id("end")}
                  type="date"
                  className="input"
                  value={draft.endDate}
                  aria-invalid={Boolean(errors.end)}
                  aria-describedby={described("end")}
                  onChange={(event) => set("endDate", event.target.value)}
                />
                {!draft.allDay && (
                  <input
                    type="time"
                    className="input"
                    aria-label={`${t("event.end")} · ${t("event.time")}`}
                    value={draft.endTime}
                    onChange={(event) => set("endTime", event.target.value)}
                  />
                )}
              </div>
            </Field>
          )}
        </div>

        {!one && (
          <Field label={t("event.repeat")} error={errorText("repeat")} id={id("repeat")}>
            <select
              id={id("repeat")}
              className="input"
              value={draft.repeat}
              aria-describedby={described("repeat")}
              onChange={(event) => {
                const repeat = event.target.value as RepeatChoice;
                // "Ogni settimana" senza giorni scelti: si parte dal giorno dell'evento.
                const byDay =
                  repeat === "weekly" && draft.byDay.length === 0
                    ? [weekdayIndex(draft.startDate)]
                    : draft.byDay;
                setDraft({ ...draft, repeat, byDay });
              }}
            >
              {REPEATS.map((repeat) => (
                <option key={repeat} value={repeat}>
                  {t(`repeat.${repeat}`)}
                </option>
              ))}
              {draft.customRule && <option value="custom">{t("repeat.custom")}</option>}
            </select>
            {draft.repeat === "custom" && draft.customRule && (
              <p className="muted">{t("repeat.customRule", { rule: draft.customRule })}</p>
            )}
            {draft.repeat !== "none" && draft.repeat !== "custom" && (
              <div className="repeat-extra">
                <label className="inline-field">
                  {t("repeat.every")}
                  <input
                    type="number"
                    className="input input-small"
                    min={1}
                    max={999}
                    value={draft.interval}
                    onChange={(event) => set("interval", Number(event.target.value))}
                  />
                  {t(`repeat.unit.${draft.repeat}`)}
                </label>
                {draft.repeat === "weekly" && (
                  <div className="weekday-toggles" role="group" aria-label={t("repeat.onDays")}>
                    {weekdays.map((name, day) => (
                      <button
                        key={name}
                        type="button"
                        aria-pressed={draft.byDay.includes(day)}
                        onClick={() =>
                          set(
                            "byDay",
                            draft.byDay.includes(day)
                              ? draft.byDay.filter((d) => d !== day)
                              : [...draft.byDay, day],
                          )
                        }
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
                <fieldset className="repeat-end">
                  <legend>{t("repeat.ends")}</legend>
                  <label className="inline-field">
                    <input
                      type="radio"
                      name={id("end-type")}
                      checked={draft.repeatEnd === "never"}
                      onChange={() => set("repeatEnd", "never")}
                    />
                    {t("repeat.endNever")}
                  </label>
                  <label className="inline-field">
                    <input
                      type="radio"
                      name={id("end-type")}
                      checked={draft.repeatEnd === "count"}
                      onChange={() => set("repeatEnd", "count")}
                    />
                    {t("repeat.endCount")}
                    <input
                      type="number"
                      className="input input-small"
                      min={1}
                      max={9999}
                      value={draft.count}
                      aria-label={t("repeat.endCountSuffix")}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          repeatEnd: "count",
                          count: Number(event.target.value),
                        })
                      }
                    />
                    {t("repeat.endCountSuffix")}
                  </label>
                  <label className="inline-field">
                    <input
                      type="radio"
                      name={id("end-type")}
                      checked={draft.repeatEnd === "until"}
                      onChange={() => set("repeatEnd", "until")}
                    />
                    {t("repeat.endUntil")}
                    <input
                      type="date"
                      className="input"
                      value={draft.until}
                      aria-label={t("repeat.endUntil")}
                      onChange={(event) =>
                        setDraft({ ...draft, repeatEnd: "until", until: event.target.value })
                      }
                    />
                  </label>
                </fieldset>
              </div>
            )}
          </Field>
        )}

        {!one && (
          <div className="form-row">
            <Field label={t("event.location")} id={id("location")}>
              <input
                id={id("location")}
                className="input"
                value={draft.location}
                maxLength={200}
                onChange={(event) => set("location", event.target.value)}
              />
            </Field>
          </div>
        )}

        {!one && !isTask && (
          <fieldset className="reminders">
            <legend>{t("event.reminders")}</legend>
            <div className="reminder-chips">
              {draft.reminders.map((minutes) => (
                <span key={minutes} className="reminder-chip">
                  <Icon name="bell" size={14} />
                  {formatReminder(language, minutes)}
                  <button
                    type="button"
                    aria-label={t("event.removeReminder", {
                      label: formatReminder(language, minutes),
                    })}
                    onClick={() =>
                      set(
                        "reminders",
                        draft.reminders.filter((m) => m !== minutes),
                      )
                    }
                  >
                    <Icon name="close" size={14} />
                  </button>
                </span>
              ))}
              <select
                className="input input-auto"
                aria-label={t("event.addReminder")}
                value=""
                onChange={(event) => {
                  const minutes = Number(event.target.value);
                  if (!draft.reminders.includes(minutes))
                    set(
                      "reminders",
                      [...draft.reminders, minutes].sort((a, b) => a - b),
                    );
                }}
              >
                <option value="">{t("event.addReminder")}…</option>
                {REMINDER_OPTIONS.filter((m) => !draft.reminders.includes(m)).map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {formatReminder(language, minutes)}
                  </option>
                ))}
              </select>
            </div>
            <p className="muted small">{t("reminder.note")}</p>
          </fieldset>
        )}

        {!one && (
          <Field label={t("event.description")} id={id("notes")}>
            <textarea
              id={id("notes")}
              className="input"
              rows={3}
              maxLength={5000}
              value={draft.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </Field>
        )}

        {!one && (
          <fieldset className="colors">
            <legend>{t("event.color")}</legend>
            <div className="swatches">
              <label className="swatch swatch-default" title={t("event.colorDefault")}>
                <input
                  type="radio"
                  name={id("color")}
                  checked={draft.color === null}
                  onChange={() => set("color", null)}
                />
                <span
                  style={{
                    background: eventStripe(
                      calendars.find((c) => c.id === draft.calendarId)?.color ?? "",
                    ),
                  }}
                  aria-hidden="true"
                />
                <span className="sr-only">{t("event.colorDefault")}</span>
              </label>
              {EVENT_HUES.map((hue) => (
                <label key={hue} className="swatch" title={t(`color.${hue}`)}>
                  <input
                    type="radio"
                    name={id("color")}
                    checked={draft.color === HUE_STRIPES[hue]}
                    onChange={() => set("color", HUE_STRIPES[hue])}
                  />
                  <span style={{ background: `var(--ev-${hue}-stripe)` }} aria-hidden="true" />
                  <span className="sr-only">{t(`color.${hue}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {isTask && !one && (
          <label className="check-row">
            <input
              type="checkbox"
              checked={draft.done}
              onChange={(event) => set("done", event.target.checked)}
            />
            {t("event.done")}
          </label>
        )}

        {one && target.mode === "edit" && target.occurrence && (
          <p className="muted small">
            {formatDayLong(language, dateOf(target.occurrence.start))} ·{" "}
            {formatTimeRange(
              language,
              target.occurrence.start,
              target.occurrence.end,
              target.occurrence.allDay,
            )}
          </p>
        )}
        {/* Invio dal campo titolo salva. */}
        <button type="submit" hidden />
      </form>
    </Dialog>
  );
}
