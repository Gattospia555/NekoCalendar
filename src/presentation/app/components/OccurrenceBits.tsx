import type { EventKind, Occurrence } from "@/domain/types";
import { formatTime } from "@/presentation/i18n/i18n";
import { tint, useFreshClass, useOccurrenceTitle } from "../occurrenceUtils";
import { Icon, type IconName } from "./Icons";

const KIND_ICONS: Record<EventKind, IconName> = {
  event: "calendar",
  birthday: "cake",
  anniversary: "heart",
  task: "task",
  holiday: "flag",
};

/** "Copertina" quadrata come gli album di NekoTune: colore dell'evento e icona del tipo. */
export function Cover({
  occurrence,
  size = 52,
}: {
  occurrence: Pick<Occurrence, "kind" | "color">;
  size?: number;
}) {
  return (
    <span
      className="cover"
      style={{ ...tint(occurrence.color), width: size, height: size }}
      aria-hidden="true"
    >
      <Icon name={KIND_ICONS[occurrence.kind]} size={Math.round(size * 0.5)} />
    </span>
  );
}

/** Etichetta cliccabile di un evento nella griglia del mese e nelle liste brevi. */
export function OccurrenceChip({
  occurrence,
  onOpen,
}: {
  occurrence: Occurrence;
  onOpen: (o: Occurrence) => void;
}) {
  const titleOf = useOccurrenceTitle();
  const time = occurrence.allDay ? "" : formatTime(occurrence.start);
  const title = titleOf(occurrence);
  const fresh = useFreshClass(occurrence.eventId);
  return (
    <button
      type="button"
      className={`chip${occurrence.done ? " chip-done" : ""}${fresh}`}
      style={tint(occurrence.color)}
      title={time ? `${time} ${title}` : title}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(occurrence);
      }}
    >
      <span className="chip-dot" aria-hidden="true" />
      {time && <span className="chip-time">{time}</span>}
      <span className="chip-title">{title}</span>
    </button>
  );
}
