import type { CSSProperties } from "react";

/**
 * Palette degli eventi: otto colori morbidi ma leggibili. Ognuno ha tre valori
 * (tinta di sfondo, striscia, testo) per il tema chiaro e per quello scuro, definiti in
 * `tokens.css` come `--ev-<nome>-tint|stripe|ink`. Il terracotta non c'è: è riservato
 * alle azioni (pulsanti, focus), così un evento non si confonde mai con un pulsante.
 */
export const EVENT_HUES = [
  "salvia",
  "cielo",
  "mirtillo",
  "lavanda",
  "rosa",
  "miele",
  "menta",
  "ardesia",
] as const;

export type EventHue = (typeof EVENT_HUES)[number];

/** Colore della striscia di ogni tinta: è il valore salvato nel database. */
export const HUE_STRIPES: Record<EventHue, string> = {
  salvia: "#6fa35a",
  cielo: "#5b93c7",
  mirtillo: "#6470c8",
  lavanda: "#9478c9",
  rosa: "#d96c8a",
  miele: "#d9a520",
  menta: "#3fa394",
  ardesia: "#8c847c",
};

/** Colori delle versioni precedenti, ricondotti alla tinta nuova più simile. */
const LEGACY: Record<string, EventHue> = {
  "#c58463": "salvia", // vecchio "Personale" (terracotta, ora riservato alle azioni)
  "#d06a8c": "rosa",
  "#4f7fb8": "cielo",
  "#2f7f86": "menta",
  "#2e9a5e": "salvia",
  "#c99a00": "miele",
  "#8a63c8": "lavanda",
  "#7a6a5f": "ardesia",
};

/** Tonalità (0-360) e saturazione (0-1) di un colore esadecimale. */
function hueAndSaturation(hex: string): { hue: number; saturation: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const value = parseInt(match[1], 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((c) => c / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta !== 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  return { hue: (hue + 360) % 360, saturation };
}

/**
 * Tinta della palette per un colore qualsiasi: quella esatta se il colore è della palette
 * (o di una versione precedente), altrimenti la più vicina per tonalità. I colori quasi
 * grigi diventano "ardesia".
 */
export function hueOf(color: string): EventHue {
  const key = color.trim().toLowerCase();
  const exact = EVENT_HUES.find((hue) => HUE_STRIPES[hue] === key);
  if (exact) return exact;
  if (LEGACY[key]) return LEGACY[key];
  const target = hueAndSaturation(key);
  if (!target || target.saturation < 0.18) return "ardesia";
  let best: EventHue = "ardesia";
  let bestDistance = Infinity;
  for (const hue of EVENT_HUES) {
    if (hue === "ardesia") continue;
    const candidate = hueAndSaturation(HUE_STRIPES[hue]);
    if (!candidate) continue;
    const raw = Math.abs(candidate.hue - target.hue);
    const distance = Math.min(raw, 360 - raw);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = hue;
    }
  }
  return best;
}

/** Colore pieno (striscia) della tinta di un colore, come variabile CSS del tema. */
export function eventStripe(color: string): string {
  return `var(--ev-${hueOf(color)}-stripe)`;
}

/** Variabili CSS dell'evento: striscia, tinta di sfondo e colore del testo, dal tema corrente. */
export function eventStyle(color: string): CSSProperties {
  const hue = hueOf(color);
  return {
    "--event-color": `var(--ev-${hue}-stripe)`,
    "--event-tint": `var(--ev-${hue}-tint)`,
    "--event-ink": `var(--ev-${hue}-ink)`,
  } as CSSProperties;
}
