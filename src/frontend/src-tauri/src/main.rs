// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize)]
struct BackendConfig {
    base_url: String,
    token: String,
}

#[tauri::command]
fn get_backend_config() -> BackendConfig {
    BackendConfig {
        base_url: String::new(),
        token: String::new(),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![get_backend_config])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
