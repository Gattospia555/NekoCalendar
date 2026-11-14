# ADR-0009: Stile della famiglia Neko e nuova struttura della finestra

**Stato:** Accettato · **Data:** 2026-11-13 · **Decisori:** proprietario del progetto (Gatto), con proposte dell'agente AI · **Sostituisce in parte:** [ADR-0008](0008-direzione-latte-e-fusa.md) (restano le tinte e le icone degli eventi e le curve di movimento)

## Contesto

La direzione "Latte & Fusa" (ADR-0008) era più curata, ma al proprietario sembrava ancora un'app generica, "che non verrebbe usata da altre persone". Abbiamo provato quattro bozzetti molto diversi: giornata a timeline, Neko compagno, Pop vivace, Vetro & sfondo. Gli sono piaciuti la timeline, Neko e il vetro.

Li abbiamo uniti nel concetto "Il cielo di Neko". Guardando la schermata principale di NekoTune, però, il proprietario ha notato che ci stavamo allontanando dallo stile della famiglia. Ha chiarito che non vuole una copia dell'interfaccia di NekoTune: vuole **lo stesso stile, con una struttura propria**. Il font di NekoTune è Plus Jakarta Sans (500, 700, 800), con Inter e `system-ui` di riserva.

## Decisione

1. **Stile di famiglia**, descritto in [docs/style-neko.md](../style-neko.md):
   - sfondo a "cielo" crema-lilla che segue l'ora (notte con il tema scuro);
   - pannelli chiari, molto tondi e appena ombreggiati;
   - Plus Jakarta Sans;
   - accento pesca (una versione profonda per pulsanti e testi, il pesca chiaro solo per decorare);
   - pulsanti icona tondi;
   - etichette di sezione maiuscole;
   - copertine con l'etichetta sfocata.
2. **Struttura di NekoCalendar** in tre colonne:
   - **sinistra, il calendario:** marchio, "Nuovo evento", mini calendario del mese, calendari;
   - **centro, la vista corrente:** la **vista Giorno diventa una linea del tempo** con la striscia della settimana, le cose passate sbiadite, la linea di "adesso" e il prossimo impegno in evidenza. Settimana, Mese, Anno e Agenda restano;
   - **destra, Neko:** il gatto seduto sul pannello parla dei prossimi impegni e sotto ha il countdown del prossimo evento, poi "Attività" e "In arrivo". La barra in basso del prossimo evento sparisce: il countdown vive con Neko.
3. **Neko**:
   - le frasi sono logica pura nel dominio (`domain/neko.ts`, testata): impegno in corso, tra poco, più tardi, attività da fare, domani, giornata libera, sonno di notte;
   - il disegno è originale e provvisorio (SVG nel progetto), sveglio o assonnato;
   - la mascotte animata resta nella fase grafica, come previsto dal piano.
4. Finestre strette: sotto i 1440 px le colonne laterali si stringono; sotto i 1180 px Neko e le attività scendono sotto la vista e la pagina scorre.

## Opzioni considerate

| Opzione                                                         | Esito                                                                       |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Copiare la disposizione di NekoTune (player in basso, ricerca)  | Scartata dal proprietario: vuole coerenza di stile, non una copia           |
| "Il cielo di Neko" con paesaggio illustrato e pannelli di vetro | Rimandata: bella ma lontana da NekoTune; il cielo resta come sfumatura      |
| Pop vivace (colori saturi, blocchi)                             | Scartata: rischia di sembrare un'app per bambini                            |
| Mantenere ADR-0008 così com'è                                   | Scartata: troppo generica secondo il proprietario                           |
| Tenere anche la vista Giorno a griglia oraria                   | Scartata: la timeline è più leggibile; la griglia oraria resta in Settimana |
| Testo bianco sul pesca chiaro di NekoTune                       | Scartata: contrasto 2,4:1, sotto il minimo di 4,5:1 richiesto dal progetto  |

## Conseguenze

- NekoCalendar e NekoTune si riconoscono come app della stessa famiglia; NekoNotes potrà seguire la stessa guida.
- **Font:** Plus Jakarta Sans (27 KB per l'alfabeto latino, 22 KB per le lettere accentate in più) sostituisce Fraunces e Nunito: un solo font invece di due.
- **Accessibilità:** il pesca di pulsanti e testi è un po' più scuro di quello di NekoTune. È una differenza voluta: conviene portarla anche in NekoTune.
- **Neko anticipato in forma semplice:** un disegno fermo con due espressioni e frasi testuali. Nessuna animazione continua, nessun consumo a riposo.
- **Prove:** le prove automatiche dell'interfaccia controllano anche Neko, il mini calendario e la striscia della settimana.
