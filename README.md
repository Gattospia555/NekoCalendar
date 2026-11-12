# NekoCalendar

Calendario per Windows con **widget desktop** personalizzabili, **countdown** e **promemoria affidabili** anche ad app chiusa. Fa parte dell'ecosistema Neko (NekoTune, HomoLIVE, NekoNotes).

> **Stato:** milestone 0 (setup e prototipo). L'app per ora contiene solo il "laboratorio" che verifica le scelte tecniche; il calendario vero arriva con la milestone 1. Piano completo in [docs/VISION.md](docs/VISION.md).

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

## Creare l'installer

```powershell
npm run tauri build
```

Gli installer (`.exe` NSIS e `.msi`) finiscono in `src-tauri\target\release\bundle\`. Per ora non sono firmati: Windows SmartScreen mostrerà l'avviso "Windows ha protetto il PC" (si procede con **Ulteriori informazioni → Esegui comunque**). La versione sul Microsoft Store sarà firmata gratuitamente da Microsoft.

## Controlli di qualità

| Comando                 | Cosa fa                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `npm run check`         | Tutti i controlli insieme (gli stessi della CI)            |
| `npm test`              | Test della logica (Vitest)                                 |
| `npm run test:coverage` | Test + copertura (minimo 70 % su `src/domain`)             |
| `npm run lint`          | Errori e cattive pratiche nel codice                       |
| `npm run format`        | Sistema la formattazione                                   |
| `npm run secrets`       | Cerca chiavi, token e password finiti per sbaglio nei file |

Prima di ogni commit gli stessi controlli partono da soli (hook pre-commit). Il core Rust si controlla con `cargo clippy` e `cargo test` nella cartella `src-tauri`.

## Struttura

```text
src/                Interfaccia (React + TypeScript)
  domain/           Logica pura e testata (countdown, date…): niente Tauri qui
  platform/         Ponte verso Tauri e Windows
  app/              Finestra principale
  widget/           Widget desktop
  theme/            Tema "Base Neko" (colori, font)
src-tauri/          Core Rust di Tauri (finestre, notifiche, sistema)
scripts/            Script di supporto (es. misura di RAM e CPU)
docs/               Visione, decisioni (ADR) e guide
```

## Documentazione

- [Visione e piano](docs/VISION.md)
- [Decisioni architetturali (ADR)](docs/adr/)
- [Prototipo M0: come fare i test](docs/m0-prototype.md)
- [Come contribuire](CONTRIBUTING.md) · [Sicurezza](SECURITY.md) · [Changelog](CHANGELOG.md)

## Licenza

[MIT](LICENSE) © CatDevStudio. Licenze di font e librerie in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
