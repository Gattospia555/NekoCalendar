/**
 * Identificativi e orologio logico ibrido (HLC) per la sincronizzazione offline-first.
 *
 * - Gli id sono UUID v7: nascono sul dispositivo (anche offline), non si scontrano
 *   tra dispositivi e sono ordinati per data di creazione.
 * - L'HLC dice quale modifica è "l'ultima" anche se gli orologi dei dispositivi
 *   non sono perfettamente sincronizzati (ADR-0003).
 */

/** Fonte di byte casuali: in produzione `crypto.getRandomValues`, nei test un generatore fisso. */
export type RandomBytes = (length: number) => Uint8Array;

export const cryptoRandomBytes: RandomBytes = (length) =>
  globalThis.crypto.getRandomValues(new Uint8Array(length));

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

/** UUID versione 7 (RFC 9562): 48 bit di tempo in ms + 74 bit casuali. */
export function uuidv7(
  nowMs: number = Date.now(),
  random: RandomBytes = cryptoRandomBytes,
): string {
  if (!Number.isFinite(nowMs) || nowMs < 0) throw new RangeError("nowMs non valido");
  const bytes = new Uint8Array(16);
  let time = Math.floor(nowMs);
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = time % 256;
    time = Math.floor(time / 256);
  }
  bytes.set(random(10), 6);
  bytes[6] = (bytes[6] & 0x0f) | 0x70; // versione 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variante RFC
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Timestamp HLC: millisecondi fisici + contatore logico + dispositivo che l'ha generato. */
export interface Hlc {
  ms: number;
  counter: number;
  node: string;
}

/**
 * Formato testuale ordinabile: `"0001794485049000-0000-<dispositivo>"`.
 * Il confronto tra stringhe dà lo stesso ordine del confronto tra timestamp.
 */
export function formatHlc({ ms, counter, node }: Hlc): string {
  return `${String(ms).padStart(16, "0")}-${String(counter).padStart(4, "0")}-${node}`;
}

export function parseHlc(value: string): Hlc {
  const match = /^(\d{16})-(\d{4})-(.+)$/.exec(value);
  if (!match) throw new RangeError(`HLC non valido: ${value}`);
  return { ms: Number(match[1]), counter: Number(match[2]), node: match[3] };
}

/** Genera i timestamp HLC di un dispositivo; ogni chiamata a `next` è strettamente crescente. */
export class HlcClock {
  private last: Hlc;

  constructor(
    private readonly node: string,
    private readonly now: () => number = Date.now,
  ) {
    if (!/^[A-Za-z0-9_]+$/.test(node)) throw new RangeError("node: solo lettere, numeri e _");
    this.last = { ms: 0, counter: 0, node };
  }

  /** Timestamp per una modifica fatta su questo dispositivo. */
  next(): string {
    const physical = this.now();
    if (physical > this.last.ms) this.last = { ms: physical, counter: 0, node: this.node };
    else this.last = { ms: this.last.ms, counter: this.last.counter + 1, node: this.node };
    return formatHlc(this.last);
  }

  /** Aggiorna l'orologio dopo aver ricevuto una modifica da un altro dispositivo. */
  receive(remote: string): void {
    const other = parseHlc(remote);
    if (
      other.ms > this.last.ms ||
      (other.ms === this.last.ms && other.counter > this.last.counter)
    ) {
      this.last = { ms: other.ms, counter: other.counter, node: this.node };
    }
  }
}

/** La modifica `a` è più recente di `b`? (a parità vince l'id dispositivo maggiore, in modo deterministico). */
export function isNewer(a: string, b: string): boolean {
  return a > b;
}
