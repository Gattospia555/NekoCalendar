import { useEffect, useState, type RefObject } from "react";

/** Posizione del pannello a comparsa, in coordinate della finestra. */
export interface PopoverPlace {
  left: number;
  top: number;
  width: number;
  /** Il pannello si apre sopra il campo (in basso non c'è spazio). */
  above: boolean;
  maxHeight: number;
}

const GAP = 6;
const MARGIN = 12;

/** Dove aprire il pannello: sotto il campo, oppure sopra se in basso non c'è abbastanza posto. */
function placeNear(anchor: HTMLElement | null, preferredHeight: number): PopoverPlace | null {
  const box = anchor?.getBoundingClientRect();
  if (!box) return null;
  const below = window.innerHeight - box.bottom - GAP - MARGIN;
  const aboveSpace = box.top - GAP - MARGIN;
  const above = below < Math.min(preferredHeight, 240) && aboveSpace > below;
  return {
    left: Math.max(MARGIN, Math.min(box.left, window.innerWidth - MARGIN - box.width)),
    top: above ? box.top - GAP : box.bottom + GAP,
    width: box.width,
    above,
    maxHeight: Math.max(120, Math.min(preferredHeight, above ? aboveSpace : below)),
  };
}

/**
 * Apertura, chiusura e posizione di un pannello a comparsa (menu, calendario, orari).
 * Il pannello è `position: fixed` vicino al campo: così non viene tagliato da
 * finestre di dialogo che scorrono. Si chiude cliccando fuori o se la finestra
 * cambia misura; segue il campo se la pagina scorre.
 */
export function usePopover(
  anchor: RefObject<HTMLElement | null>,
  panel: RefObject<HTMLElement | null>,
  preferredHeight: number,
) {
  const [place, setPlace] = useState<PopoverPlace | null>(null);
  const open = place !== null;
  const setOpen = (next: boolean) =>
    setPlace(next ? placeNear(anchor.current, preferredHeight) : null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (anchor.current?.contains(target) || panel.current?.contains(target)) return;
      setPlace(null);
    };
    const onResize = () => setPlace(null);
    const onScroll = (event: Event) => {
      // Lo scorrimento dentro il pannello stesso non lo sposta.
      if (panel.current?.contains(event.target as Node)) return;
      setPlace(placeNear(anchor.current, preferredHeight));
    };
    document.addEventListener("pointerdown", onPointer, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, anchor, panel, preferredHeight]);

  return { open, setOpen, place };
}

/** Stile in linea del pannello: sotto il campo, oppure sopra se in basso non c'è posto. */
export function popoverStyle(place: PopoverPlace | null, minWidth = 0) {
  if (!place) return { visibility: "hidden" as const };
  return {
    left: place.left,
    minWidth: Math.max(place.width, minWidth),
    maxHeight: place.maxHeight,
    ...(place.above
      ? { bottom: window.innerHeight - place.top, transformOrigin: "bottom left" }
      : { top: place.top, transformOrigin: "top left" }),
  };
}
