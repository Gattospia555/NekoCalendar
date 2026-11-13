/**
 * Festeggiamento: poche zampette che saltano fuori da un punto (la casella
 * dell'attività appena completata) e ricadono. Piccolo e breve: è un sorriso, non
 * una festa di capodanno, e non copre il lavoro.
 *
 * - Elementi DOM animati con le Web Animations: niente canvas, niente timer.
 * - Tutto viene rimosso alla fine (circa un secondo): a riposo non resta nulla.
 * - Con "Riduci animazioni" di Windows non parte.
 */

/** Zampetta originale: un cuscinetto e quattro dita. */
const PAW_SVG =
  '<svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">' +
  '<ellipse cx="12" cy="15.5" rx="5.2" ry="4.4"/>' +
  '<ellipse cx="5.6" cy="10" rx="2.1" ry="2.6"/>' +
  '<ellipse cx="9.4" cy="6.2" rx="2.1" ry="2.7"/>' +
  '<ellipse cx="14.6" cy="6.2" rx="2.1" ry="2.7"/>' +
  '<ellipse cx="18.4" cy="10" rx="2.1" ry="2.6"/></svg>';

const COUNT = 8;
const DURATION_MS = 650;

/** Colore dell'evento (se c'è) e i due terracotta del tema corrente. */
function palette(extra?: string): string[] {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return [extra, read("--neko-accent"), read("--neko-accent-soft")].filter(
    (color): color is string => Boolean(color),
  );
}

/** Fa partire le zampette dal centro di `source`. Restituisce subito. */
export function celebrate(source: Element | null | undefined, color?: string): void {
  if (!source || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (typeof Element.prototype.animate !== "function") return;

  const box = source.getBoundingClientRect();
  const originX = box.left + box.width / 2;
  const originY = box.top + box.height / 2;
  const colors = palette(color);

  const layer = document.createElement("div");
  layer.className = "celebration";
  layer.setAttribute("aria-hidden", "true");
  document.body.append(layer);

  const animations = Array.from({ length: COUNT }, (_, i) => {
    const paw = document.createElement("span");
    paw.className = "celebration-paw";
    paw.innerHTML = PAW_SVG;
    const size = 10 + Math.random() * 8;
    paw.style.width = `${size}px`;
    paw.style.height = `${size}px`;
    paw.style.left = `${originX - size / 2}px`;
    paw.style.top = `${originY - size / 2}px`;
    paw.style.color = colors[i % colors.length];
    layer.append(paw);

    // Ventaglio verso l'alto, poi la "gravità" le fa ricadere.
    const angle =
      (-90 + (i / (COUNT - 1) - 0.5) * 140 + (Math.random() - 0.5) * 16) * (Math.PI / 180);
    const speed = 45 + Math.random() * 40;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const spin = (Math.random() - 0.5) * 240;
    return paw.animate(
      [
        { transform: "translate(0, 0) rotate(0deg) scale(0.3)", opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${spin / 2}deg) scale(1)`,
          opacity: 1,
          offset: 0.45,
        },
        {
          transform: `translate(${dx * 1.3}px, ${dy + 40}px) rotate(${spin}deg) scale(0.8)`,
          opacity: 0,
        },
      ],
      {
        duration: DURATION_MS * (0.85 + Math.random() * 0.15),
        easing: "cubic-bezier(0.05, 0.7, 0.1, 1)",
        fill: "forwards",
      },
    );
  });

  Promise.allSettled(animations.map((a) => a.finished)).then(() => layer.remove());
}
