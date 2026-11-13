# ADR-0007: Stile "morbido e gattoso" per il tema base

**Stato:** Accettato · **Data:** 2026-11-13 · **Decisori:** proprietario del progetto (Gatto), con proposte dell'agente AI

## Contesto

Il tema base seguiva il mockup approvato della famiglia NekoTune: crema, terracotta, Fraunces e Poppins. Provando la M1, il proprietario lo ha trovato corretto ma poco personale. Ha chiesto un design "più nostro e unico, più soft, carino e cozy". Il tema base è un requisito Must: va migliorato adesso. La mascotte e gli Style Pack illustrati restano invece nella fase grafica, dopo la 1.0.

## Decisione

Il tema base diventa **morbido** (direzione A), con piccoli **dettagli da gatto** (direzione C).

- **Colori**: gli stessi toni di NekoTune, più tenui e caldi, in chiaro e in scuro. Il terracotta resta il colore d'azione, con contrasto ≥ 4,5:1 sul bianco.
- **Forme**: angoli più tondi (14 / 22 / 30 px), mese "a cuscinetti" (ogni giorno è una tessera, senza righe della griglia), etichette a pillola, pulsanti con una leggera sfumatura.
- **Ombre**: calde e sfumate, del colore del tema invece del grigio.
- **Font**:
  - **Nunito** (tondo, OFL) al posto di Poppins per i testi;
  - **Fraunces** con l'asse variabile "SOFT" al massimo per i titoli.
- **Testi**: niente etichette tutte maiuscole ("Prossimo evento", non "PROSSIMO EVENTO").
- **Dettagli da gatto**, tutti disegnati in CSS e SVG nel progetto, senza immagini esterne:
  - orecchie sul giorno di oggi;
  - orecchie che spuntano sopra le schede del pannello;
  - zampette al posto dei pallini colorati;
  - impronte leggerissime sullo sfondo;
  - un'impronta accanto al saluto.

I valori stanno nei token (`tokens.css`). Il resto sta in `app.css`, sezione "Dettagli da gatto".

## Opzioni considerate

Le tre direzioni sono state applicate all'app vera e mostrate al proprietario in foto.

| Opzione                                                                                 | Esito                                                                             |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **A · Morbido**: forme tonde, colori pastello, Nunito, ombre calde                      | Scelta, come base                                                                 |
| **C · Gattoso**: A più dettagli da gatto                                                | Scelta, insieme ad A                                                              |
| B · Quaderno: grana della carta, evidenziatore, nastro adesivo, giorno cerchiato a mano | Scartata dal proprietario                                                         |
| Lasciare lo stile del mockup                                                            | Scartata: corretto ma poco personale                                              |
| Pagine che girano in 3D (provate prima)                                                 | Scartate dal proprietario: troppo vistose; sostituite da uno scorrimento laterale |

## Conseguenze

- NekoCalendar ha un aspetto suo, pur restando nella famiglia di colori di NekoTune.
- **Dimensione dei font**: Fraunces "soft" pesa 62 KB invece di 37 KB, Nunito 39 KB. Poppins, che usava quattro file, non c'è più.
- **Spazio**: il mese a cuscinetti occupa un po' più spazio. Le righe hanno un'altezza minima e il numero di eventi per casella si adatta da solo.
- **Futuro**: i dettagli da gatto sono statici e non sono la mascotte. La mascotte animata (stati, sprite) resta pianificata nella fase grafica, con il formato Style Pack.
