import { dateOf } from "@/domain/datetime";
import type { CalendarEvent, Occurrence } from "@/domain/types";
import { formatDayShort, formatTime, formatTimeRange, greetingKey } from "@/presentation/i18n/i18n";
import { useI18n } from "@/presentation/i18n/I18nContext";
import { useOccurrenceTitle } from "../occurrenceUtils";
import { Paw } from "./Icons";
import { Cover } from "./OccurrenceBits";

interface SidePanelProps {
  now: string;
  displayName: string;
  todayList: Occurrence[];
  upcoming: Occurrence[];
  tasks: CalendarEvent[];
  onOpen: (occurrence: Occurrence, source?: Element) => void;
  onToggleTask: (task: CalendarEvent, done: boolean, source?: Element) => void;
}

export function SidePanel({
  now,
  displayName,
  todayList,
  upcoming,
  tasks,
  onOpen,
  onToggleTask,
}: SidePanelProps) {
  const { t, language } = useI18n();
  const titleOf = useOccurrenceTitle();
  const today = dateOf(now);
  const greeting = t(greetingKey(Number(now.slice(11, 13))));
  const eventsToday = todayList.filter((o) => o.kind !== "task" && o.kind !== "holiday").length;
  const tasksToday = todayList.filter((o) => o.kind === "task" && !o.done).length;

  const whenLabel = (o: Occurrence) =>
    `${dateOf(o.start) === today ? t("agenda.today") : formatDayShort(language, dateOf(o.start))} · ${formatTimeRange(
      language,
      o.start,
      o.end,
      o.allDay,
    )}`;

  return (
    <aside className="side-panel">
      <div className="greeting">
        <p className="greeting-title">
          {displayName ? `${greeting}, ${displayName}!` : `${greeting}!`}
        </p>
        <p className="greeting-sub">
          {t("greeting.summary", {
            events: t("greeting.events", { count: eventsToday }),
            tasks: t("greeting.tasks", { count: tasksToday }),
          })}
        </p>
      </div>

      <section className="panel card" aria-labelledby="panel-upcoming">
        <div className="panel-head">
          <h2 id="panel-upcoming">{t("panel.upcoming")}</h2>
          <Paw size={22} />
        </div>
        {upcoming.length === 0 ? (
          <p className="panel-empty">{t("panel.noUpcoming")}</p>
        ) : (
          <ul className="upcoming-list">
            {upcoming.map((o, i) => (
              <li key={o.key}>
                <button
                  type="button"
                  className={`upcoming-item${i === 0 ? " is-next" : ""}`}
                  onClick={(event) => onOpen(o, event.currentTarget)}
                >
                  <Cover occurrence={o} />
                  <span className="upcoming-text">
                    <span className="upcoming-title">{titleOf(o)}</span>
                    <span className="upcoming-when">{whenLabel(o)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel card" aria-labelledby="panel-tasks">
        <div className="panel-head">
          <h2 id="panel-tasks">{t("panel.tasks")}</h2>
        </div>
        {tasks.length === 0 ? (
          <p className="panel-empty">{t("panel.noTasks")}</p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <li key={task.id}>
                <label className={`task-row${task.done ? " is-done" : ""}`}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={(event) =>
                      onToggleTask(task, event.target.checked, event.currentTarget)
                    }
                  />
                  <span className="task-title">{task.title}</span>
                  <span className="task-due">
                    {dateOf(task.start) === today
                      ? formatTime(task.start) || t("agenda.today")
                      : formatDayShort(language, dateOf(task.start))}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
