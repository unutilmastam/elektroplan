// ElektroPlan for Windows: the same offline-first app (static export in ../out) in a native window.
// Projects live in WebView2's IndexedDB under the user's AppData; sync goes to eplan.itcode.uz when online.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Url, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

/// Pages of the app itself (installed files, or the dev server).
fn is_app_url(url: &Url) -> bool {
    matches!(url.scheme(), "tauri" | "blob" | "data" | "about")
        || matches!(url.host_str(), Some("tauri.localhost") | Some("localhost"))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();
            WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
                .title("ElektroPlan")
                .inner_size(1280.0, 820.0)
                .min_inner_size(820.0, 560.0)
                .maximized(true)
                // links to Telegram, the website… open in the user's browser, not inside the app
                .on_navigation(move |url| {
                    if is_app_url(url) {
                        return true;
                    }
                    if matches!(url.scheme(), "http" | "https" | "mailto" | "tel") {
                        let _ = handle.opener().open_url(url.as_str(), None::<&str>);
                    }
                    false
                })
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("ElektroPlan could not start");
}
