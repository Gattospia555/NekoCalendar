# Changelog

Tutte le modifiche importanti a NekoCalendar sono elencate qui.
Formato: [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) · Versioni: [Semantic Versioning](https://semver.org/lang/it/).

## [Unreleased]

Milestone M1: dati e calendario.

### Added

- Database locale SQLite con migrazioni numerate (calendari, eventi, eccezioni, impostazioni), vincoli e campi per la sincronizzazione futura.
- Calendario completo: viste giorno, settimana, mese, anno e agenda; barra laterale con calendari mostrabili o nascondibili; pannello con saluto, prossimi eventi e attività; barra del prossimo evento.
- Eventi con titolo, luogo, note, colore, tutto il giorno, promemoria multipli (le notifiche arrivano in M2) e ripetizioni (ogni giorno, settimana con giorni scelti, mese, anno; fine dopo N volte o in una data).
- Modifica o eliminazione di una sola ripetizione oppure di tutta la serie.
- Compleanni e anniversari con età, attività con scadenza da spuntare, festività nazionali italiane (incluso il 4 ottobre dal 2026).
- Fusi orari e ora legale gestiti: gli eventi ripetuti restano alla stessa ora sull'orologio.
- Italiano e inglese; tema chiaro, scuro o come Windows; nome per il saluto; vista all'avvio.
- Scorciatoie da tastiera (N, T, frecce, 1–5) e finestre di dialogo accessibili.
- Icona dell'app originale (il gatto del mockup) in tutte le dimensioni.
- Anteprima nel browser con dati di esempio (`npm run dev`).
- Documentazione: architettura, modello dei dati, ADR-0006 (database locale), guida ai test della M1.
- Animazioni leggere che rispondono ai gesti: cambio periodo con la direzione giusta, indicatore che scivola tra le viste, "Oggi" che si accende, "pop" sull'evento appena salvato, dialoghi e attività completate animati. Si spengono con "Riduci animazioni" di Windows.
- Token di movimento del tema (durate e curve) e "+" sulla casella del mese sotto il mouse.
- Animazioni "wow": pagine che scorrono di lato, giorno del mese che si allarga nella vista Giorno, evento che si trasforma nella finestra di modifica, curve a molla, zampette che festeggiano le attività completate.
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
- Countdown nella barra del prossimo evento: anello che si riempie e tempo che manca, come nel mockup.
- Grafica più vicina al mockup approvato: caselle del mese pulite (con "1 dic" per il primo giorno di un altro mese), etichette con l'ora in grassetto nel colore dell'evento, intestazione con le frecce accanto al titolo, date brevi nei prossimi eventi.
- Tema base "morbido e gattoso" ([ADR-0007](docs/adr/0007-stile-morbido-e-gattoso.md)): colori più tenui e caldi, angoli tondi, mese a cuscinetti, etichette a pillola, ombre calde, Nunito al posto di Poppins, Fraunces "soft", niente etichette tutte maiuscole; orecchie sul giorno di oggi e sopra le schede, zampette al posto dei pallini, impronte leggere sullo sfondo.
- Tema base "Latte & Fusa" ([ADR-0008](docs/adr/0008-direzione-latte-e-fusa.md)), dopo una ricerca sulle app di riferimento: superfici a tre livelli al posto di bordi e ombre, terracotta solo per le azioni, otto tinte per gli eventi in chiaro e in scuro, mese a griglia sottile, quattro raggi, curve di movimento di Material 3, festeggiamento più piccolo e solo per le attività, countdown nei colori del prossimo evento. Il gatto resta in un solo punto: le orecchie sul giorno di oggi.
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
