# ADR-0008: Direzione "Latte & Fusa" per il tema base

**Stato:** Sostituito in parte da [ADR-0009](0009-stile-famiglia-neko.md) (restano tinte e icone degli eventi e curve di movimento) · **Data:** 2026-11-13 · **Decisori:** proprietario del progetto (Gatto), dopo una ricerca dell'agente AI · **Sostituisce in parte:** [ADR-0007](0007-stile-morbido-e-gattoso.md)

## Contesto

Con lo stile "morbido e gattoso" (ADR-0007) l'app era più personale, ma al proprietario sembrava ancora "un po' bruttina": tanti dettagli sparsi, terracotta ovunque, ombre e bordi su ogni cosa. Ha chiesto una ricerca su come far sembrare l'app più "wow".

La ricerca ha confrontato calendari e app curate (Fantastical, Cron/Notion Calendar, Amie, TimeTree, Things, Bear, Finch, Duolingo) e le linee guida di Material 3, Apple e Fluent. Conclusione: le app che sembrano "premium" sono **calme**. La personalità sta in pochi punti scelti bene, non sparsa ovunque. Il colore vero sta nei contenuti (gli eventi), non nella cornice.

## Decisione

Il tema base segue la direzione **"Latte & Fusa"**: minimalismo caldo, con il gatto in un solo punto.

- **Profondità dalle superfici, non da bordi e ombre.** Tre livelli: fondo dell'app, superficie tenue (barra laterale), superficie chiara (schede). A riposo niente ombre; un'ombra quasi invisibile solo al passaggio del mouse, una più marcata solo per finestre e menu. Al buio, al posto delle ombre, un filo di luce sul bordo superiore.
- **Terracotta solo per le azioni** (pulsante "Nuovo evento", "Salva", focus, giorno di oggi, ora corrente). Per i testi piccoli c'è una versione più scura, `--neko-accent-text`, con contrasto ≥ 4,5:1. Il selettore delle viste diventa una linguetta chiara su un binario: non è un'azione.
- **Otto tinte per gli eventi**: salvia, cielo, mirtillo, lavanda, rosa, miele, menta, ardesia. Ognuna ha tinta di sfondo, striscia e testo, per il tema chiaro e per quello scuro (`--ev-<nome>-tint|stripe|ink`); ogni coppia testo/sfondo supera 6:1. Nel database resta salvato il colore della striscia. I colori delle versioni precedenti vengono ricondotti alla tinta più vicina (`eventPalette.ts`), quindi nessuna migrazione.
- **Icone a colori per gli eventi**: [Fluent Emoji](https://github.com/microsoft/fluentui-emoji) di Microsoft (licenza MIT). L'icona viene scelta dal titolo e dal tipo (`suggestIcon` nel dominio: "Cena con Marco" → piatto, "Dentista" → dente, compleanno → torta). Versione 3D (WebP 96 px) nelle copertine, versione piatta (SVG) nelle etichette piccole. Sono 49 icone, circa 220 KB in tutto.
- **Mese a griglia** con linee sottilissime dentro la scheda, al posto delle tessere a cuscinetto. Etichette con raggio 6 px, tinta dell'evento, icona e ora in grassetto.
- **Forme**: quattro raggi soltanto (6, 10, 16 px e pillola).
- **Gatto in un punto solo**: le orecchie sul numero di oggi. Tolte orecchie sulle schede, zampette nelle etichette, impronte sullo sfondo e accanto al saluto. Restano il logo e le zampette del festeggiamento.
- **Movimento** con le curve di Material 3 (si entra decisi e si rallenta, si esce in fretta), durate tra 150 e 450 ms:
  - cambio periodo: la pagina nuova arriva di 32 px dal lato giusto e sfuma;
  - festeggiamento ridotto (8 zampette piccole, 0,65 s) e solo per un'attività completata; un evento nuovo ha solo il suo piccolo "pop";
  - le molle restano per piccoli elementi (l'indicatore delle viste, i pulsanti premuti).
- **Ora corrente** con un'etichetta leggibile (es. "16:57") nella colonna delle ore.
- **Countdown e barra del prossimo evento** nei colori del prossimo evento.

Font invariati: Nunito per i testi, Fraunces "soft" per i titoli (da 24 px in su).

## Opzioni considerate

La ricerca ha proposto tre direzioni.

| Opzione                                                                        | Esito                                                                       |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **A · Latte & Fusa**: minimalismo caldo, eventi colorati, gatto solo su "oggi" | Scelta: è la più vicina alle app di riferimento e la più economica          |
| B · Sticker Book: eventi come adesivi, più illustrazioni                       | Rimandata: richiede asset originali, adatta alla fase grafica               |
| C · Neko Ufficio: interfaccia molto densa e professionale, gatto quasi assente | Scartata: perde la personalità chiesta dal proprietario                     |
| Tenere ADR-0007 com'è                                                          | Scartata: il proprietario lo trovava "bruttino"                             |
| Icone disegnate a mano per ogni tipo di evento                                 | Rimandata alla fase grafica: troppo lavoro ora, Fluent Emoji è libero       |
| Altri set di emoji (Noto Emoji di Google, Twemoji, OpenMoji)                   | Scartati: Fluent 3D è il più morbido e "cozy" e ha anche la versione piatta |

## Conseguenze

- L'app è più tranquilla e il colore degli eventi si legge subito, in chiaro e in scuro.
- **Peso**: +220 KB di icone nell'installer. Restano file separati (impostazione `assetsInlineLimit` in `vite.config.ts`) e si caricano solo quando sono visibili: il JavaScript dell'app cresce di appena 12 KB (408 KB, 126 KB compressi), quindi l'avvio non rallenta.
- **Colori esistenti**: un evento con un colore vecchio o personalizzato prende la tinta della palette più vicina. Nell'editor si scelgono le otto tinte, con il loro nome (letto anche dagli screen reader).
- **Icone**: oggi sono scelte in automatico. La scelta manuale dell'icona per singolo evento richiede un campo nel database: si valuterà più avanti, con una nuova migrazione.
- **Style Pack**: tinte, raggi e icone sono token e file separati, quindi in M4 potranno arrivare da uno Style Pack senza cambiare il codice.
