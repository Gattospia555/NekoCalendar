# Avvisi di terze parti

NekoCalendar include o usa questi componenti di terze parti. L'elenco completo delle dipendenze si ricava da `package-lock.json` e `src-tauri/Cargo.lock`; qui sono annotati quelli distribuiti con l'app e tutti gli asset.

## Font (inclusi nell'app)

| Font                                     | Autori                                                                          | Licenza                   | Fonte                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| Fraunces (variabile, assi peso e "SOFT") | The Fraunces Project Authors                                                    | SIL Open Font License 1.1 | [github.com/undercasetype/Fraunces](https://github.com/undercasetype/Fraunces), via Fontsource |
| Nunito (variabile)                       | The Nunito Project Authors (Vernon Adams, Jacques Le Bailly, Manvel Shmavonyan) | SIL Open Font License 1.1 | [github.com/googlefonts/nunito](https://github.com/googlefonts/nunito), via Fontsource         |

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
