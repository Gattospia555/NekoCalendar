# NekoCalendar — Visione

## Scopo

Un calendario per Windows (poi Android) bello da tenere sul desktop: **widget leggeri e personalizzabili** stile Rainmeter, **countdown** con effetti, **promemoria che non si perdono** e, dopo la 1.0, calendari condivisi stile TimeTree e un ecosistema di integrazioni con le altre app Neko. Gratis, rispettoso della privacy, adatto a tutte le età.

Elementi distintivi su cui investire più cura: countdown ed effetti, widget leggeri e configurabili, ecosistema Neko con account unico, privacy chiara, consumo minimo di risorse.

## Scope (MoSCoW)

**Versione 1.0 (solo Windows, circa 8 settimane)**

- **Must**: viste giorno/settimana/mese/anno/agenda; eventi con ricorrenze RRULE; promemoria e notifiche affidabili anche ad app chiusa; widget desktop mese e agenda; countdown personalizzabile; motore Style Pack con il solo tema Base Neko chiaro/scuro; archivio locale solido con backup/export; import/export ICS; italiano e inglese; sicurezza di base; documentazione.
- **Should** (se i tempi lo consentono, in quest'ordine): account e sync offline-first con Supabase; backup nel cloud.

**Subito dopo la 1.0 (Could, in ordine di priorità)**: API key e API pubblica v1; calendari collaborativi; integrazioni Google/Outlook/CalDAV; Android; piano Plus; Focus/Pomodoro; liste condivise; turni di lavoro; cifratura end-to-end; pubblicità non invasiva (mai nei widget).

**Fase grafica (dopo la 1.0)**: Style Pack Pixel Art e Cute, mascotte Neko interattiva, ricerca asset integrata, asset personali e temi condivisibili.

**Won't (per ora)**: marketplace, assistente AI, pagina di prenotazione pubblica, smartwatch, iOS.

Regola: niente Could, fase grafica o Won't prima che Must e Should siano completati e verificati, ma l'architettura le rende possibili senza riscritture. Se i tempi slittano si taglia dal basso (prima lo Should).

## Obiettivi misurabili

| Obiettivo                                                | Valore                      | Come si verifica                       |
| -------------------------------------------------------- | --------------------------- | -------------------------------------- |
| Avvio a freddo                                           | < 2 s su PC di fascia media | cronometro su build di rilascio        |
| CPU widget in idle                                       | < 1 %                       | `scripts/measure.ps1`                  |
| RAM widget                                               | < 150 MB                    | `scripts/measure.ps1`                  |
| Batteria Android in background                           | < 2 % al giorno             | quando esisterà Android                |
| Modifica visibile su un altro dispositivo                | < 3 s con rete              | test di sync (M5)                      |
| Promemoria puntuali, anche ad app chiusa                 | entro 30 s                  | test M2                                |
| Sessioni senza crash                                     | ≥ 99,5 %                    | crash report (solo con consenso)       |
| Copertura test logica di dominio                         | ≥ 70 %                      | `npm run test:coverage` (blocca la CI) |
| Vulnerabilità critiche/alte nelle dipendenze al rilascio | 0                           | `npm audit`, Dependabot                |

**Definizione di "fatto" per ogni milestone**: funzionalità completa, test verdi, obiettivi misurabili rispettati, documentazione e changelog aggiornati, commit e tag creati.

## Milestone

| Milestone                  | Settimane (indicative) | Versione | Contenuto                                                                                          |
| -------------------------- | ---------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| M0 Setup e prototipo       | 16–22 nov 2026         | v0.1.0   | Repository, CI, documenti base, prototipo di widget, misure RAM/CPU, notifiche programmate         |
| M1 Dati e calendario       | 23 nov – 6 dic         | v0.2.0   | SQLite e migrazioni, eventi e ricorrenze, cinque viste, tema chiaro/scuro, IT/EN                   |
| M2 Promemoria              | 7–13 dic               | v0.3.0   | App nella tray, avvio con Windows, promemoria a due livelli, posticipa/fatto, test ora legale      |
| M3 Widget e countdown      | 14–20 dic              | v0.4.0   | Widget mese e agenda, countdown in 5 stili, risparmio energia, profili, auto-hide a schermo intero |
| M4 Import, backup, stili   | 21–27 dic              | v0.5.0   | ICS/CSV, backup e ripristino, ricerca, compleanni e festività, motore Style Pack, primo avvio      |
| M5 Account e sync (Should) | 28 dic – 3 gen 2027    | v0.6.0   | Supabase, sync offline-first, backup cloud                                                         |
| M6 Sicurezza e rilascio    | 4–10 gen 2027          | v1.0.0   | Ottimizzazione, revisione sicurezza, bozze legali, installer, Store e GitHub Releases              |

Le festività possono spostare il rilascio di una o due settimane, sempre entro i due mesi.

## Decisioni principali

Vedi gli ADR in [docs/adr/](adr/): stack (Tauri 2 + React + TypeScript), backend (Supabase Free a Francoforte, offline-first), sincronizzazione (ultima modifica vince, campo per campo, con orologio logico ibrido), promemoria (app nella tray come livello principale, notifiche programmate solo con il pacchetto MSIX).
