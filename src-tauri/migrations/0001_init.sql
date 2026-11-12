-- Migrazione 0001 (M1): schema iniziale del database locale di NekoCalendar.
-- Il database sul PC è la fonte di verità (ADR-0002). Ogni tabella sincronizzabile
-- ha `updated_hlc` (orologio logico ibrido) e `deleted` (lapide), vedi ADR-0003.
-- Le date sono testi: "YYYY-MM-DD" (tutto il giorno) o "YYYY-MM-DDTHH:mm" (ora locale nel fuso `tzid`).

CREATE TABLE calendars (
  id          TEXT    PRIMARY KEY NOT NULL,
  name        TEXT    NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  color       TEXT    NOT NULL CHECK (color GLOB '#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]'),
  visible     INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_hlc TEXT    NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1))
);

CREATE TABLE events (
  id          TEXT    PRIMARY KEY NOT NULL,
  calendar_id TEXT    NOT NULL REFERENCES calendars (id),
  kind        TEXT    NOT NULL CHECK (kind IN ('event', 'birthday', 'anniversary', 'task')),
  title       TEXT    NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description TEXT    NOT NULL DEFAULT '',
  location    TEXT    NOT NULL DEFAULT '',
  all_day     INTEGER NOT NULL CHECK (all_day IN (0, 1)),
  start_at    TEXT    NOT NULL,
  end_at      TEXT    NOT NULL,
  tzid        TEXT    NOT NULL,
  rrule       TEXT,
  color       TEXT,
  -- Minuti di anticipo dei promemoria, come array JSON (es. "[10,60]").
  reminders   TEXT    NOT NULL DEFAULT '[]' CHECK (json_valid(reminders)),
  done        INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
  updated_hlc TEXT    NOT NULL,
  deleted     INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1))
);

CREATE INDEX events_by_calendar ON events (calendar_id);
CREATE INDEX events_by_start ON events (start_at);
CREATE INDEX events_by_hlc ON events (updated_hlc);

CREATE TABLE event_exceptions (
  id               TEXT    PRIMARY KEY NOT NULL,
  event_id         TEXT    NOT NULL REFERENCES events (id),
  occurrence_start TEXT    NOT NULL,
  cancelled        INTEGER NOT NULL DEFAULT 0 CHECK (cancelled IN (0, 1)),
  title            TEXT,
  start_at         TEXT,
  end_at           TEXT,
  updated_hlc      TEXT    NOT NULL,
  deleted          INTEGER NOT NULL DEFAULT 0 CHECK (deleted IN (0, 1)),
  UNIQUE (event_id, occurrence_start)
);

-- Preferenze del dispositivo (tema, lingua, id del dispositivo…): non si sincronizzano.
CREATE TABLE settings (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
