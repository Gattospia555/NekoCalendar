# ADR-0002: Offline-first con SQLite locale e Supabase Free come backend

**Stato:** Accettato · **Data:** 2026-11-12 · **Decisori:** proprietario del progetto (Gatto)

## Contesto

Budget zero, dati in UE (GDPR), account unico per l'ecosistema Neko, sync tra dispositivi entro 3 secondi, client a basso consumo (niente polling). Il proprietario preferisce Supabase, da confermare dopo la verifica dei limiti gratuiti.

## Decisione

- **SQLite sul PC è la fonte di verità**: l'app funziona sempre, anche senza internet e senza account.
- **Supabase Free**, regione **Central EU (Frankfurt)** scelta per nome, solo per login, sync e backup cloud (milestone M5, Should).
- **Un solo progetto Supabase** condiviso da tutte le app Neko (schemi separati, Row Level Security su ogni tabella): lo stesso login vale ovunque e si usa uno solo dei due progetti gratuiti.
- Realtime usato solo come "campanello" che avvisa di scaricare le modifiche: una connessione per app aperta.

## Limiti verificati (12/11/2026, pagina prezzi e documentazione Supabase)

| Limite Free   | Valore                                                                     | Come lo rispettiamo                          |
| ------------- | -------------------------------------------------------------------------- | -------------------------------------------- |
| Costo         | 0 $, nessuna carta, mai addebiti (oltre i limiti: avvisi, poi restrizioni) | controllo periodico dell'uso                 |
| Database      | 500 MB                                                                     | solo testo; allegati sul PC nella 1.0        |
| Storage       | 1 GB                                                                       | backup cloud compresso e limitato            |
| Egress        | 5 GB + 5 GB in cache al mese                                               | sync a delta                                 |
| Utenti attivi | 50.000 al mese                                                             | ampio margine                                |
| Realtime      | 200 connessioni insieme, 2 milioni di messaggi al mese                     | una connessione per app, solo campanello     |
| Pausa         | dopo 7 giorni di inattività                                                | uso reale; in sviluppo riattivazione manuale |
| Backup        | nessuno automatico                                                         | backup locale giornaliero + export ICS/JSON  |

## Opzioni considerate

| Opzione                 | Esito                                                     |
| ----------------------- | --------------------------------------------------------- |
| **Supabase Free**       | Scelta: auth, Postgres, realtime e regione UE senza carta |
| Cloudflare Workers + D1 | Piano B senza carta; login da costruire                   |
| Appwrite Cloud Free     | Limiti ridotti più volte nel 2026: instabile              |
| Firebase Spark          | Non SQL, lock-in                                          |
| PowerSync Free          | Solo 50 client contemporanei                              |
| Oracle Cloud, Fly.io    | Scartate: richiedono carta di credito                     |
| InstantDB               | Scartata: servizio in chiusura                            |

## Conseguenze

- L'app resta pienamente usabile se Supabase cambia limiti o va in pausa.
- Il server OAuth 2.1 di Supabase ("Accedi con Neko" per terze parti) è in beta pubblica: fuori dal percorso critico della 1.0.
- Da ricontrollare: i limiti del piano gratuito a ogni release.
