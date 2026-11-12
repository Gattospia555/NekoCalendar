import { useEffect, useState } from "react";
import { MINUTE_MS, SECOND_MS, countdownParts, msUntilNextTick, pad2 } from "../domain/countdown";
import { nextAnnualDate } from "../domain/dates";
import "./widget.css";

interface TileProps {
  value: string;
  label: string;
}

function Tile({ value, label }: TileProps) {
  return (
    <div className="tile" data-tauri-drag-region>
      {/* `key` fa ripartire l'effetto "glow" solo quando la cifra cambia. */}
      <div className="tile-digits" key={value} data-tauri-drag-region>
        {value}
      </div>
      <span className="tile-label" data-tauri-drag-region>
        {label}
      </span>
    </div>
  );
}

/**
 * Widget countdown (prototipo M0): conta fino al prossimo Natale.
 * Si ridisegna solo quando cambia una cifra visibile e si ferma quando è nascosto.
 */
export function CountdownWidget() {
  const [now, setNow] = useState(() => Date.now());
  const [ecoMode, setEcoMode] = useState(false);
  const [hidden, setHidden] = useState(() => document.visibilityState === "hidden");

  useEffect(() => {
    const onVisibility = () => {
      const isHidden = document.visibilityState === "hidden";
      setHidden(isHidden);
      if (!isHidden) setNow(Date.now());
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (hidden) return undefined; // Widget non visibile: nessun timer, CPU a zero.
    const unit = ecoMode ? MINUTE_MS : SECOND_MS;
    const timer = window.setTimeout(() => setNow(Date.now()), msUntilNextTick(Date.now(), unit));
    return () => window.clearTimeout(timer);
  }, [now, ecoMode, hidden]);

  const target = nextAnnualDate(now, 12, 25);
  const parts = countdownParts(now, target);

  return (
    <main className={`widget${ecoMode ? " widget-eco" : ""}`} data-tauri-drag-region>
      <header className="widget-head" data-tauri-drag-region>
        <span className="widget-kicker" data-tauri-drag-region>
          Mancano a
        </span>
        <span className="widget-title" data-tauri-drag-region>
          Natale
        </span>
        <button
          type="button"
          className="widget-eco-btn"
          aria-pressed={ecoMode}
          onClick={() => setEcoMode((value) => !value)}
          title="Risparmio energia: aggiorna una volta al minuto e spegne gli effetti"
        >
          Risparmio
        </button>
      </header>

      {parts.done ? (
        <p className="widget-done" data-tauri-drag-region>
          È arrivato il giorno!
        </p>
      ) : (
        <div className="tiles" data-tauri-drag-region>
          <Tile value={String(parts.days)} label="GIORNI" />
          <Tile value={pad2(parts.hours)} label="ORE" />
          <Tile value={pad2(parts.minutes)} label="MIN" />
          {!ecoMode && <Tile value={pad2(parts.seconds)} label="SEC" />}
        </div>
      )}
    </main>
  );
}
