# Avvisi di terze parti

NekoCalendar include o usa questi componenti di terze parti. L'elenco completo delle dipendenze si ricava da `package-lock.json` e `src-tauri/Cargo.lock`; qui sono annotati quelli distribuiti con l'app e tutti gli asset.

## Font (inclusi nell'app)

| Font                                        | Autori                                           | Licenza                   | Fonte                                                                                              |
| ------------------------------------------- | ------------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------- |
| Plus Jakarta Sans (variabile, pesi 200–800) | The Plus Jakarta Sans Project Authors (Tokotype) | SIL Open Font License 1.1 | [github.com/tokotype/PlusJakartaSans](https://github.com/tokotype/PlusJakartaSans), via Fontsource |

## Librerie principali

| Componente                                | Licenza                    |
| ----------------------------------------- | -------------------------- |
| Tauri e @tauri-apps/api                   | MIT o Apache-2.0           |
| React, React DOM                          | MIT                        |
| windows (crate Rust di Microsoft)         | MIT o Apache-2.0           |
| serde, serde_json                         | MIT o Apache-2.0           |
| tauri-plugin-sql e @tauri-apps/plugin-sql | MIT o Apache-2.0           |
| sqlx (usato dal plugin SQL)               | MIT o Apache-2.0           |
| SQLite                                    | Pubblico dominio           |
| ical.js (Mozilla)                         | Mozilla Public License 2.0 |
| webview2-com                              | MIT                        |

Usate solo per lo sviluppo e i test (non distribuite): Vitest, ESLint, Prettier, TypeScript, sql.js (MIT), secretlint, husky.

## Asset

| Asset                                                                | Licenza                                | Note                                                                                                                                                          |
| -------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Icone dell'app in `src-tauri/icons/`                                 | MIT, come il progetto (© CatDevStudio) | Disegno originale; sorgente in `assets/brand/app-icon.svg`                                                                                                    |
| Icone dell'interfaccia (`src/presentation/app/components/Icons.tsx`) | MIT, come il progetto (© CatDevStudio) | Disegnate per NekoCalendar, nessun set esterno                                                                                                                |
| Icone degli eventi (`src/presentation/assets/emoji/`)                | MIT (© Microsoft Corporation)          | [Fluent Emoji](https://github.com/microsoft/fluentui-emoji), 3D ridotte a 96 px WebP e piatte SVG; testo della licenza in `LICENSE.txt` nella stessa cartella |
| Disegni di Neko (`src/presentation/assets/neko/`)                    | MIT, come il progetto (© CatDevStudio) | Disegno originale, provvisorio fino alla fase grafica                                                                                                         |
