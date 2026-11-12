//! Punto d'ingresso del core Rust di NekoCalendar.
//!
//! Il core resta volutamente piccolo: gestisce finestre, accesso al sistema
//! operativo e (più avanti) database e notifiche. Tutta la logica del
//! calendario vive nel codice TypeScript in `src/domain`.

mod memory;
mod notifications;

/// Chiude l'app del tutto, compresi i widget (serve per i test "ad app chiusa").
#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            quit_app,
            memory::set_low_memory,
            notifications::schedule_test_notification
        ])
        .run(tauri::generate_context!())
        .expect("errore durante l'avvio di NekoCalendar");
}
