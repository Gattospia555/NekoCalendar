import { describe, expect, it } from "vitest";
import {
  AGENDA_DAYS,
  isSameMonth,
  monthGrid,
  shiftAnchor,
  viewRange,
  weekDays,
  yearMonths,
} from "./calendarGrid";

describe("griglie delle viste", () => {
  it("costruisce il mese di novembre 2026 partendo da lunedì 26 ottobre", () => {
    const grid = monthGrid("2026-11-12");
    expect(grid).toHaveLength(6);
    expect(grid[0][0]).toBe("2026-10-26");
    expect(grid[0][6]).toBe("2026-11-01");
    expect(grid[5][6]).toBe("2026-12-06");
  });

  it("elenca la settimana da lunedì e i mesi dell'anno", () => {
    expect(weekDays("2026-11-15")).toEqual([
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
    ]);
    expect(yearMonths("2026-06-30")[0]).toBe("2026-01-01");
    expect(yearMonths("2026-06-30")[11]).toBe("2026-12-01");
  });

  it("calcola l'intervallo da caricare per ogni vista", () => {
    expect(viewRange("day", "2026-11-12")).toEqual({ from: "2026-11-12", to: "2026-11-13" });
    expect(viewRange("week", "2026-11-12")).toEqual({ from: "2026-11-09", to: "2026-11-16" });
    expect(viewRange("month", "2026-11-12")).toEqual({ from: "2026-10-26", to: "2026-12-07" });
    expect(viewRange("year", "2026-11-12")).toEqual({ from: "2026-01-01", to: "2027-01-01" });
    expect(viewRange("agenda", "2026-11-12").to).toBe("2026-12-12");
    expect(AGENDA_DAYS).toBe(30);
  });

  it("va avanti e indietro della giusta quantità", () => {
    expect(shiftAnchor("day", "2026-11-12", 1)).toBe("2026-11-13");
    expect(shiftAnchor("week", "2026-11-12", -1)).toBe("2026-11-05");
    expect(shiftAnchor("month", "2026-01-31", 1)).toBe("2026-02-28");
    expect(shiftAnchor("year", "2028-02-29", 1)).toBe("2029-02-28");
    expect(shiftAnchor("agenda", "2026-11-12", 1)).toBe("2026-12-12");
  });

  it("riconosce i giorni del mese mostrato", () => {
    expect(isSameMonth("2026-11-30", "2026-11-12")).toBe(true);
    expect(isSameMonth("2026-12-01", "2026-11-12")).toBe(false);
  });
});
