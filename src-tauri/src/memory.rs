//! Consumo di memoria delle finestre WebView2.
//!
//! WebView2 può "alleggerire" una finestra che in quel momento non serve: con il
//! livello di memoria `Low` libera cache e memoria non indispensabili. Lo usiamo
//! per i widget (quasi sempre fermi) e per la finestra principale quando è ridotta
//! a icona. Obiettivo M0: RAM totale sotto i 150 MB con il solo widget visibile.

use tauri::Manager;

/// Imposta il livello di memoria (basso o normale) della finestra `label`.
#[tauri::command]
pub fn set_low_memory(app: tauri::AppHandle, label: String, low: bool) -> Result<(), String> {
    let window = app
        .get_webview_window(&label)
        .ok_or_else(|| format!("Finestra «{label}» non trovata."))?;
    platform::set_low_memory(&window, low)
}

#[cfg(windows)]
mod platform {
    use webview2_com::Microsoft::Web::WebView2::Win32::{
        COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_LOW, COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_NORMAL,
        ICoreWebView2_19,
    };
    use windows::core::Interface;

    pub fn set_low_memory(window: &tauri::WebviewWindow, low: bool) -> Result<(), String> {
        window
            .with_webview(move |webview| {
                let level = if low {
                    COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_LOW
                } else {
                    COREWEBVIEW2_MEMORY_USAGE_TARGET_LEVEL_NORMAL
                };
                // SAFETY: chiamate COM sul controller che Tauri ci passa, eseguite sul
                // thread dell'interfaccia come richiesto da WebView2.
                let result = unsafe {
                    webview
                        .controller()
                        .CoreWebView2()
                        .and_then(|core| core.cast::<ICoreWebView2_19>())
                        .and_then(|core| core.SetMemoryUsageTargetLevel(level))
                };
                // Se il runtime WebView2 è troppo vecchio l'interfaccia manca: non è grave,
                // la finestra continua a funzionare con il consumo normale.
                if let Err(error) = result {
                    eprintln!("WebView2: livello di memoria non impostato: {error}");
                }
            })
            .map_err(|error| error.to_string())
    }
}

#[cfg(not(windows))]
mod platform {
    /// Fuori da Windows non c'è WebView2: non fa nulla.
    pub fn set_low_memory(_window: &tauri::WebviewWindow, _low: bool) -> Result<(), String> {
        Ok(())
    }
}
