import { describe, expect, it } from "vitest";
import { EVENT_HUES, HUE_STRIPES, eventStyle, hueOf } from "./eventPalette";

describe("hueOf", () => {
  it("riconosce i colori della palette, anche in maiuscolo", () => {
    for (const hue of EVENT_HUES) expect(hueOf(HUE_STRIPES[hue].toUpperCase())).toBe(hue);
  });

  it("riconduce i colori delle versioni precedenti", () => {
    expect(hueOf("#c58463")).toBe("salvia");
    expect(hueOf("#4f7fb8")).toBe("cielo");
    expect(hueOf("#d06a8c")).toBe("rosa");
  });

  it("sceglie la tinta più vicina per i colori personalizzati", () => {
    expect(hueOf("#ff0000")).toBe("rosa");
    expect(hueOf("#00aa00")).toBe("salvia");
    expect(hueOf("#0000ff")).toBe("mirtillo");
    expect(hueOf("#ffcc00")).toBe("miele");
  });

  it("usa ardesia per grigi e valori non validi", () => {
    expect(hueOf("#808080")).toBe("ardesia");
    expect(hueOf("rosso")).toBe("ardesia");
  });
});

describe("eventStyle", () => {
  it("collega le tre variabili del tema", () => {
    expect(eventStyle("#5b93c7")).toEqual({
      "--event-color": "var(--ev-cielo-stripe)",
      "--event-tint": "var(--ev-cielo-tint)",
      "--event-ink": "var(--ev-cielo-ink)",
    });
  });
});
