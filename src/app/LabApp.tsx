import { useEffect, useState } from "react";
import {
  type AppIdMode,
  errorMessage,
  quitApp,
  scheduleTestNotification,
} from "../platform/commands";
import {
  type WidgetLayer,
  setWidgetLayer,
  setWidgetVisible,
  tryClickThrough,
} from "../platform/widgetWindow";
import { lightenWhenMinimized } from "../platform/memory";
import "./lab.css";

const LAYERS: { value: WidgetLayer; label: string }[] = [
  { value: "top", label: "Sopra le finestre" },
  { value: "normal", label: "Normale" },
  { value: "bottom", label: "Sotto le finestre" },
];

const NOTIFICATION_DELAY_SECONDS = 60;
const CLICK_THROUGH_MS = 10_000;

type Status = { kind: "ok" | "error"; text: string } | null;

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p className={`status status-${status.kind}`} role="status">
      {status.text}
    </p>
  );
}

/**
 * Finestra principale del prototipo M0: serve solo a provare i rischi del piano
 * (widget, notifiche ad app chiusa, consumo di risorse). Nella M1 diventa il calendario.
 */
export function LabApp() {
  const [layer, setLayer] = useState<WidgetLayer>("bottom");
  const [widgetShown, setWidgetShown] = useState(true);
  const [clickThroughActive, setClickThroughActive] = useState(false);
  const [widgetStatus, setWidgetStatus] = useState<Status>(null);
  const [notifyStatus, setNotifyStatus] = useState<Status>(null);

  useEffect(() => {
    // Ridotta a icona, la finestra principale libera memoria (misura M0 con il solo widget).
    let stop: (() => void) | undefined;
    let cancelled = false;
    void lightenWhenMinimized().then((unlisten) => {
      if (cancelled) unlisten();
      else stop = unlisten;
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);

  async function changeLayer(next: WidgetLayer) {
    try {
      await setWidgetLayer(next);
      setLayer(next);
      setWidgetStatus({
        kind: "ok",
        text: `Widget: ${LAYERS.find((l) => l.value === next)?.label}.`,
      });
    } catch (error) {
      setWidgetStatus({ kind: "error", text: errorMessage(error) });
    }
  }

  async function toggleWidget() {
    try {
      await setWidgetVisible(!widgetShown);
      setWidgetShown(!widgetShown);
      setWidgetStatus(null);
    } catch (error) {
      setWidgetStatus({ kind: "error", text: errorMessage(error) });
    }
  }

  async function startClickThrough() {
    setClickThroughActive(true);
    setWidgetStatus({
      kind: "ok",
      text: "Per 10 secondi i clic passano attraverso il widget: prova a cliccare un'icona sotto.",
    });
    try {
      await tryClickThrough(CLICK_THROUGH_MS);
      setWidgetStatus({
        kind: "ok",
        text: "Click-through terminato: il widget è di nuovo cliccabile.",
      });
    } catch (error) {
      setWidgetStatus({ kind: "error", text: errorMessage(error) });
    } finally {
      setClickThroughActive(false);
    }
  }

  async function scheduleNotification(mode: AppIdMode) {
    try {
      const aumid = await scheduleTestNotification(NOTIFICATION_DELAY_SECONDS, mode);
      setNotifyStatus({
        kind: "ok",
        text: `Programmata tra ${NOTIFICATION_DELAY_SECONDS} secondi (identità: ${aumid}). Ora premi «Esci del tutto» e aspetta.`,
      });
    } catch (error) {
      setNotifyStatus({ kind: "error", text: errorMessage(error) });
    }
  }

  return (
    <div className="lab">
      <header className="lab-header">
        <h1>NekoCalendar</h1>
        <span className="lab-chip">Laboratorio M0</span>
        <p className="lab-intro">
          Questa schermata serve solo per i test della milestone 0. Dalla milestone 1 qui ci sarà il
          calendario.
        </p>
      </header>

      <div className="lab-grid">
        <section className="card" aria-labelledby="widget-title">
          <h2 id="widget-title">Widget countdown</h2>
          <p>
            Il widget è la finestra trasparente con il conto alla rovescia: trascinalo dove vuoi.
          </p>
          <div className="row" role="group" aria-label="Livello del widget">
            {LAYERS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="btn"
                aria-pressed={layer === option.value}
                onClick={() => void changeLayer(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="row">
            <button type="button" className="btn" onClick={() => void toggleWidget()}>
              {widgetShown ? "Nascondi widget" : "Mostra widget"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={clickThroughActive}
              onClick={() => void startClickThrough()}
            >
              Prova click-through (10 s)
            </button>
          </div>
          <StatusLine status={widgetStatus} />
        </section>

        <section className="card" aria-labelledby="notify-title">
          <h2 id="notify-title">Promemoria ad app chiusa</h2>
          <p>
            Programma una notifica tra {NOTIFICATION_DELAY_SECONDS} secondi, poi chiudi l&apos;app
            con «Esci del tutto». Se la notifica compare lo stesso, il test è superato.
          </p>
          <div className="row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => void scheduleNotification("installed")}
            >
              App installata
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => void scheduleNotification("development")}
            >
              Modalità sviluppo
            </button>
          </div>
          <StatusLine status={notifyStatus} />
        </section>

        <section className="card" aria-labelledby="measure-title">
          <h2 id="measure-title">Misura RAM e CPU</h2>
          <p>
            Nascondi questa finestra lasciando solo il widget, poi apri PowerShell nella cartella
            del progetto ed esegui:
          </p>
          <p>
            <code>powershell -ExecutionPolicy Bypass -File .\scripts\measure.ps1</code>
          </p>
          <p>Obiettivo: CPU sotto l&apos;1 % e RAM sotto i 150 MB con il widget fermo.</p>
        </section>
      </div>

      <footer className="lab-footer">
        <button type="button" className="btn" onClick={() => void quitApp()}>
          Esci del tutto
        </button>
      </footer>
    </div>
  );
}
