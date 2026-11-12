# ADR-0003: Sincronizzazione "vince l'ultima modifica" per campo, con orologio logico ibrido

**Stato:** Accettato (implementazione in M5) · **Data:** 2026-11-12 · **Decisori:** proprietario del progetto (Gatto)

## Contesto

Gli eventi si modificano offline su più dispositivi e devono convergere sempre allo stesso risultato (risoluzione deterministica), consumando poco traffico e batteria nei limiti del piano Free di Supabase.

## Decisione

- Ogni riga ha `updated_hlc` (Hybrid Logical Clock: ora del dispositivo + contatore + id del dispositivo), `deleted` (lapide) e `device_id`.
- In caso di conflitto **vince la modifica con l'HLC più alto, campo per campo** (Last-Writer-Wins).
- La **RRULE è un valore atomico**: due regole di ricorrenza non si fondono. Le eccezioni (singola occorrenza spostata o cancellata) sono righe separate in `event_exceptions`.
- Client: coda "outbox" locale delle modifiche. Server: funzione RPC `push_changes` che applica il merge; download con `WHERE hlc > ultimo_visto`.

## Opzioni considerate

| Opzione                              | Esito                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| **LWW per campo + HLC fatto a mano** | Scelta: semplice, prevedibile, poche parti mobili                                     |
| CRDT (Yjs, Automerge, Loro)          | Ottimi per testo collaborativo (adatti a NekoNotes), eccessivi per eventi strutturati |
| PowerSync / ElectricSQL / cr-sqlite  | Robusti ma aggiungono servizi o estensioni; PowerSync Free limitato a 50 client       |

## Conseguenze

- Due modifiche quasi contemporanee allo stesso campo: ne resta una (l'ultima), e la cronologia modifiche dei calendari condivisi (post 1.0) aiuta a ricostruire.
- Gli orologi sbagliati dei dispositivi sono assorbiti dall'HLC (la parte logica avanza sempre).
- Da rivedere se arrivano campi di testo lungo modificati in collaborazione (descrizioni condivise): lì un CRDT di testo potrebbe servire.
