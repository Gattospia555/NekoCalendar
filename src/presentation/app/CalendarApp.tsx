import { useEffect, useState } from "react";
import { CalendarService } from "@/application/calendarService";
import type { Snapshot } from "@/application/store";
import { draftForNew } from "@/domain/eventDraft";
import type { CalendarView, DateKey, Occurrence } from "@/domain/types";
import { I18nProvider, useI18n } from "@/presentation/i18n/I18nContext";
import { AgendaView } from "./components/AgendaView";
import { CalendarDialog } from "./components/CalendarDialog";
import { EventEditor, type EditorTarget } from "./components/EventEditor";
import { MonthView } from "./components/MonthView";
import { NextEventBar } from "./components/NextEventBar";
import { SettingsDialog } from "./components/SettingsDialog";
import { SidePanel } from "./components/SidePanel";
import { Sidebar } from "./components/Sidebar";
import { TimeGridView } from "./components/TimeGridView";
import { Toolbar } from "./components/Toolbar";
import { YearView } from "./components/YearView";
import { ErrorBoundary } from "./ErrorBoundary";
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
function useShortcuts(app: AppState, busy: boolean, onNew: () => void) {
  const { navigation } = app;
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

function CalendarScreen({ app }: { app: AppState }) {
  const { t } = useI18n();
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const firstCalendar = app.calendars.find((c) => c.visible)?.id ?? app.calendars[0]?.id ?? "";

  const newEvent = (
    day: DateKey = app.view === "month" || app.view === "year" ? app.anchor : app.today,
    time: string | null = null,
  ) => setEditor({ mode: "new", draft: draftForNew(day, firstCalendar, "event", time) });

  const open = (occurrence: Occurrence) => {
    const event = app.eventOf(occurrence);
    setEditor(
      event && !occurrence.readOnly
        ? { mode: "edit", event, occurrence }
        : { mode: "readonly", occurrence },
    );
  };

  useShortcuts(app, Boolean(editor) || settingsOpen || calendarOpen, () => newEvent());

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
            onOpenDay={app.navigation.openDay}
          />
        );
      case "week":
      case "day":
        return (
          <TimeGridView
            mode={app.view}
            anchor={app.anchor}
            today={app.today}
            now={app.now}
            occurrences={app.occurrences}
            onOpen={open}
            onNewAt={(day, time) => newEvent(day, time)}
            onOpenDay={app.navigation.openDay}
          />
        );
      case "year":
        return (
          <YearView
            anchor={app.anchor}
            today={app.today}
            occurrences={app.occurrences}
            onOpenDay={app.navigation.openDay}
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
    <div className="shell">
      <div className="shell-body">
        <Sidebar
          view={app.view}
          calendars={app.calendars}
          showHolidays={app.settings.showHolidays}
          upcomingCount={app.upcomingList.length}
          onShowCalendar={() =>
            app.navigation.setView(
              app.settings.defaultView === "agenda" ? "month" : app.settings.defaultView,
            )
          }
          onShowAgenda={() => {
            app.navigation.goToday();
            app.navigation.setView("agenda");
          }}
          onToggleCalendar={(calendar, visible) =>
            void app.actions.setCalendarVisible(calendar, visible)
          }
          onToggleHolidays={(visible) =>
            void app.actions.saveSettings({ ...app.settings, showHolidays: visible })
          }
          onAddCalendar={() => setCalendarOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <main className="main">
          {app.error && (
            <div className="error-banner" role="alert">
              <span>{t("app.saveError", { error: app.error })}</span>
              <button type="button" className="pill-btn" onClick={app.clearError}>
                {t("event.close")}
              </button>
            </div>
          )}
          <div className="content">
            <section className="calendar-area" aria-label={t("nav.calendar")}>
              <Toolbar
                view={app.view}
                anchor={app.anchor}
                onPrevious={app.navigation.previous}
                onNext={app.navigation.next}
                onToday={app.navigation.goToday}
                onView={app.navigation.setView}
                onNewEvent={() => newEvent()}
              />
              {view}
            </section>
            <SidePanel
              now={app.now}
              displayName={app.settings.displayName}
              todayList={app.todayList}
              upcoming={app.upcomingList}
              tasks={app.tasks}
              onOpen={open}
              onToggleTask={(task, done) => void app.actions.setTaskDone(task, done)}
            />
          </div>
        </main>
      </div>
      <NextEventBar
        now={app.now}
        upcoming={app.upcomingList}
        onOpen={open}
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
          onClose={() => setEditor(null)}
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
            if (ok) setEditor(null);
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
            if (ok) setEditor(null);
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
