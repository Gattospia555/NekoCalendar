# ADR-0006: Database locale con il plugin SQL ufficiale di Tauri

**Stato:** Accettato · **Data:** 2026-11-12 · **Decisori:** proprietario del progetto (Gatto), con proposta dell'agente AI

## Contesto

La M1 richiede un'archiviazione locale solida: SQLite (ADR-0002), migrazioni versionate e testate, codice semplice da mantenere per un team di una persona assistita dall'AI. La logica del calendario vive in TypeScript (ADR-0001).

## Decisione

Usare **`tauri-plugin-sql`** (plugin ufficiale di Tauri, basato su sqlx) con le **migrazioni registrate nel core Rust** e applicate all'avvio (`preload`). Le query partono da TypeScript dietro l'interfaccia `CalendarStore`, con **upsert parametrici** (`$1, $2…`) e nomi di tabella e colonna validati.

## Opzioni considerate

| Opzione                               | Pro                                                   | Contro                                                                        | Esito      |
| ------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- | ---------- |
| **tauri-plugin-sql**                  | Ufficiale, documentato; poco Rust; migrazioni incluse | SQL dal frontend: serve disciplina (solo parametri, permessi minimi)          | **Scelta** |
| Comandi Rust con `rusqlite`           | Controllo totale; SQL solo nel core                   | Molto più Rust da scrivere e mantenere; ogni operazione = un comando          | Scartata   |
| SQLite in WebAssembly (sql.js / OPFS) | Tutto in TypeScript                                   | Il file vive nel profilo di WebView2: backup e accesso dal tray più difficili | Scartata   |
| IndexedDB                             | Nessuna dipendenza                                    | Non è SQL; migrazioni e query complesse più scomode; legato a WebView2        | Scartata   |

## Sicurezza

- Solo la finestra principale ha i permessi `sql:default` e `sql:allow-execute`; i widget non accedono al database.
- Lo schema ha vincoli `CHECK` e chiavi esterne: dati sbagliati vengono rifiutati anche se un bug li lasciasse passare.
- I test eseguono la stessa migrazione due volte: in Rust (sqlx) e in TypeScript (sql.js), con andata e ritorno di ogni tabella.

## Conseguenze

- Più facile: aggiungere query e tabelle da TypeScript; provare tutto senza Windows.
- Più difficile: l'app nella tray (M2) dovrà leggere i promemoria dallo stesso database; il plugin lo permette perché il database è aperto dal core.
- Da rivalutare: se servisse cifrare il database (SQLCipher) o fare query dal processo nella tray senza finestra.
