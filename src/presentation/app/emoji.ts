import { suggestIcon, type EventIcon } from "@/domain/eventIcon";
import type { Occurrence } from "@/domain/types";

/*
 * Icone degli eventi: Fluent Emoji di Microsoft (licenza MIT, vedi THIRD_PARTY_NOTICES).
 * Due versioni della stessa icona: "3d" per le copertine (liste, prossimo evento) e
 * "flat" per le etichette piccole del calendario, dove il 3D a 14 px diventa una macchia.
 * Vite copia i file nella build e qui riceviamo solo i loro indirizzi.
 */
const THREE_D = import.meta.glob<string>("../assets/emoji/3d/*.webp", {
  eager: true,
  import: "default",
});
const FLAT = import.meta.glob<string>("../assets/emoji/flat/*.svg", {
  eager: true,
  import: "default",
});

/** Indirizzi delle icone per nome (es. "cake" → URL del file). */
function bySlug(files: Record<string, string>): Map<string, string> {
  const map = new Map<string, string>();
  for (const [path, url] of Object.entries(files)) {
    const slug = path.slice(path.lastIndexOf("/") + 1, path.lastIndexOf("."));
    map.set(slug, url);
  }
  return map;
}

const URLS = { "3d": bySlug(THREE_D), flat: bySlug(FLAT) };

/** Indirizzo dell'immagine di un'icona nello stile richiesto. */
export function emojiUrl(icon: EventIcon, style: "3d" | "flat"): string {
  return URLS[style].get(icon) ?? URLS[style].get("calendar") ?? "";
}

/** Icone già calcolate: lo stesso titolo compare in molte etichette (eventi ripetuti). */
const cache = new Map<string, EventIcon>();

/** Icona scelta per un'occorrenza, dal titolo e dal tipo (vedi `suggestIcon`). */
export function iconOf(occurrence: Pick<Occurrence, "title" | "kind">): EventIcon {
  const key = `${occurrence.kind}|${occurrence.title}`;
  let icon = cache.get(key);
  if (!icon) {
    icon = suggestIcon(occurrence.title, occurrence.kind);
    if (cache.size > 500) cache.clear();
    cache.set(key, icon);
  }
  return icon;
}
