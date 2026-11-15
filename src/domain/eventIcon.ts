import type { EventKind } from "./types";

/**
 * Icone disponibili per gli eventi (Fluent Emoji di Microsoft, licenza MIT).
 * Il nome è quello del file in `src/presentation/assets/emoji/`.
 */
export const EVENT_ICONS = [
  "airplane",
  "beach",
  "book",
  "books",
  "briefcase",
  "broom",
  "cake",
  "calendar",
  "camera",
  "camping",
  "car",
  "cart",
  "cat",
  "chart",
  "check",
  "chick",
  "clapper",
  "coffee",
  "confetti",
  "dinner",
  "dog",
  "envelope",
  "fireworks",
  "gamepad",
  "gift",
  "heart",
  "hearts",
  "house",
  "laptop",
  "lotus",
  "meeting",
  "mic",
  "mountain",
  "music",
  "package",
  "paint",
  "party",
  "phone",
  "pill",
  "pizza",
  "receipt",
  "scissors",
  "shoe",
  "stethoscope",
  "studio-mic",
  "tooth",
  "train",
  "tree",
  "zzz",
] as const;

export type EventIcon = (typeof EVENT_ICONS)[number];

/**
 * Parole chiave → icona, dalla più specifica alla più generica: vince la prima che
 * compare nel titolo. Italiano e inglese insieme, senza accenti e in minuscolo.
 * Ogni parola si confronta con l'inizio delle parole del titolo ("palestr" trova
 * "palestra" e "palestre"), così bastano poche radici. Niente radici troppo corte:
 * "car" scatterebbe anche in "carne", "cat" in "catena", "set" in "settimana".
 */
const KEYWORDS: ReadonlyArray<readonly [EventIcon, readonly string[]]> = [
  ["cake", ["compleann", "birthday", "bday"]],
  ["hearts", ["anniversari", "anniversary"]],
  ["tree", ["natale", "santo stefano", "vigilia", "christmas", "xmas"]],
  ["fireworks", ["capodanno", "new year", "san silvestro"]],
  ["chick", ["pasqua", "pasquetta", "easter"]],
  ["tooth", ["dentist", "ortodont", "igiene orale"]],
  ["stethoscope", ["medic", "dottor", "visita", "ospedale", "analisi", "doctor", "clinic"]],
  ["pill", ["farmac", "medicin", "pastigli", "pharmacy", "pill"]],
  ["cat", ["veterinari", "gatt", "micio", "kitty"]],
  ["dog", ["cane", "cani", "dog", "passeggiata col cane"]],
  ["studio-mic", ["live", "stream", "twitch", "diretta"]],
  ["mic", ["doppiagg", "registrazion", "podcast", "provino", "dubbing", "recording", "audition"]],
  ["music", ["concert", "music", "prove", "lezione di canto", "rehearsal"]],
  ["clapper", ["cinema", "film", "serie", "movie"]],
  ["gamepad", ["gioc", "gaming", "game", "videogioc"]],
  ["camera", ["foto", "shooting", "photo", "video"]],
  ["paint", ["disegn", "arte", "pittur", "draw"]],
  ["airplane", ["volo", "aereo", "aeroporto", "flight", "airport"]],
  ["train", ["treno", "stazione", "train"]],
  ["beach", ["mare", "spiaggia", "vacanz", "ferie", "beach", "holiday", "vacation"]],
  ["mountain", ["montagna", "sciare", "neve", "mountain", "ski"]],
  ["camping", ["lago", "campeggi", "gita", "escursion", "weekend", "hike", "camping"]],
  ["shoe", ["palestr", "corsa", "allenament", "sport", "calcio", "gym", "run", "workout"]],
  ["lotus", ["yoga", "meditaz", "pilates", "meditation"]],
  ["zzz", ["dormi", "riposo", "pisolino", "sleep", "nap"]],
  ["dinner", ["cena", "pranzo", "ristorant", "trattori", "pizzeri", "dinner", "lunch"]],
  ["pizza", ["pizza"]],
  ["coffee", ["colazion", "caffe", "aperitiv", "breakfast", "coffee", "brunch"]],
  ["party", ["festa", "party", "compleanno di"]],
  ["gift", ["regal", "gift", "befana", "epifania"]],
  ["heart", ["appuntament", "san valentino", "valentine"]],
  ["meeting", ["riunion", "meeting", "stand-up", "standup", "call", "colloqui", "sync"]],
  ["chart", ["report", "presentazion", "budget", "slide"]],
  ["laptop", ["codice", "programm", "computer", "coding", "deploy"]],
  ["briefcase", ["lavoro", "ufficio", "turno", "cliente", "work", "office", "shift"]],
  [
    "books",
    ["esame", "studi", "scuola", "lezion", "universita", "corso", "exam", "study", "class"],
  ],
  ["book", ["lettur", "libr", "read", "book"]],
  ["receipt", ["bollett", "pagare", "pagamento", "tasse", "affitto", "bill", "pay", "rent"]],
  ["cart", ["spesa", "supermercat", "shopping", "groceries"]],
  ["package", ["pacco", "ritiro", "consegna", "spedizion", "parcel", "delivery"]],
  ["phone", ["telefon", "chiamare", "phone"]],
  ["envelope", ["email", "mail", "lettera"]],
  ["broom", ["pulizi", "pulire", "bucato", "cleaning", "laundry"]],
  ["house", ["casa", "trasloc", "home", "idraulic"]],
  ["car", ["auto", "macchina", "meccanic", "revisione", "tagliando"]],
  ["scissors", ["parrucch", "capelli", "barbier", "haircut", "hairdresser"]],
];

/** Icona usata quando il titolo non suggerisce nulla, per tipo di evento. */
const BY_KIND: Record<EventKind, EventIcon> = {
  event: "calendar",
  birthday: "cake",
  anniversary: "hearts",
  task: "check",
  holiday: "confetti",
};

/** Minuscolo, senza accenti e con spazi singoli: "Caffè  con Luca" → "caffe con luca". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** Vero se `key` compare all'inizio di una parola del titolo. */
function matches(title: string, key: string): boolean {
  let from = title.indexOf(key);
  while (from !== -1) {
    if (from === 0 || !/[a-z0-9]/.test(title[from - 1])) return true;
    from = title.indexOf(key, from + 1);
  }
  return false;
}

/**
 * Suggerisce un'icona dal titolo (e dal tipo) di un evento, come fanno i planner visivi:
 * "Dentista" → dente, "Cena con Marco" → piatto, "Live su Twitch" → microfono.
 * Le ricorrenze tipiche (compleanni, anniversari, attività) hanno la loro icona.
 */
export function suggestIcon(title: string, kind: EventKind): EventIcon {
  if (kind === "birthday") return "cake";
  if (kind === "anniversary") return "hearts";
  const text = normalize(title);
  for (const [icon, keys] of KEYWORDS) {
    if (keys.some((key) => matches(text, key))) return icon;
  }
  return BY_KIND[kind];
}
