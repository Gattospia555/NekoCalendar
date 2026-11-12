//! Database locale (SQLite) tramite il plugin SQL ufficiale di Tauri.
//!
//! Il file `nekocalendar.db` sta nella cartella dati dell'app
//! (`%APPDATA%\com.catdevstudio.nekocalendar\`). Le migrazioni sono numerate,
//! si applicano da sole all'avvio e non si modificano mai dopo il rilascio:
//! ogni cambiamento dello schema è una nuova migrazione.

use tauri_plugin_sql::{Migration, MigrationKind};

/// Indirizzo del database, uguale a quello usato dal frontend (`src/platform/sqliteStore.ts`).
pub const DB_URL: &str = "sqlite:nekocalendar.db";

/// Tutte le migrazioni, in ordine di versione.
pub fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "schema iniziale: calendari, eventi, eccezioni, impostazioni",
        sql: include_str!("../migrations/0001_init.sql"),
        kind: MigrationKind::Up,
    }]
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::{Connection, Executor, Row, SqliteConnection};

    async fn migrated() -> SqliteConnection {
        let mut conn = SqliteConnection::connect("sqlite::memory:").await.unwrap();
        conn.execute("PRAGMA foreign_keys = ON").await.unwrap();
        for migration in migrations() {
            conn.execute(migration.sql).await.unwrap();
        }
        conn
    }

    #[test]
    fn versions_are_increasing_and_unique() {
        let versions: Vec<i64> = migrations().iter().map(|m| m.version).collect();
        assert!(versions.windows(2).all(|w| w[0] < w[1]));
        assert_eq!(versions.first(), Some(&1));
    }

    #[tokio::test]
    async fn schema_accepts_valid_rows_and_rejects_bad_ones() {
        let mut conn = migrated().await;
        conn.execute(
            "INSERT INTO calendars (id, name, color, updated_hlc) VALUES ('c1', 'Personale', '#C58463', 'h')",
        )
        .await
        .unwrap();
        conn.execute(
            "INSERT INTO events (id, calendar_id, kind, title, all_day, start_at, end_at, tzid, reminders, updated_hlc)
             VALUES ('e1', 'c1', 'event', 'Cena', 0, '2026-11-13T20:00', '2026-11-13T22:00', 'Europe/Rome', '[10]', 'h')",
        )
        .await
        .unwrap();
        let row = sqlx::query("SELECT reminders, done, deleted FROM events WHERE id = 'e1'")
            .fetch_one(&mut conn)
            .await
            .unwrap();
        assert_eq!(row.get::<String, _>("reminders"), "[10]");
        assert_eq!(row.get::<i64, _>("done"), 0);

        // Colore non valido, tipo sconosciuto, titolo vuoto, JSON rotto, calendario inesistente.
        for bad in [
            "INSERT INTO calendars (id, name, color, updated_hlc) VALUES ('c2', 'X', 'rosso', 'h')",
            "INSERT INTO events (id, calendar_id, kind, title, all_day, start_at, end_at, tzid, updated_hlc) VALUES ('e2', 'c1', 'festa', 'X', 0, 'a', 'b', 'Europe/Rome', 'h')",
            "INSERT INTO events (id, calendar_id, kind, title, all_day, start_at, end_at, tzid, updated_hlc) VALUES ('e3', 'c1', 'event', '', 0, 'a', 'b', 'Europe/Rome', 'h')",
            "INSERT INTO events (id, calendar_id, kind, title, all_day, start_at, end_at, tzid, reminders, updated_hlc) VALUES ('e4', 'c1', 'event', 'X', 0, 'a', 'b', 'Europe/Rome', '[10', 'h')",
            "INSERT INTO events (id, calendar_id, kind, title, all_day, start_at, end_at, tzid, updated_hlc) VALUES ('e5', 'boh', 'event', 'X', 0, 'a', 'b', 'Europe/Rome', 'h')",
        ] {
            assert!(conn.execute(bad).await.is_err(), "doveva fallire: {bad}");
        }
    }

    #[tokio::test]
    async fn one_exception_per_occurrence() {
        let mut conn = migrated().await;
        conn.execute("INSERT INTO calendars (id, name, color, updated_hlc) VALUES ('c1', 'P', '#000000', 'h')")
            .await
            .unwrap();
        conn.execute(
            "INSERT INTO events (id, calendar_id, kind, title, all_day, start_at, end_at, tzid, rrule, updated_hlc)
             VALUES ('e1', 'c1', 'event', 'Palestra', 0, '2026-11-02T18:30', '2026-11-02T19:30', 'Europe/Rome', 'FREQ=WEEKLY', 'h')",
        )
        .await
        .unwrap();
        let insert =
            "INSERT INTO event_exceptions (id, event_id, occurrence_start, cancelled, updated_hlc)
                      VALUES ('{id}', 'e1', '2026-11-09T18:30', 1, 'h')";
        conn.execute(insert.replace("{id}", "x1").as_str())
            .await
            .unwrap();
        assert!(
            conn.execute(insert.replace("{id}", "x2").as_str())
                .await
                .is_err()
        );
    }
}
