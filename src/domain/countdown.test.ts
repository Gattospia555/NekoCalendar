import { describe, expect, it } from "vitest";
import {
  DAY_MS,
  HOUR_MS,
  MINUTE_MS,
  SECOND_MS,
  countdownParts,
  countdownProgress,
  msUntilNextTick,
  pad2,
} from "./countdown";

const at = (iso: string) => Date.parse(iso);

describe("countdownParts", () => {
  it("scompone giorni, ore, minuti e secondi", () => {
    const now = at("2026-11-12T16:45:22Z");
    const target = at("2026-12-25T00:00:00Z");
    expect(countdownParts(now, target)).toEqual({
      done: false,
      totalMs: target - now,
      days: 42,
      hours: 7,
      minutes: 14,
      seconds: 38,
    });
  });

  it("ignora i millisecondi residui (arrotonda per difetto al secondo)", () => {
    const parts = countdownParts(0, 2 * MINUTE_MS + 1 * SECOND_MS + 999);
    expect(parts).toMatchObject({ days: 0, hours: 0, minutes: 2, seconds: 1, done: false });
  });

  it("vale zero e done quando il momento è arrivato", () => {
    const t = at("2026-12-25T00:00:00Z");
    expect(countdownParts(t, t)).toEqual({
      done: true,
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    });
  });

  it("non va mai in negativo dopo la scadenza", () => {
    const parts = countdownParts(at("2026-12-26T00:00:00Z"), at("2026-12-25T00:00:00Z"));
    expect(parts.done).toBe(true);
    expect(parts.totalMs).toBe(0);
    expect(parts.days).toBe(0);
  });

  it("conta i giorni come intervalli fissi di 24 ore anche sopra il cambio dell'ora legale", () => {
    // In Italia l'ora legale finisce il 25/10/2026: l'intervallo reale è di 25 ore.
    const parts = countdownParts(at("2026-10-24T22:00:00Z"), at("2026-10-25T23:00:00Z"));
    expect(parts).toMatchObject({ days: 1, hours: 1, minutes: 0, seconds: 0 });
  });

  it("rifiuta valori non numerici", () => {
    expect(() => countdownParts(Number.NaN, 0)).toThrow(RangeError);
    expect(() => countdownParts(0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});

describe("countdownProgress", () => {
  const start = at("2026-11-01T00:00:00Z");
  const target = at("2026-12-25T00:00:00Z");

  it("vale 0 all'inizio e 1 alla fine", () => {
    expect(countdownProgress(start, target, start)).toBe(0);
    expect(countdownProgress(start, target, target)).toBe(1);
  });

  it("restituisce la frazione trascorsa", () => {
    const half = start + (target - start) / 2;
    expect(countdownProgress(start, target, half)).toBeCloseTo(0.5, 10);
  });

  it("resta tra 0 e 1 fuori dall'intervallo", () => {
    expect(countdownProgress(start, target, start - DAY_MS)).toBe(0);
    expect(countdownProgress(start, target, target + DAY_MS)).toBe(1);
  });

  it("considera completo un intervallo vuoto o invertito", () => {
    expect(countdownProgress(target, start, start)).toBe(1);
    expect(countdownProgress(start, start, start)).toBe(1);
  });
});

describe("msUntilNextTick", () => {
  it("calcola l'attesa fino al prossimo secondo", () => {
    expect(msUntilNextTick(10_250)).toBe(750);
    expect(msUntilNextTick(10_000)).toBe(1_000);
  });

  it("funziona con altre unità (minuto, ora)", () => {
    expect(msUntilNextTick(MINUTE_MS + 30 * SECOND_MS, MINUTE_MS)).toBe(30 * SECOND_MS);
    expect(msUntilNextTick(HOUR_MS - 1, HOUR_MS)).toBe(1);
  });

  it("gestisce istanti prima del 1970", () => {
    expect(msUntilNextTick(-250)).toBe(250);
  });

  it("rifiuta unità non valide", () => {
    expect(() => msUntilNextTick(0, 0)).toThrow(RangeError);
    expect(() => msUntilNextTick(0, -5)).toThrow(RangeError);
    expect(() => msUntilNextTick(Number.NaN)).toThrow(RangeError);
  });
});

describe("pad2", () => {
  it("aggiunge lo zero iniziale", () => {
    expect(pad2(7)).toBe("07");
    expect(pad2(42)).toBe("42");
    expect(pad2(123)).toBe("123");
  });

  it("non mostra mai numeri negativi o decimali", () => {
    expect(pad2(-3)).toBe("00");
    expect(pad2(4.9)).toBe("04");
  });
});
