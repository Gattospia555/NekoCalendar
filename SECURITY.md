# Sicurezza

## Segnalare una vulnerabilità

Non aprire una issue pubblica. Usa **Security → Report a vulnerability** nella pagina GitHub del progetto (segnalazione privata). Rispondiamo il prima possibile e ti teniamo aggiornato fino alla correzione.

## Versioni supportate

Fino alla 1.0 riceve correzioni solo l'ultima versione pubblicata.

## Principi seguiti dal progetto

- Nessun segreto nel codice o nella cronologia: scansione a ogni commit (secretlint) e in CI (gitleaks). Se un segreto finisce nel repository viene **ruotato subito**, non solo cancellato.
- Permessi minimi per ogni finestra (capabilities di Tauri) e Content Security Policy rigorosa.
- Style Pack e temi importati contengono solo dati, mai codice eseguibile.
- Dati del calendario sul dispositivo; nel cloud (facoltativo) solo con Row Level Security attiva su ogni tabella; chiavi di servizio mai nel client.
- Telemetria e crash report solo con consenso esplicito e senza dati del calendario.
