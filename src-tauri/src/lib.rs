//! Punto d'ingresso del core Rust di NekoCalendar.
//!
//! Il core resta volutamente piccolo: gestisce finestre, accesso al sistema
//! operativo e (più avanti) database e notifiche. Tutta la logica del
//! calendario vive nel codice TypeScript in `src/domain`.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("errore durante l'avvio di NekoCalendar");
}
