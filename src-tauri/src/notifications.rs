//! Prototipo M0: notifiche programmate di Windows.
//!
//! Le `ScheduledToastNotification` vengono consegnate a Windows, che le mostra
//! all'orario indicato **anche se NekoCalendar è chiusa**. È il secondo livello
//! della strategia dei promemoria (il primo è l'app residente nella tray).
//!
//! Windows mostra una notifica solo se l'"identità" dell'app (AUMID) è registrata:
//! - modalità `Installed`: usa l'identificativo dell'app, valido dopo l'installazione;
//! - modalità `Development`: usa l'AUMID di PowerShell, sempre registrato, per provare
//!   il meccanismo anche con `npm run tauri dev`.

use serde::Deserialize;

/// AUMID di PowerShell: Windows lo riconosce sempre (le notifiche mostrano l'icona di PowerShell).
const POWERSHELL_AUMID: &str =
    r"{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe";

/// Limiti del test: almeno 5 secondi, al massimo un'ora.
const MIN_DELAY_SECONDS: u32 = 5;
const MAX_DELAY_SECONDS: u32 = 3_600;

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AppIdMode {
    Installed,
    Development,
}

/// Programma una notifica di prova tra `seconds` secondi e restituisce l'AUMID usato.
#[tauri::command]
pub fn schedule_test_notification(
    app: tauri::AppHandle,
    seconds: u32,
    mode: AppIdMode,
) -> Result<String, String> {
    let seconds = seconds.clamp(MIN_DELAY_SECONDS, MAX_DELAY_SECONDS);
    let aumid = match mode {
        AppIdMode::Installed => app.config().identifier.clone(),
        AppIdMode::Development => POWERSHELL_AUMID.to_string(),
    };
    let title = "NekoCalendar · prova promemoria";
    let body = format!(
        "Programmata {seconds} secondi fa. Se la vedi con l'app chiusa, il test è superato!"
    );

    platform::schedule(&aumid, title, &body, seconds)?;
    Ok(aumid)
}

/// Rende sicuro un testo da inserire nell'XML della notifica.
#[cfg_attr(not(windows), allow(dead_code))]
fn escape_xml(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    for ch in text.chars() {
        match ch {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&apos;"),
            other => out.push(other),
        }
    }
    out
}

/// Contenuto XML della notifica (modello "ToastGeneric" di Windows).
#[cfg_attr(not(windows), allow(dead_code))]
fn toast_xml(title: &str, body: &str) -> String {
    format!(
        "<toast><visual><binding template=\"ToastGeneric\"><text>{}</text><text>{}</text></binding></visual></toast>",
        escape_xml(title),
        escape_xml(body)
    )
}

#[cfg(windows)]
mod platform {
    use std::time::{SystemTime, UNIX_EPOCH};
    use windows::Data::Xml::Dom::XmlDocument;
    use windows::Foundation::DateTime;
    use windows::UI::Notifications::{ScheduledToastNotification, ToastNotificationManager};
    use windows::core::HSTRING;

    /// Differenza tra l'epoca di Windows (1601) e quella Unix (1970), in unità da 100 ns.
    const WINDOWS_TO_UNIX_EPOCH_100NS: i64 = 116_444_736_000_000_000;

    pub fn schedule(aumid: &str, title: &str, body: &str, seconds: u32) -> Result<(), String> {
        schedule_inner(aumid, title, body, seconds).map_err(|err| err.message())
    }

    fn schedule_inner(
        aumid: &str,
        title: &str,
        body: &str,
        seconds: u32,
    ) -> windows::core::Result<()> {
        let doc = XmlDocument::new()?;
        doc.LoadXml(&HSTRING::from(super::toast_xml(title, body)))?;

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default();
        let now_100ns = i64::try_from(now.as_nanos() / 100).unwrap_or(i64::MAX / 2);
        let when = DateTime {
            UniversalTime: WINDOWS_TO_UNIX_EPOCH_100NS
                + now_100ns
                + i64::from(seconds) * 10_000_000,
        };

        let toast = ScheduledToastNotification::CreateScheduledToastNotification(&doc, when)?;
        toast.SetTag(&HSTRING::from("m0-test"))?;
        toast.SetGroup(&HSTRING::from("nekocalendar-tests"))?;

        let notifier = ToastNotificationManager::CreateToastNotifierWithId(&HSTRING::from(aumid))?;
        notifier.AddToSchedule(&toast)?;
        Ok(())
    }
}

#[cfg(not(windows))]
mod platform {
    pub fn schedule(_aumid: &str, _title: &str, _body: &str, _seconds: u32) -> Result<(), String> {
        Err("Le notifiche programmate sono disponibili solo su Windows.".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn escape_xml_neutralizes_markup() {
        assert_eq!(
            escape_xml(r#"<b>"Tom" & 'Jerry'</b>"#),
            "&lt;b&gt;&quot;Tom&quot; &amp; &apos;Jerry&apos;&lt;/b&gt;"
        );
    }

    #[test]
    fn toast_xml_contains_escaped_texts() {
        let xml = toast_xml("Cena <3", "Da Gino & co.");
        assert!(xml.contains("<text>Cena &lt;3</text>"));
        assert!(xml.contains("<text>Da Gino &amp; co.</text>"));
        assert!(xml.starts_with("<toast>"));
    }
}
