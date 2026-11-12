# Avvisi di terze parti

NekoCalendar include o usa questi componenti di terze parti. L'elenco completo delle dipendenze si ricava da `package-lock.json` e `src-tauri/Cargo.lock`; qui sono annotati quelli distribuiti con l'app e tutti gli asset.

## Font (inclusi nell'app)

| Font                 | Autori                             | Licenza                   | Fonte                                                                                          |
| -------------------- | ---------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| Fraunces (variabile) | The Fraunces Project Authors       | SIL Open Font License 1.1 | [github.com/undercasetype/Fraunces](https://github.com/undercasetype/Fraunces), via Fontsource |
| Poppins              | Indian Type Foundry, Jonny Pinhorn | SIL Open Font License 1.1 | Google Fonts, via Fontsource                                                                   |

## Librerie principali

| Componente                        | Licenza          |
| --------------------------------- | ---------------- |
| Tauri e @tauri-apps/api           | MIT o Apache-2.0 |
| React, React DOM                  | MIT              |
| windows (crate Rust di Microsoft) | MIT o Apache-2.0 |
| serde, serde_json                 | MIT o Apache-2.0 |

## Asset

| Asset                                | Licenza                                       | Note                                                              |
| ------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------- |
| Icone dell'app in `src-tauri/icons/` | MIT o Apache-2.0 (icone predefinite di Tauri) | Segnaposto: verranno sostituite dall'icona NekoCalendar originale |
