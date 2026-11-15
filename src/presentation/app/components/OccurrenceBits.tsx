import type { Occurrence } from "@/domain/types";
import { formatTime } from "@/presentation/i18n/i18n";
import { emojiUrl, iconOf } from "../emoji";
import { eventStyle, useFreshClass, useOccurrenceTitle } from "../occurrenceUtils";

/**
 * "Copertina" quadrata come gli album di NekoTune: la tinta dell'evento e la sua icona
 * a colori (scelta dal titolo: torta per i compleanni, aereo per i viaggi…).
 */
export function Cover({
  occurrence,
  size = 52,
}: {
  occurrence: Pick<Occurrence, "kind" | "color" | "title">;
  size?: number;
}) {
  const emoji = Math.round(size * 0.62);
  return (
    <span
      className="cover"
      style={{ ...eventStyle(occurrence.color), width: size, height: size }}
      aria-hidden="true"
    >
      <img src={emojiUrl(iconOf(occurrence), "3d")} alt="" width={emoji} height={emoji} />
    </span>
  );
}

/** Icona piccola e piatta per etichette e blocchi del calendario. */
export function EventEmoji({ occurrence }: { occurrence: Pick<Occurrence, "kind" | "title"> }) {
  return (
    <img
      className="event-emoji"
      src={emojiUrl(iconOf(occurrence), "flat")}
      alt=""
      width={14}
      height={14}
      aria-hidden="true"
    />
  );
}

/** Etichetta cliccabile di un evento nella griglia del mese e nelle liste brevi. */
export function OccurrenceChip({
  occurrence,
  onOpen,
}: {
  occurrence: Occurrence;
  onOpen: (o: Occurrence, source?: Element) => void;
}) {
  const titleOf = useOccurrenceTitle();
  const time = occurrence.allDay ? "" : formatTime(occurrence.start);
  const title = titleOf(occurrence);
  const fresh = useFreshClass(occurrence.eventId);
  return (
    <button
      type="button"
      className={`chip${occurrence.done ? " chip-done" : ""}${fresh}`}
      style={eventStyle(occurrence.color)}
      title={time ? `${time} ${title}` : title}
      onClick={(event) => {
        event.stopPropagation();
        onOpen(occurrence, event.currentTarget);
      }}
    >
      <EventEmoji occurrence={occurrence} />
      {time && <span className="chip-time">{time}</span>}
      <span className="chip-title">{title}</span>
    </button>
  );
}
