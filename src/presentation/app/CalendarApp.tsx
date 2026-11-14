import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CalendarService } from "@/application/calendarService";
import type { Snapshot } from "@/application/store";
import { weekDays } from "@/domain/calendarGrid";
import { addDays } from "@/domain/datetime";
import { draftForNew } from "@/domain/eventDraft";
import { skyPeriod } from "@/domain/neko";
import type { CalendarView, DateKey, Occurrence } from "@/domain/types";
import { I18nProvider, useI18n } from "@/presentation/i18n/I18nContext";
import { AgendaView } from "./components/AgendaView";
import { CalendarDialog } from "./components/CalendarDialog";
import { DayTimeline } from "./components/DayTimeline";
import { EventEditor, type EditorTarget } from "./components/EventEditor";
import { MonthView } from "./components/MonthView";
import { NekoPanel } from "./components/NekoPanel";
import { SettingsDialog } from "./components/SettingsDialog";
import { Sidebar } from "./components/Sidebar";
import { TimeGridView } from "./components/TimeGridView";
import { Toolbar } from "./components/Toolbar";
import { YearView } from "./components/YearView";
import { ErrorBoundary } from "./ErrorBoundary";
import { FreshEventContext } from "./occurrenceUtils";
import { useCalendarApp, type CalendarApp as AppState } from "./useCalendarApp";
import "./app.css";

const VIEW_KEYS: Record<string, CalendarView> = {
  "1": "day",
  "2": "week",
  "3": "month",
  "4": "year",
  "5": "agenda",
};

/** Tasti rapidi, attivi solo quando non si sta scrivendo e non c'è una finestra aperta. */
function useShortcuts(navigation: AppState["navigation"], busy: boolean, onNew: () => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (busy || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      const key = event.key.toLowerCase();
      if (key === "n") onNew();
      else if (key === "t") navigation.goToday();
      else if (event.key === "ArrowLeft") navigation.previous();
      else if (event.key === "ArrowRight") navigation.next();
      else if (VIEW_KEYS[event.key]) navigation.setView(VIEW_KEYS[event.key]);
      else return;
      event.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, navigation, onNew]);
}

/**
 * Contenitore della vista corrente. Nasce di nuovo a ogni spostamento (chiave diversa)
 * ed entra salendo appena, come le sezioni di NekoTune; all'apertura dell'app no.
 */
function ViewStage({ kind, children }: { kind: string; children: ReactNode }) {
  return <div className={`view-stage${kind === "none" ? "" : " enter-view"}`}>{children}</div>;
}

