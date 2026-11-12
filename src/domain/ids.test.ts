import { describe, expect, it } from "vitest";
import { HlcClock, formatHlc, isNewer, parseHlc, uuidv7 } from "./ids";

const zeros = (length: number) => new Uint8Array(length);
const ones = (length: number) => new Uint8Array(length).fill(0xff);

describe("uuidv7", () => {
  it("ha il formato UUID, la versione 7 e la variante RFC", () => {
    const id = uuidv7(Date.UTC(2026, 10, 12), zeros);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(uuidv7(Date.UTC(2026, 10, 12), ones)).toMatch(/-7fff-bfff-ffffffffffff$/);
  });

  it("è ordinato per momento di creazione", () => {
    const first = uuidv7(1_000, ones);
    const second = uuidv7(2_000, zeros);
    expect(first < second).toBe(true);
  });

  it("usa il generatore crittografico di default e rifiuta tempi non validi", () => {
    expect(uuidv7()).not.toBe(uuidv7());
    expect(() => uuidv7(-1)).toThrow(RangeError);
    expect(() => uuidv7(Number.NaN)).toThrow(RangeError);
  });
});

describe("orologio logico ibrido", () => {
  it("formatta e rilegge un timestamp", () => {
    const text = formatHlc({ ms: 1_794_485_049_000, counter: 3, node: "pc1" });
    expect(text).toBe("0001794485049000-0003-pc1");
    expect(parseHlc(text)).toEqual({ ms: 1_794_485_049_000, counter: 3, node: "pc1" });
    expect(() => parseHlc("sbagliato")).toThrow(RangeError);
  });

  it("cresce sempre, anche se l'orologio fisico è fermo o torna indietro", () => {
    let now = 5_000;
    const clock = new HlcClock("pc1", () => now);
    const a = clock.next();
    const b = clock.next();
    now = 4_000; // l'orologio di sistema torna indietro
    const c = clock.next();
    now = 6_000;
    const d = clock.next();
    expect([a, b, c, d]).toEqual([...[a, b, c, d]].sort());
    expect(new Set([a, b, c, d]).size).toBe(4);
    expect(parseHlc(d)).toEqual({ ms: 6_000, counter: 0, node: "pc1" });
  });

  it("dopo una modifica ricevuta genera timestamp più recenti di quella", () => {
    const clock = new HlcClock("pc1", () => 1_000);
    const remote = formatHlc({ ms: 9_000, counter: 7, node: "phone" });
    clock.receive(remote);
    expect(isNewer(clock.next(), remote)).toBe(true);
    clock.receive(formatHlc({ ms: 10, counter: 0, node: "old" })); // più vecchio: ignorato
    expect(parseHlc(clock.next()).ms).toBe(9_000);
  });

  it("rifiuta nomi di dispositivo che romperebbero il formato", () => {
    expect(() => new HlcClock("pc-1")).toThrow(RangeError);
  });
});
