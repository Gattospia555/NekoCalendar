# ADR-0001: Stack client Tauri 2 + React + TypeScript

**Stato:** Accettato · **Data:** 2026-11-12 · **Decisori:** proprietario del progetto (Gatto), con proposta dell'agente AI

## Contesto

NekoCalendar 1.0 è solo per Windows, poi arriverà Android. Il team è una persona non sviluppatrice assistita da un agente AI, con budget zero. Requisiti tecnici chiave: widget desktop trasparenti, senza bordi, sopra o sotto le finestre o incollati al desktop, click-through; CPU < 1 % e RAM < 150 MB in idle; pixel art nitida in futuro; massimo codice condiviso tra piattaforme; un solo linguaggio principale. NekoTune, app sorella, usa React + Electron + Node.js.

## Decisione

Usare **Tauri 2** come contenitore dell'app, con interfaccia in **React + TypeScript** costruita con **Vite**. Il Rust è limitato alle parti di sistema (finestre, notifiche, database) e il codice specifico di Windows sta dietro `#[cfg(windows)]`. La logica del calendario sta in TypeScript puro (`src/domain`), testata con Vitest.

## Opzioni considerate

| Opzione                        | Widget su Windows                                                                 | Android                 | RAM                                                      | Linguaggi              | Esito                                     |
| ------------------------------ | --------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------- | ---------------------- | ----------------------------------------- |
| **Tauri 2 + React**            | Plugin pronti (WorkerW/desktop underlay, sotto/sopra, trasparenza, click-through) | Supportato, meno maturo | Circa 120 MB per un'app semplice (WebView2), da misurare | TypeScript + poco Rust | **Scelta**                                |
| Flutter                        | Multi-finestra ancora sperimentale; widget da scrivere a mano via FFI             | Eccellente              | Probabilmente più bassa                                  | Dart                   | Piano B                                   |
| Electron (come NekoTune)       | Fattibile                                                                         | No                      | La più alta; installer da 80–150 MB                      | TypeScript             | Scartata per consumo                      |
| Kotlin / Compose Multiplatform | Da scrivere a mano                                                                | Ottimo                  | Alta (JVM)                                               | Kotlin                 | Scartata                                  |
| WinUI 3 / Avalonia / .NET MAUI | Nativo                                                                            | Debole o assente        | La più bassa                                             | C#                     | Scartata: niente codice condiviso col web |

## Analisi dei compromessi

- React è lo stesso framework di NekoTune: tema, componenti e login si possono condividere. Cambia solo il contenitore (Tauri invece di Electron) per avere widget leggeri.
- Il web è il dominio che l'agente AI conosce meglio: meno errori, più velocità.
- Il rischio principale è la RAM di WebView2 (ogni widget in una finestra separata aggiunge un renderer). Mitigazioni: ridisegno solo al cambio di cifra, timer fermo a widget nascosto, modalità memoria bassa, e come piano B un'unica finestra contenitore per più widget. **Si misura nella M0** con `scripts/measure.ps1`.
- Le azioni nelle notifiche desktop non sono supportate dal plugin ufficiale: per i promemoria si usano direttamente le API WinRT di Windows (crate `windows`).

## Conseguenze

- Più facile: interfaccia, test, condivisione con NekoTune e HomoLIVE, installer piccoli (NSIS/MSI), aggiornamenti firmati con chiave propria gratuita.
- Più difficile: un po' di Rust specifico di Windows; Android con plugin comunitari giovani (eventuale riscrittura del solo strato Android).
- Da rivalutare: dopo le misure della M0 (RAM/avvio) e all'inizio della fase Android.

## Azioni

1. [x] Scheletro Tauri 2 + React + TypeScript (M0)
2. [ ] Misurare RAM, CPU e avvio del widget sul PC di riferimento (M0)
3. [ ] Valutare i plugin per incollare i widget al desktop (WorkerW) in M3
