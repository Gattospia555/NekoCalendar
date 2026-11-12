# Prototipo M0 — come fare i test

La milestone 0 verifica le scelte più rischiose del piano **prima** di costruire il calendario. Servono circa 20 minuti sul PC di riferimento.

## 0. Preparazione (una volta)

```powershell
git clone https://github.com/Gattospia555/NekoCalendar.git
cd NekoCalendar
git checkout feature/m0-setup
npm install
```

## 1. Avvio e widget

1. `npm run tauri dev` (la prima volta Rust compila per alcuni minuti).
2. Si aprono due finestre: il **Laboratorio M0** e il **widget countdown** trasparente in alto a sinistra.
3. Trascina il widget e prova i pulsanti **Sopra le finestre / Normale / Sotto le finestre**.
4. Premi **Prova click-through (10 s)**: per 10 secondi i clic devono passare attraverso il widget.
5. Passa il mouse sul widget e premi **Risparmio**: spariscono i secondi e gli effetti.

## 2. Misura di RAM e CPU

Le misure valide si fanno sull'**app installata** (la modalità sviluppo consuma di più):

1. `npm run tauri build`, poi installa il file `.exe` che trovi in `src-tauri\target\release\bundle\nsis\` (SmartScreen: **Ulteriori informazioni → Esegui comunque**).
2. Apri NekoCalendar dal menu Start e riduci a icona il Laboratorio, lasciando visibile solo il widget.
3. In PowerShell, dalla cartella del progetto:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\measure.ps1
   ```

4. Ripeti con **Risparmio** attivo sul widget.
5. Cronometra l'**avvio a freddo** dopo un riavvio del PC: dal clic sull'icona alla comparsa della finestra.

## 3. Promemoria ad app chiusa

Con l'**app installata**:

1. Premi **App installata** nella scheda "Promemoria ad app chiusa".
2. Premi **Esci del tutto** e aspetta 60 secondi.
3. Se compare la notifica "NekoCalendar · prova promemoria", il test è superato.
4. Se non compare, ripeti con **Modalità sviluppo** (usa l'identità di PowerShell). Se così compare, il meccanismo funziona e va solo registrata l'identità dell'app: in quel caso passiamo al pacchetto MSIX per lo Store.

## Risultati (da compilare)

PC di riferimento: _modello, CPU, RAM, Windows 10/11_

| Test                                       | Obiettivo  | Risultato | Esito |
| ------------------------------------------ | ---------- | --------- | ----- |
| RAM con solo widget                        | < 150 MB   |           |       |
| CPU con solo widget                        | < 1 %      |           |       |
| RAM con widget in risparmio                | < 150 MB   |           |       |
| CPU con widget in risparmio                | < 1 %      |           |       |
| Avvio a freddo                             | < 2 s      |           |       |
| Notifica ad app chiusa (app installata)    | compare    |           |       |
| Notifica ad app chiusa (modalità sviluppo) | compare    |           |       |
| Widget sopra / sotto / click-through       | funzionano |           |       |

## Decisioni che dipendono dai risultati

- RAM sopra 150 MB → in M3 i widget usano un'unica finestra contenitore (ADR-0001).
- Notifica solo in modalità sviluppo → l'installer principale diventa MSIX (Store), che dà all'app un'identità registrata.
- Avvio sopra 2 s → si misura di nuovo con il profilo WebView2 già creato e si ottimizza il caricamento iniziale in M6.
