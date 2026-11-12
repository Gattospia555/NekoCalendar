/** `true` dentro l'app Tauri, `false` nell'anteprima nel browser (`npm run dev`). */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
