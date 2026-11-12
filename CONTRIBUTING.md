# Come contribuire a NekoCalendar

Grazie per l'interesse! Le regole complete sono in [AGENTS.md](AGENTS.md); qui l'essenziale.

## Preparazione

Segui la sezione "Cosa serve" del [README](README.md), poi `npm install`. Gli hook pre-commit si attivano da soli.

## Flusso di lavoro

1. Crea un branch da `main`: `feature/nome-breve` per le novità, `fix/nome-breve` per le correzioni.
2. Fai commit piccoli con messaggi [Conventional Commits](https://www.conventionalcommits.org/): `feat(widget): add agenda widget`, `fix(reminders): handle DST change`.
3. Prima di aprire la pull request esegui `npm run check` e, se hai toccato Rust, `cargo clippy --all-targets -- -D warnings` e `cargo test` in `src-tauri`.
4. Apri la pull request verso `main` compilando il modello: cosa cambia, perché, come provarlo.

## Regole importanti

- Mai committare segreti, chiavi API, token, file `.env`, database locali o immagini senza licenza.
- La logica del calendario va in `src/domain` con i suoi test; niente Tauri né React lì dentro. I casi d'uso stanno in `src/application`, per parlare con Tauri si usa `src/infrastructure/tauri` e i componenti stanno in `src/presentation` (regola dei livelli in [ADR-0005](docs/adr/0005-architettura-a-livelli.md)).
- Testi semplici, interfaccia accessibile (tastiera, contrasto, "riduci animazioni").
- Asset e font solo originali o con licenza che consente l'uso commerciale, annotati in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
