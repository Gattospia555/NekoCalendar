import { Window, getCurrentWindow } from "@tauri-apps/api/window";

/** Etichetta della finestra del widget countdown (vedi src-tauri/tauri.conf.json). */
export const COUNTDOWN_WIDGET_LABEL = "widget-countdown";

/** Dove sta il widget rispetto alle altre finestre. */
export type WidgetLayer = "top" | "normal" | "bottom";

/** Etichetta della finestra corrente, o `null` se la pagina gira fuori da Tauri (es. nel browser). */
export function currentWindowLabel(): string | null {
  try {
    return getCurrentWindow().label;
  } catch {
    return null;
  }
}

async function countdownWidget(): Promise<Window> {
  const widget = await Window.getByLabel(COUNTDOWN_WIDGET_LABEL);
  if (!widget) throw new Error("Finestra del widget non trovata.");
  return widget;
}

/** Porta il widget sopra le finestre, al livello normale oppure sotto tutte le finestre. */
export async function setWidgetLayer(layer: WidgetLayer): Promise<void> {
  const widget = await countdownWidget();
  // L'ordine conta: prima si toglie un livello, poi si mette l'altro.
  if (layer === "top") {
    await widget.setAlwaysOnBottom(false);
    await widget.setAlwaysOnTop(true);
  } else if (layer === "bottom") {
    await widget.setAlwaysOnTop(false);
    await widget.setAlwaysOnBottom(true);
  } else {
    await widget.setAlwaysOnTop(false);
    await widget.setAlwaysOnBottom(false);
  }
}

export async function setWidgetVisible(visible: boolean): Promise<void> {
  const widget = await countdownWidget();
  if (visible) await widget.show();
  else await widget.hide();
}

/**
 * Rende il widget "trasparente ai clic" per `durationMs`, poi lo riattiva da solo:
 * nel prototipo evita di restare con un widget impossibile da spostare.
 */
export async function tryClickThrough(durationMs: number): Promise<void> {
  const widget = await countdownWidget();
  await widget.setIgnoreCursorEvents(true);
  await new Promise((resolve) => window.setTimeout(resolve, durationMs));
  await widget.setIgnoreCursorEvents(false);
}
