# ADR-0004: Promemoria affidabili — app nella tray come livello principale, notifiche programmate solo con identità di pacchetto

**Stato:** Accettato (implementazione in M2) · **Data:** 2026-11-12 · **Decisori:** proprietario del progetto (Gatto), con proposta dell'agente AI

## Contesto

Un promemoria mancato è un bug bloccante. Il piano prevedeva due livelli: (1) NekoCalendar residente nella tray e (2) notifiche programmate di Windows (`ScheduledToastNotification`), che Windows dovrebbe mostrare anche ad app chiusa.

Il prototipo M0, provato sul PC di riferimento (Windows 11, build 26300), ha dato questi risultati:

| Prova                                                                 | Risultato   |
| --------------------------------------------------------------------- | ----------- |
| PowerShell: notifica immediata e programmata a 20 s                   | compaiono   |
| PowerShell: notifica programmata a 30 s, PowerShell chiuso subito     | compare     |
| NekoCalendar (sviluppo, identità di PowerShell) con l'app aperta      | compare     |
| NekoCalendar (sviluppo, identità di PowerShell) dopo "Esci del tutto" | non compare |
| NekoCalendar installata (installer NSIS) dopo "Esci del tutto"        | non compare |

Quindi il meccanismo di Windows funziona e il codice anche, ma **le notifiche programmate da NekoCalendar non sopravvivono alla chiusura dell'app** quando questa è installata con l'installer classico. L'ipotesi più probabile: per le app senza identità di pacchetto Windows lega le notifiche al processo che le crea, a meno che l'app non registri un "attivatore" COM nel collegamento del menu Start. Le fonti pubbliche sono in disaccordo (vedi Windows App SDK, issue #6821).

## Decisione

1. **Livello 1, principale per tutte le versioni**: NekoCalendar resta attiva nella tray, con avvio automatico insieme a Windows attivo di default. Programma i promemoria con un timer interno, li mostra con le notifiche di Windows e, all'avvio e al risveglio del PC, recupera quelli scaduti nel frattempo.
2. **Livello 2, rete di sicurezza solo dove funziona**: notifiche programmate di Windows per i 7 giorni successivi, attive solo quando l'app ha un'identità di pacchetto (MSIX, la versione del Microsoft Store). Si verifica in M2 con un pacchetto MSIX di prova; se funziona, la versione Store ha i due livelli.
3. Nella versione GitHub (installer classico) l'app lo dice chiaramente all'utente: per ricevere i promemoria NekoCalendar deve restare nella tray (non va chiusa con "Esci").

## Opzioni considerate

| Opzione                                                            | Pro                                                      | Contro                                                                              | Esito                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------ |
| App nella tray + MSIX per il livello 2                             | Semplice; lo Store è già il canale principale e gratuito | Nella versione GitHub serve l'app attiva nella tray                                 | **Scelta**                                 |
| Attivatore COM registrato nel collegamento (`ToastActivatorCLSID`) | Potrebbe funzionare anche con l'installer classico       | Codice COM in Rust delicato e poco documentato; esito incerto                       | Rimandata (da riprovare se MSIX non basta) |
| Windows App SDK `AppNotificationManager`                           | Gestisce da solo la registrazione                        | Non ha ancora un'API per le notifiche programmate (issue #5050); runtime aggiuntivo | Scartata per ora                           |
| Utilità di pianificazione di Windows                               | Funziona ad app chiusa                                   | Fragile, crea attività visibili all'utente, nessuna azione nella notifica           | Scartata                                   |

## Conseguenze

- Più facile: il livello 1 non dipende da comportamenti incerti di Windows ed è testabile.
- Più difficile: la versione GitHub richiede che l'app resti nella tray; bisogna spiegarlo bene nel primo avvio.
- Da rivalutare: in M2, dopo la prova con il pacchetto MSIX.

## Azioni

1. [ ] M2: app nella tray, avvio con Windows, timer interno dei promemoria, recupero al risveglio
2. [ ] M2: pacchetto MSIX di prova e ripetizione della prova "notifica ad app chiusa"
3. [ ] M2: messaggio chiaro nel primo avvio e nelle impostazioni dei promemoria
