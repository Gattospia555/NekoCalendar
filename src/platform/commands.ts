import { invoke } from "@tauri-apps/api/core";

/** Con quale identità (AUMID) chiedere a Windows di mostrare la notifica. */
export type AppIdMode = "installed" | "development";

/** Programma una notifica di prova; restituisce l'AUMID usato. */
export function scheduleTestNotification(seconds: number, mode: AppIdMode): Promise<string> {
  return invoke<string>("schedule_test_notification", { seconds, mode });
}

/** Chiude NekoCalendar del tutto, widget compresi. */
export function quitApp(): Promise<void> {
  return invoke<void>("quit_app");
}

/** Messaggio leggibile da un errore restituito da Tauri o dal browser. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Errore sconosciuto";
}
