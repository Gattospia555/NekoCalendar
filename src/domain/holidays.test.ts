import { describe, expect, it } from "vitest";
import { easterSunday, italianHolidays } from "./holidays";

describe("festività italiane", () => {
  it("calcola la Pasqua", () => {
    expect(easterSunday(2025)).toBe("2025-04-20");
    expect(easterSunday(2026)).toBe("2026-04-05");
    expect(easterSunday(2027)).toBe("2027-03-28");
    expect(() => easterSunday(1200)).toThrow(RangeError);
  });

  it("elenca le feste nazionali in ordine, con Pasquetta", () => {
    const list = italianHolidays(2026);
    expect(list).toHaveLength(13);
    expect(list[0]).toEqual({ id: "new-year", date: "2026-01-01", name: "Capodanno" });
    expect(list.find((h) => h.id === "easter-monday")?.date).toBe("2026-04-06");
    expect(list.map((h) => h.date)).toEqual([...list.map((h) => h.date)].sort());
  });

  it("include San Francesco (4 ottobre) solo dal 2026", () => {
    expect(italianHolidays(2025).some((h) => h.id === "saint-francis")).toBe(false);
    expect(italianHolidays(2027).find((h) => h.id === "saint-francis")?.date).toBe("2027-10-04");
  });

  it("traduce i nomi in inglese", () => {
    expect(italianHolidays(2026, "en").find((h) => h.id === "christmas")?.name).toBe(
      "Christmas Day",
    );
    expect(italianHolidays(2026, "en").find((h) => h.id === "easter")?.name).toBe("Easter Sunday");
  });
});
