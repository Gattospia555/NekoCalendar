import Database from "@tauri-apps/plugin-sql";
import {
  calendarFromRow,
  calendarToRow,
  eventFromRow,
  eventToRow,
  exceptionFromRow,
  exceptionToRow,
  upsert,
  type CalendarRow,
  type EventRow,
  type ExceptionRow,
} from "@/infrastructure/storage/rows";
import type { CalendarStore, Snapshot } from "@/application/store";
import type { Calendar, CalendarEvent, EventException } from "@/domain/types";

/** Stesso indirizzo registrato nel core Rust (`src-tauri/src/database.rs`), dove vivono le migrazioni. */
export const DB_URL = "sqlite:nekocalendar.db";

/** Database SQLite sul PC: la fonte di verità di NekoCalendar (ADR-0002). */
export class SqliteStore implements CalendarStore {
  private constructor(private readonly db: Database) {}

  /** Apre il database (le migrazioni sono già state applicate all'avvio dell'app). */
  static async open(): Promise<SqliteStore> {
    return new SqliteStore(await Database.load(DB_URL));
  }

  async load(): Promise<Snapshot> {
    const [calendars, events, exceptions, settings] = await Promise.all([
      this.db.select<CalendarRow[]>("SELECT * FROM calendars ORDER BY sort_order, name"),
      this.db.select<EventRow[]>("SELECT * FROM events WHERE deleted = 0"),
      this.db.select<ExceptionRow[]>("SELECT * FROM event_exceptions WHERE deleted = 0"),
      this.db.select<{ key: string; value: string }[]>("SELECT key, value FROM settings"),
    ]);
    return {
      calendars: calendars.map(calendarFromRow),
      events: events.map(eventFromRow),
      exceptions: exceptions.map(exceptionFromRow),
      settings: Object.fromEntries(settings.map((s) => [s.key, s.value])),
    };
  }

  private async write(table: string, row: object): Promise<void> {
    const { sql, values } = upsert(table, row);
    await this.db.execute(sql, values);
  }

  saveCalendar(calendar: Calendar): Promise<void> {
    return this.write("calendars", calendarToRow(calendar));
  }

  saveEvent(event: CalendarEvent): Promise<void> {
    return this.write("events", eventToRow(event));
  }

  saveException(exception: EventException): Promise<void> {
    return this.write("event_exceptions", exceptionToRow(exception));
  }

  saveSetting(key: string, value: string): Promise<void> {
    return this.write("settings", { key, value });
  }
}
