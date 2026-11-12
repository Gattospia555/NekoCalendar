import { getCurrentWindow } from "@tauri-apps/api/window";
import { setLowMemory } from "./commands";

/**
 * Mette la finestra corrente (un widget, quasi sempre fermo) in modalità memoria bassa.
 * Fuori da Tauri, per esempio nell'anteprima nel browser, non fa nulla.
 */
export async function enableLowMemoryForThisWindow(): Promise<void> {
  try {
    await setLowMemory(getCurrentWindow().label, true);
  } catch {
    // Anteprima nel browser o runtime WebView2 vecchio: si resta al consumo normale.
  }
}

/**
 * Alleggerisce la finestra corrente quando viene ridotta a icona e la riporta al
 * consumo normale quando torna visibile. Restituisce la funzione per smettere di ascoltare.
 */
export async function lightenWhenMinimized(): Promise<() => void> {
  try {
    const current = getCurrentWindow();
    let low = false;
    return await current.onResized(async () => {
      const minimized = await current.isMinimized();
      if (minimized === low) return; // Nessun cambio: niente chiamate inutili.
      low = minimized;
      await setLowMemory(current.label, minimized).catch(() => undefined);
    });
  } catch {
    return () => undefined;
  }
}
