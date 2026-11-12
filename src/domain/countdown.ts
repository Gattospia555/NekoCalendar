/**
 * Calcoli del countdown, indipendenti dall'interfaccia e da Tauri.
 *
 * Nota (M0): qui i giorni sono intervalli fissi di 24 ore. Le unità di
 * calendario (mesi, anni) e il passaggio all'ora legale "come lo vede
 * l'orologio" arrivano in M3, quando il countdown diventa configurabile.
 */

export const SECOND_MS = 1_000;
export const MINUTE_MS = 60 * SECOND_MS;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export interface CountdownParts {
  /** `true` quando il momento è arrivato o è già passato. */
  done: boolean;
  /** Millisecondi mancanti (mai negativi). */
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Scompone il tempo che manca da `nowMs` a `targetMs` in giorni, ore, minuti e secondi. */
export function countdownParts(nowMs: number, targetMs: number): CountdownParts {
  assertFinite(nowMs, "nowMs");
  assertFinite(targetMs, "targetMs");

  const totalMs = Math.max(0, targetMs - nowMs);
  // Arrotondiamo per difetto al secondo: "0 secondi" compare solo allo scadere.
  let rest = Math.floor(totalMs / SECOND_MS) * SECOND_MS;

  const days = Math.floor(rest / DAY_MS);
  rest -= days * DAY_MS;
  const hours = Math.floor(rest / HOUR_MS);
  rest -= hours * HOUR_MS;
  const minutes = Math.floor(rest / MINUTE_MS);
  rest -= minutes * MINUTE_MS;
  const seconds = Math.floor(rest / SECOND_MS);

  return { done: totalMs === 0, totalMs, days, hours, minutes, seconds };
}

/**
 * Quanto del percorso da `startMs` a `targetMs` è già passato, da 0 a 1.
 * Serve per la barra di progresso e per l'anello del countdown.
 */
export function countdownProgress(startMs: number, targetMs: number, nowMs: number): number {
  assertFinite(startMs, "startMs");
  assertFinite(targetMs, "targetMs");
  assertFinite(nowMs, "nowMs");
  if (targetMs <= startMs) return 1;
  const ratio = (nowMs - startMs) / (targetMs - startMs);
  return Math.min(1, Math.max(0, ratio));
}

/**
 * Millisecondi che mancano al prossimo "scatto" dell'unità indicata.
 * Il widget si ridisegna solo in quel momento: niente timer inutili, CPU in idle quasi a zero.
 */
export function msUntilNextTick(nowMs: number, unitMs: number = SECOND_MS): number {
  assertFinite(nowMs, "nowMs");
  if (!(unitMs > 0)) throw new RangeError("unitMs deve essere maggiore di zero");
  const remainder = ((nowMs % unitMs) + unitMs) % unitMs;
  return unitMs - remainder;
}

/** Due cifre con zero iniziale: 7 → "07". */
export function pad2(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) throw new RangeError(`${name} deve essere un numero finito`);
}
