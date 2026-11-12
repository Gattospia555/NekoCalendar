# NekoCalendar

Calendario per Windows con **widget desktop** personalizzabili, **countdown** e **promemoria affidabili** anche ad app chiusa. Fa parte dell'ecosistema Neko (NekoTune, HomoLIVE, NekoNotes).

> **Stato:** milestone 1 (dati e calendario). C'è il calendario vero, salvato sul PC: viste giorno, settimana, mese, anno e agenda, eventi con ripetizioni, compleanni, attività e festività italiane, in italiano e inglese, tema chiaro e scuro. Promemoria (M2) e widget (M3) arrivano con le prossime milestone. Piano completo in [docs/VISION.md](docs/VISION.md).

## Cosa serve (una volta sola)

| Strumento                       | Versione  | Come controllare        |
| ------------------------------- | --------- | ----------------------- |
| Windows                         | 10 o 11   | —                       |
| Node.js                         | 22 o più  | `node -v`               |
| Rust                            | stabile   | `rustc --version`       |
| Visual Studio Build Tools (C++) | 2022      | Visual Studio Installer |
| Git                             | qualsiasi | `git --version`         |

WebView2 è già incluso in Windows 10/11. Se `npm` dà un errore sugli script disabilitati, esegui una volta in PowerShell:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Installazione

```powershell
git clone https://github.com/Gattospia555/NekoCalendar.git
cd NekoCalendar
npm install
```

## Avvio in sviluppo

```powershell
npm run tauri dev
```

La prima volta Rust compila tutto e ci vogliono alcuni minuti; dopo è molto più veloce.

Per lavorare solo sull'interfaccia c'è anche l'**anteprima nel browser**, senza Rust e senza database: `npm run dev`, poi apri http://localhost:1420. Usa dati di esempio in memoria che spariscono ricaricando la pagina.

## Creare l'installer

```powershell
npm run tauri build
```

Gli installer (`.exe` NSIS e `.msi`) finiscono in `src-tauri\target\release\bundle\`. Per ora non sono firmati: Windows SmartScreen mostrerà l'avviso "Windows ha protetto il PC" (si procede con **Ulteriori informazioni → Esegui comunque**). La versione sul Microsoft Store sarà firmata gratuitamente da Microsoft.

## Controlli di qualità

| Comando                 | Cosa fa                                                         |
| ----------------------- | --------------------------------------------------------------- |
| `npm run check`         | Tutti i controlli insieme (gli stessi della CI)                 |
| `npm test`              | Test della logica (Vitest)                                      |
| `npm run test:coverage` | Test + copertura (minimo 70 % su dominio, casi d'uso e archivi) |
| `npm run lint`          | Errori e cattive pratiche nel codice                            |
| `npm run format`        | Sistema la formattazione                                        |
| `npm run secrets`       | Cerca chiavi, token e password finiti per sbaglio nei file      |

Prima di ogni commit gli stessi controlli partono da soli (hook pre-commit). Il core Rust si controlla con `cargo clippy` e `cargo test` nella cartella `src-tauri`.

## Struttura

```text
src/                      Interfaccia (React + TypeScript), a livelli
  main.tsx                Punto d'ingresso: sceglie se mostrare app o widget
  domain/                 1. Logica pura e testata (date e fusi, ricorrenze, festività, countdown…)
  application/            2. Casi d'uso: CalendarService e l'interfaccia CalendarStore
  infrastructure/         3. Collegamenti con l'esterno
    storage/              Archivio in memoria e conversione righe ⇄ dati
    tauri/                Unico ponte verso Tauri e Windows (database SQLite, finestre, memoria)
  presentation/           4. Tutto ciò che si vede
    app/                  Finestra principale (viste, editor, impostazioni)
    i18n/                 Testi in italiano e inglese, formati di date e ore
    widget/               Widget desktop
    theme/                Tema "Base Neko" (colori, font)
src-tauri/                Core Rust di Tauri (finestre, database, notifiche)
  migrations/             Migrazioni numerate del database
assets/brand/             Sorgente dell'icona dell'app
scripts/                  Script di supporto (es. misura di RAM e CPU)
docs/                     Visione, architettura, modello dati, decisioni (ADR) e guide
```

**Regola dei livelli:** le dipendenze vanno sempre verso il dominio
(`presentation` → `application` → `domain`; `infrastructure` → `application` → `domain`), mai al contrario. ESLint la controlla da solo:
se la violi, `npm run lint` (e quindi `npm run check`) fallisce con un messaggio che spiega perché.
Nei file si importa con `@/`, per esempio `@/domain/dates` (la `@` indica la cartella `src`).
Il perché della scelta è in [ADR-0005](docs/adr/0005-architettura-a-livelli.md).

## Documentazione

- [Visione e piano](docs/VISION.md)
- [Architettura](docs/architecture.md) · [Modello dei dati](docs/data-model.md)
- [Decisioni architetturali (ADR)](docs/adr/)
- [M1: come provare il calendario](docs/m1-test-guide.md) · [Prototipo M0: test e misure](docs/m0-prototype.md)
- [Come contribuire](CONTRIBUTING.md) · [Sicurezza](SECURITY.md) · [Changelog](CHANGELOG.md)

## Licenza

[MIT](LICENSE) © CatDevStudio. Licenze di font e librerie in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
