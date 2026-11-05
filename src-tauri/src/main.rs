// ElektroPlan for Windows: the same offline-first app (static export in ../out) in a native window.
// Projects live in WebView2's IndexedDB under the user's AppData; sync goes to eplan.itcode.uz when online.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Url, WebviewUrl, WebviewWindow, WebviewWindowBuilder};
use tauri_plugin_opener::OpenerExt;

/// Interface size ("Interfeys o'lchami"): WebView zoom, like Ctrl − in a browser. The layout was made for
/// an iPad; on a Windows screen 80 % looks like a normal desktop program.
const DEFAULT_UI_SCALE: f64 = 0.8;

fn scale_file(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|d| d.join("ui-scale.txt"))
}

fn saved_scale(app: &AppHandle) -> f64 {
    scale_file(app)
        .and_then(|f| fs::read_to_string(f).ok())
        .and_then(|s| s.trim().parse::<f64>().ok())
        .filter(|s| (0.5..=1.5).contains(s))
        .unwrap_or(DEFAULT_UI_SCALE)
}

#[tauri::command]
fn get_ui_scale(app: AppHandle) -> f64 {
    saved_scale(&app)
}

#[tauri::command]
fn set_ui_scale(app: AppHandle, window: WebviewWindow, scale: f64) -> Result<f64, String> {
    let s = scale.clamp(0.5, 1.5);
    window.set_zoom(s).map_err(|e| e.to_string())?;
    if let Some(f) = scale_file(&app) {
        if let Some(dir) = f.parent() {
            let _ = fs::create_dir_all(dir);
        }
        let _ = fs::write(f, s.to_string());
    }
    Ok(s)
}

/// Pages of the app itself (installed files, or the dev server).
fn is_app_url(url: &Url) -> bool {
    matches!(url.scheme(), "tauri" | "blob" | "data" | "about")
        || matches!(url.host_str(), Some("tauri.localhost") | Some("localhost"))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_ui_scale, set_ui_scale])
        .setup(|app| {
            let handle = app.handle().clone();
            let window = WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
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
            let _ = window.set_zoom(saved_scale(app.handle()));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("ElektroPlan could not start");
}
