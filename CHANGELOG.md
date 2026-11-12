# Changelog

Tutte le modifiche importanti a NekoCalendar sono elencate qui.
Formato: [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) · Versioni: [Semantic Versioning](https://semver.org/lang/it/).

## [Unreleased]

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
