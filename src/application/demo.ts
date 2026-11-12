/**
 * Dati di esempio per l'anteprima nel browser e per le prove: gli stessi eventi
 * del mockup, posizionati attorno alla data di oggi. Nell'app vera non si usano.
 */
import { addDays, startOfWeek, weekdayIndex } from "@/domain/datetime";
import { draftForNew } from "@/domain/eventDraft";
import type { DateKey } from "@/domain/types";
import type { CalendarService } from "./calendarService";
import type { Snapshot } from "./store";

export async function seedDemo(
  service: CalendarService,
  snapshot: Snapshot,
  today: DateKey,
): Promise<void> {
  if (snapshot.events.length > 0) return;
  const [personal, work, birthdays] = snapshot.calendars;
  const saturday = addDays(startOfWeek(today), weekdayIndex(today) >= 5 ? 12 : 5);
  const at = (day: DateKey, time: string, calendarId = personal.id) =>
    draftForNew(day, calendarId, "event", time);
  const drafts = [
    { ...at(today, "17:00"), title: "Ritiro pacco", location: "Tabaccheria, via Roma 12" },
    {
      ...at(addDays(today, 1), "20:00"),
      endTime: "22:00",
      title: "Cena con Marco",
      location: "Trattoria Da Gino",
    },
    {
      ...at(startOfWeek(today), "09:30", work.id),
      endTime: "09:45",
      title: "Stand-up",
      repeat: "weekly" as const,
      byDay: [0, 1, 2, 3, 4],
    },
    {
      ...at(addDays(startOfWeek(today), 7), "18:30"),
      endTime: "19:30",
      title: "Palestra",
      repeat: "weekly" as const,
      byDay: [0],
    },
    { ...at(addDays(today, 8), "10:00", work.id), title: "Riunione team" },
    {
      ...draftForNew(saturday, personal.id),
      allDay: true,
      endDate: addDays(saturday, 1),
      title: "Weekend al lago",
    },
    {
      ...draftForNew(addDays(today, 6), personal.id, "task", "12:00"),
      title: "Pagare bolletta luce",
    },
    { ...draftForNew(addDays(today, 15), work.id, "task", "18:00"), title: "Inviare report" },
    {
      ...draftForNew(addDays(today, 21).replace(/^\d{4}/, "1995"), birthdays.id, "birthday"),
      title: "Compleanno di Luca",
    },
  ];
  for (const draft of drafts) await service.saveDraft(draft);
}
