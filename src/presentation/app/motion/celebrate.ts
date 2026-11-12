/**
 * Festeggiamento: una manciata di zampette che saltano fuori da un punto
 * (la casella dell'attività appena completata, l'evento appena creato) e ricadono.
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

const COUNT = 22;
const DURATION_MS = 1000;

/** Colori del tema corrente (chiaro o scuro), più il colore dell'evento se c'è. */
function palette(extra?: string): string[] {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string) => style.getPropertyValue(name).trim();
  return [read("--neko-accent"), read("--neko-accent-soft"), read("--neko-peach"), extra].filter(
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
    const size = 14 + Math.random() * 14;
    paw.style.width = `${size}px`;
    paw.style.height = `${size}px`;
    paw.style.left = `${originX - size / 2}px`;
    paw.style.top = `${originY - size / 2}px`;
    paw.style.color = colors[i % colors.length];
    layer.append(paw);

    // Ventaglio verso l'alto, poi la "gravità" le fa ricadere.
    const angle = (-90 + (Math.random() - 0.5) * 150) * (Math.PI / 180);
    const speed = 90 + Math.random() * 110;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    const spin = (Math.random() - 0.5) * 540;
    return paw.animate(
      [
        { transform: "translate(0, 0) rotate(0deg) scale(0.3)", opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${spin / 2}deg) scale(1)`,
          opacity: 1,
          offset: 0.45,
        },
        {
          transform: `translate(${dx * 1.4}px, ${dy + 90}px) rotate(${spin}deg) scale(0.8)`,
          opacity: 0,
        },
      ],
      {
        duration: DURATION_MS * (0.8 + Math.random() * 0.4),
        easing: "cubic-bezier(0.2, 0.6, 0.35, 1)",
        fill: "forwards",
      },
    );
  });

  Promise.allSettled(animations.map((a) => a.finished)).then(() => layer.remove());
}
