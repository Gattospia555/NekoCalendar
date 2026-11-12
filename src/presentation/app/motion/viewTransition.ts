import { flushSync } from "react-dom";

/**
 * Tipo di passaggio animato. Il CSS (app.css, sezione "Trasformazioni") sceglie
 * l'effetto in base a `<html data-vt="…">`:
 * - `next` / `previous`: la pagina del calendario si alza o scende come un calendario da muro;
 * - `view` / `today`: dissolvenza con un leggero zoom;
 * - `zoom`: il giorno cliccato si allarga fino a diventare la vista Giorno;
 * - `open` / `close`: l'evento (o il pulsante) si trasforma nella finestra e ritorno.
 */
export type TransitionKind = "next" | "previous" | "view" | "today" | "zoom" | "open" | "close";

/**
 * L'elemento "grande" della trasformazione: la scheda della vista Giorno (`zoom`)
 * o la finestra aperta (`morph`). Riceve il nome dal CSS quando `<html data-vt-target>`
 * vale `zoom` o `morph`; l'elemento "piccolo" (`source`) lo riceve qui, in linea.
 * Un nome può stare su un solo elemento per foto: per questo si sposta tra le due.
 */
type Target = "zoom" | "morph";

/** Nome condiviso dai due elementi che si trasformano l'uno nell'altro. */
const MORPH_NAME = "vt-morph";

/**
 * La transizione in corso. Se ne parte un'altra (clic o tasti rapidi), il browser
 * salta la prima: la sua chiusura non deve cancellare le indicazioni della seconda.
 */
let current: ViewTransition | null = null;

interface Options {
  /** Elemento piccolo: casella del giorno, evento, pulsante "Nuovo evento". */
  source?: Element | null;
  /** Elemento grande, vedi `Target`. */
  target?: Target;
  /** Al contrario: dal grande al piccolo (per esempio la finestra che si chiude). */
  reverse?: boolean;
}

/**
 * Vero mentre una View Transition sta applicando il cambio: chi nasce in quel momento
 * (una vista, una finestra) non deve avere anche la sua animazione CSS d'entrata,
 * altrimenti le due si sovrappongono. Va letto una volta sola, quando l'elemento nasce.
 */
export function isInsideTransition(): boolean {
  return typeof document !== "undefined" && Boolean(document.documentElement.dataset.vt);
}

/** Vero se il motore supporta le View Transitions e l'utente non ha chiesto meno animazioni. */
export function canTransition(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Esegue `update` (un cambio di stato React) dentro una View Transition.
 * Senza supporto, o con "Riduci animazioni", esegue l'aggiornamento e basta.
 *
 * Funziona così: il browser fotografa la schermata, React applica il cambio
 * in modo sincrono (`flushSync`), il browser fotografa di nuovo e anima tra le due.
 * Gli elementi con lo stesso `view-transition-name` prima e dopo si "trasformano"
 * l'uno nell'altro (posizione, dimensione e aspetto).
 */
export function runTransition(kind: TransitionKind, update: () => void, options: Options = {}) {
  if (!canTransition()) {
    update();
    return;
  }
  const root = document.documentElement;
  const source = options.source instanceof HTMLElement ? options.source : null;

  const { target, reverse = false } = options;
  root.dataset.vt = kind;
  // Prima foto: il nome sta sull'elemento di partenza.
  if (target && reverse) root.dataset.vtTarget = target;
  else if (target && source) source.style.viewTransitionName = MORPH_NAME;

  const transition = document.startViewTransition(() => {
    // Seconda foto: il nome passa all'elemento di arrivo.
    if (target && reverse) {
      delete root.dataset.vtTarget;
      if (source?.isConnected) source.style.viewTransitionName = MORPH_NAME;
    } else if (target) {
      if (source) source.style.viewTransitionName = "";
      root.dataset.vtTarget = target;
    }
    flushSync(update);
  });

  current = transition;
  const cleanUp = () => {
    if (source) source.style.viewTransitionName = "";
    if (current !== transition) return; // ne è già partita un'altra: tocca a lei
    current = null;
    delete root.dataset.vt;
    delete root.dataset.vtTarget;
  };
  transition.finished.then(cleanUp, cleanUp);
  // Se l'animazione non può partire (es. finestra nascosta) il cambio avviene comunque:
  // l'errore di "ready" non è un problema da segnalare.
  transition.ready.catch(() => undefined);
}
