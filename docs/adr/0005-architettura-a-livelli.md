# ADR-0005: Frontend a livelli (clean architecture "leggera")

**Stato:** Accettato · **Data:** 2026-11-12 · **Decisori:** proprietario del progetto (Gatto)

## Contesto

Al termine della M0 il frontend aveva quattro cartelle (`domain`, `platform`, `app`, `widget`) più `theme`, senza una regola chiara su chi può usare chi. Con l'arrivo di database locale (M1), sincronizzazione (M5) e più finestre, il rischio è che la logica del calendario si mescoli con Tauri e con i componenti, rendendo il codice difficile da leggere, da testare e da cambiare.

## Decisione

Tre livelli, con una sola regola: **le dipendenze vanno verso il dominio, mai al contrario**.

```text
presentation  ──►  infrastructure  ──►  domain
 (si vede)         (Tauri, Windows)     (logica pura)
```

| Livello        | Cartella                    | Può usare                | Non può usare                        |
| -------------- | --------------------------- | ------------------------ | ------------------------------------ |
| Dominio        | `src/domain/`               | solo TypeScript puro     | Tauri, React, DOM, gli altri livelli |
| Infrastruttura | `src/infrastructure/tauri/` | dominio, `@tauri-apps/*` | l'interfaccia (`presentation`)       |
| Presentazione  | `src/presentation/`         | dominio, infrastruttura  | `@tauri-apps/*` direttamente         |

- `src/main.tsx` è il punto d'ingresso: sceglie cosa mostrare e collega i livelli.
- La regola è **imposta da ESLint** (`no-restricted-imports` per cartella): chi la viola vede l'errore in `npm run lint`, nell'hook pre-commit e nella CI.
- Si importa con l'alias `@/` (= `src/`) invece di percorsi come `../../domain/dates`.
- Il livello **`application/`** (casi d'uso che coordinano dominio e infrastruttura, per esempio "crea evento e programma il promemoria") **non esiste ancora**: lo creeremo dalla M1, quando ci sarà almeno un caso d'uso reale. Crearlo vuoto adesso sarebbe burocrazia.
- Il Rust (`src-tauri/`) resta com'è: è già piccolo e con un file per argomento (`memory.rs`, `notifications.rs`).

## Opzioni considerate

| Opzione                                                             | Esito                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Tre livelli + regola controllata da ESLint**                      | Scelta: poche cartelle, regola semplice, errori spiegati in italiano                 |
| Clean architecture completa (entities, use cases, adapters, ports…) | Scartata: troppe cartelle e interfacce per un'app di questa dimensione               |
| Organizzazione "per funzione" (`features/countdown`, `features/…`)  | Valida in futuro dentro `domain` e `presentation`, ma oggi ci sono troppo pochi file |
| Lasciare tutto com'è                                                | Scartata: nessuna garanzia che la logica resti separata da Tauri e React             |

## Conseguenze

- Per capire dove mettere un file basta chiedersi: "si vede?" (`presentation`), "parla con Windows/Tauri?" (`infrastructure`), "è pura logica?" (`domain`).
- Il dominio si testa senza avviare nulla; è l'unico livello con soglia di copertura (70 %).
- Se in futuro si sposta la logica su un altro tipo di interfaccia (per esempio mobile), il dominio si riusa così com'è.
- Costo: ogni nuovo livello o eccezione alla regola va deciso e scritto qui (nuovo ADR).
