import { describe, expect, it } from "vitest";
import { EVENT_ICONS, suggestIcon } from "./eventIcon";

describe("suggestIcon", () => {
  it("riconosce le parole chiave in italiano e inglese", () => {
    expect(suggestIcon("Dentista", "event")).toBe("tooth");
    expect(suggestIcon("Cena con Marco", "event")).toBe("dinner");
    expect(suggestIcon("Live su Twitch", "event")).toBe("studio-mic");
    expect(suggestIcon("Palestra", "event")).toBe("shoe");
    expect(suggestIcon("Ritiro pacco", "event")).toBe("package");
    expect(suggestIcon("Stand-up", "event")).toBe("meeting");
    expect(suggestIcon("Weekend al lago", "event")).toBe("camping");
    expect(suggestIcon("Dinner with Anna", "event")).toBe("dinner");
  });

  it("ignora maiuscole e accenti", () => {
    expect(suggestIcon("CAFFÈ con Luca", "event")).toBe("coffee");
    expect(suggestIcon("Università: esame", "event")).toBe("books");
  });

  it("confronta solo l'inizio delle parole", () => {
    // "cane" non deve scattare dentro "Toscane", né "set" dentro "settimana".
    expect(suggestIcon("Gita in Toscane", "event")).toBe("camping");
    expect(suggestIcon("Riepilogo settimana", "event")).toBe("calendar");
  });

  it("usa il tipo quando il titolo non suggerisce nulla", () => {
    expect(suggestIcon("Qualcosa di nuovo", "event")).toBe("calendar");
    expect(suggestIcon("Qualcosa da fare", "task")).toBe("check");
    expect(suggestIcon("Festa della Repubblica", "holiday")).toBe("party");
    expect(suggestIcon("Ognissanti", "holiday")).toBe("confetti");
  });

  it("dà sempre torta ai compleanni e cuori agli anniversari", () => {
    expect(suggestIcon("Luca", "birthday")).toBe("cake");
    expect(suggestIcon("Mamma e papà", "anniversary")).toBe("hearts");
  });

  it("riconosce le festività con un'icona dedicata", () => {
    expect(suggestIcon("Natale", "holiday")).toBe("tree");
    expect(suggestIcon("Capodanno", "holiday")).toBe("fireworks");
    expect(suggestIcon("Pasquetta", "holiday")).toBe("chick");
    expect(suggestIcon("Epifania", "holiday")).toBe("gift");
  });

  it("restituisce sempre un'icona dell'elenco", () => {
    for (const title of ["", "  ", "123", "Ψ", "pizza!"]) {
      expect(EVENT_ICONS).toContain(suggestIcon(title, "event"));
    }
  });
});