function CalendarScreen({ app }: { app: AppState }) {
  const { t } = useI18n();
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const firstCalendar = app.calendars.find((c) => c.visible)?.id ?? app.calendars[0]?.id ?? "";

  const nav = app.navigation;
  const openEditor = (target: EditorTarget) => setEditor(target);
  const closeEditor = () => setEditor(null);

  const newEvent = (
    day: DateKey = app.view === "week" || app.view === "agenda" ? app.today : app.anchor,
    time: string | null = null,
  ) => openEditor({ mode: "new", draft: draftForNew(day, firstCalendar, "event", time) });

  const open = (occurrence: Occurrence) => {
    const event = app.eventOf(occurrence);
    openEditor(
      event && !occurrence.readOnly
        ? { mode: "edit", event, occurrence }
        : { mode: "readonly", occurrence },
    );
  };

  useShortcuts(nav, Boolean(editor) || settingsOpen || calendarOpen, () => newEvent());

  // Pallini della striscia della settimana nella vista Giorno.
  const weekStart = weekDays(app.anchor)[0];
  const { query } = app;
  const weekOccurrences = useMemo(
    () => query(weekStart, addDays(weekStart, 7)),
    [query, weekStart],
  );

  const view = (() => {
    switch (app.view) {
      case "month":
        return (
          <MonthView
            anchor={app.anchor}
            today={app.today}
            occurrences={app.occurrences}
            onOpen={open}
            onNewOnDay={(day) => newEvent(day)}
            onOpenDay={nav.openDay}
          />
        );
      case "day":
        return (
          <DayTimeline
            anchor={app.anchor}
            today={app.today}
            now={app.now}
            occurrences={app.occurrences}
            weekOccurrences={weekOccurrences}
            onOpen={open}
            onSelectDay={(day) => nav.openDay(day)}
            onNew={(day) => newEvent(day)}
          />
        );
      case "week":
        return (
          <TimeGridView
            mode="week"
            anchor={app.anchor}
            today={app.today}
            now={app.now}
            occurrences={app.occurrences}
            onOpen={open}
            onNewAt={(day, time) => newEvent(day, time)}
            onOpenDay={nav.openDay}
          />
        );
      case "year":
        return (
          <YearView
            anchor={app.anchor}
            today={app.today}
            occurrences={app.occurrences}
            onOpenDay={nav.openDay}
          />
        );
      case "agenda":
        return (
          <AgendaView
            anchor={app.anchor}
            today={app.today}
            occurrences={app.occurrences}
            onOpen={open}
          />
        );
    }
  })();

  return (
    // Il "cielo": lo sfondo cambia colore con il momento della giornata.
    <div className="shell" data-sky={skyPeriod(app.now)}>
      <Sidebar
        anchor={app.anchor}
        today={app.today}
        calendars={app.calendars}
        showHolidays={app.settings.showHolidays}
        query={app.query}
        onNewEvent={() => newEvent()}
        onPickDay={(day) => nav.openDay(day)}
        onToggleCalendar={(calendar, visible) =>
          void app.actions.setCalendarVisible(calendar, visible)
        }
        onToggleHolidays={(visible) =>
          void app.actions.saveSettings({ ...app.settings, showHolidays: visible })
        }
        onAddCalendar={() => setCalendarOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="main panel" aria-label={t("nav.calendar")}>
        {app.error && (
          <div className="error-banner" role="alert">
            <span>{t("app.saveError", { error: app.error })}</span>
            <button type="button" className="pill-btn" onClick={app.clearError}>
              {t("event.close")}
            </button>
          </div>
        )}
        <Toolbar
          view={app.view}
          anchor={app.anchor}
          now={app.now}
          displayName={app.settings.displayName}
          transition={app.transition.kind}
          onPrevious={nav.previous}
          onNext={nav.next}
          onToday={nav.goToday}
          onView={nav.setView}
        />
        {/* Nuova chiave a ogni spostamento: la vista entra con la sua animazione. */}
        <FreshEventContext.Provider value={app.freshEventId}>
          <ViewStage key={`${app.view}:${app.transition.tick}`} kind={app.transition.kind}>
            {view}
          </ViewStage>
        </FreshEventContext.Provider>
      </main>
      <NekoPanel
        now={app.now}
        upcoming={app.upcomingLong}
        tasks={app.tasks}
        onOpen={open}
        onToggleTask={(task, done) => void app.actions.setTaskDone(task, done)}
        onDone={(occurrence) => {
          const event = app.eventOf(occurrence);
          if (event) void app.actions.setTaskDone(event, true);
        }}
      />

      {editor && (
        <EventEditor
          target={editor}
          calendars={app.calendars}
          timeZone={app.timeZone}
          onClose={() => closeEditor()}
          onSave={async (draft, scope) => {
            let ok: boolean;
            if (editor.mode === "edit" && scope === "one" && editor.occurrence) {
              ok = await app.actions.saveOccurrence(
                editor.event,
                editor.occurrence.occurrenceStart,
                draft,
              );
            } else {
              ok = await app.actions.saveEvent(
                draft,
                editor.mode === "edit" ? editor.event : undefined,
              );
            }
            if (!ok) return;
            // L'evento salvato si fa trovare con un piccolo "pop" (vedi app.css).
            closeEditor();
          }}
          onDelete={async (scope) => {
            if (editor.mode !== "edit") return;
            const ok =
              scope === "one" && editor.occurrence
                ? await app.actions.deleteOccurrence(
                    editor.event,
                    editor.occurrence.occurrenceStart,
                  )
                : await app.actions.deleteEvent(editor.event);
            if (ok) closeEditor();
          }}
        />
      )}
      {settingsOpen && (
        <SettingsDialog
          settings={app.settings}
          onChange={(next) => void app.actions.saveSettings(next)}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {calendarOpen && (
        <CalendarDialog
          onClose={() => setCalendarOpen(false)}
          onCreate={async (name, color) => {
            if (await app.actions.createCalendar(name, color)) setCalendarOpen(false);
          }}
        />
      )}
    </div>
  );
}

/** Il calendario completo, con lingua e tema presi dalle impostazioni. */
export function CalendarApp({
  service,
  snapshot,
}: {
  service: CalendarService;
  snapshot: Snapshot;
}) {
  const app = useCalendarApp(service, snapshot);
  const { theme, language } = app.settings;

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "auto") delete root.dataset.theme;
    else root.dataset.theme = theme;
    root.lang = language;
  }, [theme, language]);

  return (
    <I18nProvider language={language}>
      <ErrorBoundary language={language}>
        <CalendarScreen app={app} />
      </ErrorBoundary>
    </I18nProvider>
  );
}
