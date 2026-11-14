# Changelog

Tutte le modifiche importanti a NekoCalendar sono elencate qui.
Formato: [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) · Versioni: [Semantic Versioning](https://semver.org/lang/it/).

## [Unreleased]

Milestone M1: dati e calendario.

### Added

- Database locale SQLite con migrazioni numerate (calendari, eventi, eccezioni, impostazioni), vincoli e campi per la sincronizzazione futura.
- Calendario completo: viste giorno (come linea del tempo), settimana, mese, anno e agenda; colonna con "Nuovo evento", mini calendario e calendari mostrabili o nascondibili; pannello di Neko con countdown del prossimo evento, attività e eventi in arrivo.
- Eventi con titolo, luogo, note, colore, tutto il giorno, promemoria multipli (le notifiche arrivano in M2) e ripetizioni (ogni giorno, settimana con giorni scelti, mese, anno; fine dopo N volte o in una data).
- Modifica o eliminazione di una sola ripetizione oppure di tutta la serie.
- Compleanni e anniversari con età, attività con scadenza da spuntare, festività nazionali italiane (incluso il 4 ottobre dal 2026).
- Fusi orari e ora legale gestiti: gli eventi ripetuti restano alla stessa ora sull'orologio.
- Italiano e inglese; tema chiaro, scuro o come Windows; nome per il saluto; vista all'avvio.
- Scorciatoie da tastiera (N, T, frecce, 1–5) e finestre di dialogo accessibili.
- Icona dell'app originale (il gatto del mockup) in tutte le dimensioni.
- Anteprima nel browser con dati di esempio (`npm run dev`).
- Documentazione: architettura, modello dei dati, ADR-0006 (database locale), guida ai test della M1.
- Animazioni con lo stesso linguaggio di NekoTune: le viste entrano salendo appena, righe e copertine una dopo l'altra con una molla leggera, schede che si sollevano al passaggio del mouse, pulsanti che si schiacciano al clic, finestre che si aprono con un "pop", "pop" sull'evento appena salvato e sulle attività completate. Nessuna animazione infinita; si spengono con "Riduci animazioni" di Windows.
- Icone a colori per gli eventi (Fluent Emoji di Microsoft, MIT), scelte in automatico dal titolo e dal tipo: torta per i compleanni, aereo per i viaggi, piatto per le cene…
- Ora corrente leggibile accanto alla linea rossa nelle viste Giorno e Settimana.
- Nomi dei colori nell'editor (Salvia, Cielo, Mirtillo…), letti anche dagli screen reader.
- Vista Giorno come linea del tempo: striscia della settimana con i pallini degli impegni, icone grandi, cose passate sbiadite, linea di "adesso" con l'ora e il prossimo impegno in evidenza.
- Neko, il gatto di NekoCalendar: seduto sul suo pannello, parla dei prossimi impegni (sveglio di giorno, assonnato di notte), con il countdown del prossimo evento.
- Mini calendario del mese nella colonna sinistra, "In arrivo" con le copertine dei prossimi eventi.
- Guida di stile della famiglia Neko ([docs/style-neko.md](docs/style-neko.md)).

### Changed

- Frontend riorganizzato a livelli (`domain`, `application`, `infrastructure`, `presentation`) con import tramite alias `@/`; ESLint impedisce le dipendenze nel verso sbagliato ([ADR-0005](docs/adr/0005-architettura-a-livelli.md)).
- La finestra "Laboratorio M0" è sostituita dal calendario; il widget countdown resta nel codice ma è nascosto fino alla M3.
- TypeScript compila per ES2022.
- `.gitignore` ampliato: installer, cache degli strumenti, file temporanei e impostazioni locali degli assistenti AI.
- Disattivata l'attribuzione automatica degli assistenti AI nei commit e nelle pull request (`.claude/settings.json`).
- Tema base rifatto in tre passi su richiesta del proprietario ([ADR-0007](docs/adr/0007-stile-morbido-e-gattoso.md), [ADR-0008](docs/adr/0008-direzione-latte-e-fusa.md), [ADR-0009](docs/adr/0009-stile-famiglia-neko.md)). Dal secondo restano le otto tinte degli eventi in chiaro e in scuro, il pesca solo per le azioni e le orecchie da gatto sul giorno di oggi.
- Stile della famiglia Neko ([ADR-0009](docs/adr/0009-stile-famiglia-neko.md)), coerente con NekoTune: sfondo a "cielo" crema-lilla che segue l'ora, pannelli chiari e tondi, Plus Jakarta Sans al posto di Fraunces e Nunito, accento pesca (più profondo dove c'è testo, per il contrasto), pulsanti icona tondi, etichette di sezione maiuscole.
- Nuova struttura in tre colonne: calendario a sinistra, vista al centro, Neko a destra. La barra del prossimo evento in basso è sostituita dal countdown nel pannello di Neko; "Nuovo evento" passa nella colonna sinistra.
- Nuovi colori dei calendari predefiniti (Personale salvia, Lavoro cielo, Compleanni rosa) e delle festività (miele); i colori già salvati vengono ricondotti alla tinta più vicina.

### Fixed

- La vista Giorno mostrava una colonna larga zero e nessun evento.
- L'intestazione cambiava forma da una vista all'altra (pulsanti che si spostavano, "Nuovo evento" a capo).
- Il mese lasciava un vuoto sotto la griglia sugli schermi grandi e veniva tagliato su quelli piccoli; ora riempie la finestra e mostra quanti eventi ci stanno.
- Giorno e settimana si aprivano sull'ora corrente nascondendo gli eventi del mattino; ora partono dal primo evento.
- Etichette delle ore tagliate, "Tutto il giorno" a capo storto, eventi brevi illeggibili.

### Security

- Solo la finestra principale può usare il database; scritture solo con parametri.
- Dipendenza di sviluppo `minimatch` aggiornata (GHSA-g3hv-75wg-m249): `npm audit` senza vulnerabilità.

## [0.1.0] - 2026-11-12

Milestone M0: setup del progetto e prototipo dei rischi.

### Added

- Scheletro dell'app con Tauri 2, React e TypeScript (identificativo `com.catdevstudio.nekocalendar`).
- Tema "Base Neko" chiaro/scuro con i font Fraunces e Poppins inclusi nell'app.
- Prototipo del widget countdown trasparente: sopra o sotto le finestre, click-through, risparmio energia.
- Prototipo dei promemoria programmati di Windows che compaiono anche ad app chiusa.
- Finestra "Laboratorio M0" per provare widget, notifiche e misure.
- Script `scripts/measure.ps1` per misurare RAM e CPU rispetto agli obiettivi.
- Logica di countdown e date con test (copertura 100 %).
- Controlli di qualità: ESLint, Prettier, Vitest con soglia del 70 %, secretlint e hook pre-commit.
- CI su Windows (lint, test, clippy, build, scansione segreti con gitleaks) e Dependabot.
- Documentazione: README, AGENTS.md, visione, ADR 0001–0003, guida ai test della M0, CONTRIBUTING, SECURITY.
- Comando `set_low_memory`: il widget e la finestra principale ridotta a icona usano il livello di memoria "basso" di WebView2.
- Risultati delle misure M0 e ADR-0004 sui promemoria (app nella tray come livello principale).

### Changed

- Tutte le finestre condividono la GPU nel processo principale e un solo renderer WebView2, per ridurre la RAM.
- `.gitignore` di Visual Studio sostituito con regole per Node, Rust e Tauri che bloccano segreti e database locali.

[Unreleased]: https://github.com/Gattospia555/NekoCalendar/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/Gattospia555/NekoCalendar/releases/tag/v0.1.0
