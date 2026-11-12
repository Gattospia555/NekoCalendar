import { describe, expect, it } from "vitest";
import { nextAnnualDate } from "./dates";

const local = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();

describe("nextAnnualDate", () => {
  it("restituisce la ricorrenza di quest'anno se non è ancora arrivata", () => {
    expect(nextAnnualDate(local(2026, 11, 12, 16, 45), 12, 25)).toBe(local(2026, 12, 25));
  });

  it("durante il giorno stesso restituisce la mezzanotte di oggi", () => {
    expect(nextAnnualDate(local(2026, 12, 25, 18), 12, 25)).toBe(local(2026, 12, 25));
  });

  it("dopo il giorno passa all'anno successivo", () => {
    expect(nextAnnualDate(local(2026, 12, 26, 0, 1), 12, 25)).toBe(local(2027, 12, 25));
  });

  it("salta gli anni in cui la data non esiste (29 febbraio)", () => {
    expect(nextAnnualDate(local(2026, 3, 1), 2, 29)).toBe(local(2028, 2, 29));
  });

  it("rifiuta mesi, giorni o istanti non validi", () => {
    expect(() => nextAnnualDate(0, 0, 10)).toThrow(RangeError);
    expect(() => nextAnnualDate(0, 13, 10)).toThrow(RangeError);
    expect(() => nextAnnualDate(0, 5, 0)).toThrow(RangeError);
    expect(() => nextAnnualDate(0, 5, 32)).toThrow(RangeError);
    expect(() => nextAnnualDate(0, 5, 1.5)).toThrow(RangeError);
    expect(() => nextAnnualDate(Number.NaN, 5, 1)).toThrow(RangeError);
  });

  it("segnala una data che non esiste mai (31 aprile)", () => {
    expect(() => nextAnnualDate(local(2026, 1, 1), 4, 31)).toThrow(RangeError);
  });
});
