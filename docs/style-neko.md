# Stile della famiglia Neko

Questa guida tiene coerenti le app dell'ecosistema Neko: **NekoTune**, **NekoCalendar** e, più avanti, **NekoNotes**. L'idea è che si riconoscano come sorelle, ma ognuna abbia la struttura giusta per il suo lavoro.

> **Coerenti, non copie.** Si condividono colori, font, forme, il gatto e il tono. Non si copia la disposizione: NekoTune ha la barra del player e la ricerca al centro perché è un lettore musicale; NekoCalendar ha il mini calendario, la giornata e Neko perché è un calendario.

I valori di NekoCalendar stanno in `src/presentation/theme/tokens.css`. La scelta è registrata in [ADR-0009](adr/0009-stile-famiglia-neko.md).

## 1. Il cielo (sfondo)

- Lo sfondo non è un colore piatto: è una **sfumatura dal crema al lilla**, con una macchia pesca in basso a sinistra e una lilla in basso a destra, come in NekoTune.
- In NekoCalendar il cielo **segue l'ora**: mattina più chiara e pesca, pomeriggio crema-lilla, sera più rosata. Con il tema scuro è sempre notte (viola e prugna, mai nero).
- Il cielo cambia al massimo quattro volte al giorno, senza animazioni: a riposo non consuma nulla.

| Momento    | Ore   | Token             |
| ---------- | ----- | ----------------- |
| Mattina    | 5–12  | `--sky-morning`   |
| Pomeriggio | 12–18 | `--sky-afternoon` |
| Sera       | 18–22 | `--sky-evening`   |
| Notte      | 22–5  | `--sky-night`     |

## 2. Colori

| Ruolo                     | Chiaro                    | Scuro                  | Uso                                                   |
| ------------------------- | ------------------------- | ---------------------- | ----------------------------------------------------- |
| Pannelli                  | `rgb(255 253 251 / 0.86)` | `rgb(42 36 39 / 0.88)` | le grandi schede che galleggiano sul cielo            |
| Superficie piena          | `#fffdfb`                 | `#2a2427`              | pulsanti, finestre, schede in evidenza                |
| Pozzetto                  | `#f6f0eb`                 | `#342d31`              | binario del selettore, giorni della settimana         |
| Testo                     | `#2e2724`                 | `#f3ebe2`              | testo principale                                      |
| Testo secondario          | `#6f645e`                 | `#c9b9ad`              | orari, luoghi, etichette                              |
| Accento (azioni)          | `#b0603a`, testo bianco   | `#e9a17a`, testo scuro | "Nuovo evento", "Salva", giorno di oggi, ora corrente |
| Accento per testi         | `#a4552f`                 | `#eeaa85`              | nome dell'app, vista scelta, "Oggi"                   |
| Pesca chiaro (decorativo) | `#dc9a72`                 | `#c98a63`              | anelli, pallini, focus: **mai sotto un testo**        |

**Perché due pesca.** Il pesca chiaro di NekoTune (`#dc9a72`) con il testo bianco ha un contrasto di 2,4:1, troppo poco per leggere bene. Per i pulsanti e i testi si usa una versione più profonda (4,6:1 e 5,3:1), il pesca chiaro resta per le decorazioni. Così l'atmosfera è la stessa e tutti leggono bene.

**Gli eventi** hanno otto tinte (salvia, cielo, mirtillo, lavanda, rosa, miele, menta, ardesia), ognuna con sfondo, striscia e testo per chiaro e scuro. Il pesca non è tra queste: un evento non deve sembrare un pulsante. Dettagli in [ADR-0008](adr/0008-direzione-latte-e-fusa.md).

## 3. Font

- **Plus Jakarta Sans**, lo stesso di NekoTune, con riserva **Inter** e poi `system-ui`.
- Pesi: **500** per i testi, **700** per l'enfasi (titoli degli eventi, pulsanti), **800** per i titoli grandi.
- Il font è incluso nell'app (licenza SIL OFL): funziona anche senza internet.
- Titoli grandi con lettere un po' più strette (`letter-spacing: -0.02em`).
- **Etichette di sezione** piccole, in maiuscolo e spaziate, come "LE TUE PLAYLIST" in NekoTune: in NekoCalendar "I TUOI CALENDARI", "ATTIVITÀ", "IN ARRIVO". Solo per le etichette, mai per i testi.

## 4. Forme

| Elemento                      | Raggio                        |
| ----------------------------- | ----------------------------- |
| Etichette degli eventi, campi | 8 px                          |
| Pulsantini, righe             | 12 px                         |
| Schede piccole, copertine     | 18 px                         |
| Pannelli                      | 24 px                         |
| Pulsanti, selettori           | pillola                       |
| Pulsanti icona                | cerchio, con un filo di bordo |

- **Ombre** morbide e calde (marrone, mai grigio), solo sotto i pannelli e gli elementi in evidenza.
- **Copertine** arrotondate con un'etichetta scura e sfocata sopra (titolo e sottotitolo in bianco), come gli album di NekoTune. In NekoCalendar sono gli eventi "In arrivo".
- **Icone degli eventi**: Fluent Emoji 3D nelle copertine, piatte nelle etichette piccole.

## 5. Il gatto

Il gatto è il segno di famiglia, ma va usato con misura: in pochi punti scelti.

- **NekoTune**: il gatto nel fumetto in basso ("Sto ascoltando…"), la testa sulla barra di avanzamento, le orecchie sulla copertina in riproduzione.
- **NekoCalendar**: **Neko** seduto sul suo pannello, che parla dei prossimi impegni (sveglio di giorno, assonnato di notte); le **orecchie sul giorno di oggi** (mese, mini calendario, settimana); le zampette quando si completa un'attività.
- Il disegno di Neko è originale e provvisorio: la mascotte animata, con più stati, arriva nella fase grafica dopo la 1.0.

## 6. Tono

- Frasi brevi, semplici, gentili, con un pizzico di gatto ("miao", "pisolino"), mai infantili e mai invadenti.
- Il gatto non interrompe: parla nel suo pannello, non con finestre o notifiche.

## 7. Accessibilità

- Contrasto del testo ≥ 4,5:1 (controllato per tutte le coppie di colori qui sopra).
- Aree cliccabili ≥ 44 px, focus visibile (anello pesca), tutto usabile da tastiera.
- Con "Riduci animazioni" di Windows le animazioni si spengono.

## 8. Checklist per una nuova app Neko

1. Sfondo a cielo crema-lilla (o notte al buio), pannelli chiari e tondi sopra.
2. Plus Jakarta Sans 500/700/800.
3. Accento pesca profondo per le azioni, pesca chiaro solo per decorare.
4. Pulsanti icona tondi con un filo di bordo, pulsanti a pillola.
5. Etichette di sezione maiuscole e piccole.
6. Il gatto in due o tre punti significativi, non dappertutto.
7. Una struttura pensata per quello che fa l'app, non copiata da un'altra.
