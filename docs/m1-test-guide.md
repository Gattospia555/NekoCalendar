# M1 — come provare il calendario

Circa 15 minuti. Serve il PC con gli strumenti già installati per la M0.

## 0. Preparazione

Dalla cartella del progetto:

```powershell
git fetch --prune
git checkout feature/m1-data-calendar
git pull
npm install
npm run tauri dev
```

La prima volta Rust compila il nuovo database e ci mette qualche minuto. Al primo avvio NekoCalendar crea i calendari **Personale**, **Lavoro** e **Compleanni**: il calendario è vuoto, ed è giusto così.

## 1. Eventi

1. Premi **Nuovo evento** (o il tasto **N**), scrivi "Cena con Marco", metti domani alle 20:00–22:00 e un luogo. **Salva**.
2. Riapri l'evento con un clic, cambia l'orario e salva: deve spostarsi.
3. Crea "Palestra" lunedì alle 18:30 con **Ripetizione → Ogni settimana**: deve comparire ogni lunedì.
4. Apri una delle palestre, scegli **Solo questa volta**, sposta l'orario e salva: cambia solo quella.
5. Aprine un'altra, **Solo questa volta → Elimina → conferma**: sparisce solo quella.
6. Chiudi l'app e riaprila: tutto deve essere ancora lì (è salvato nel database sul PC).

## 2. Compleanni, attività, festività

1. **Nuovo evento → Tipo: Compleanno**, metti la data di nascita vera (es. 1995): ogni anno compare con l'età.
2. **Tipo: Attività** con una scadenza: compare nel pannello **Attività**; spuntala.
3. Vai a dicembre (freccia avanti): devono esserci Immacolata, Natale e Santo Stefano.

## 3. Viste e comandi

- Prova **Giorno, Settimana, Mese, Anno, Agenda** (anche con i tasti 1–5) e le frecce ← →; **T** torna a oggi.
- In **Settimana** clicca su un'ora vuota: si apre un nuovo evento a quell'ora.
- Nella barra laterale togli la spunta a un calendario: i suoi eventi spariscono. **+** crea un nuovo calendario.

## 4. Impostazioni

Apri **Impostazioni**: prova tema **Scuro**, lingua **English**, il tuo nome (compare nel saluto), la vista all'avvio.

## 5. Installer

```powershell
npm run tauri build
```

Installa `src-tauri\target\release\bundle\nsis\NekoCalendar_0.1.0_x64-setup.exe`. Nel menu Start deve comparire l'**icona nuova con il gatto**. Con l'app aperta sul mese, misura i consumi:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\measure.ps1
```

## Cosa mandare

```
Eventi (1–6): ok / problema in …
Compleanni, attività, festività: ok / …
Viste e comandi: ok / …
Impostazioni: ok / …
Installer e icona: ok / …
Misura (measure.ps1): incolla il risultato
Avvio a freddo dell'app installata: circa … secondi
```
