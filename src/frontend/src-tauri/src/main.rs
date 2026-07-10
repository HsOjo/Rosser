// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rand::Rng;
use std::net::TcpListener;
use std::process::{Child, Command};
use std::sync::atomic::{AtomicBool, AtomicU16, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{Emitter, Manager};

/// Wraps a child process so it is killed when the wrapper is dropped.
struct KillOnDrop(Child);

impl Drop for KillOnDrop {
    fn drop(&mut self) {
        let _ = self.0.kill();
        let _ = self.0.wait();
    }
}

struct BackendHandle {
    child: Arc<Mutex<Option<KillOnDrop>>>,
    ready: Arc<Mutex<bool>>,
    port: AtomicU16,
    token: Mutex<String>,
    started: AtomicBool,
}

#[derive(Clone, serde::Serialize)]
struct BuiltinBackendConfig {
    port: u16,
    token: String,
}

#[tauri::command]
fn is_backend_ready(state: tauri::State<'_, BackendHandle>) -> bool {
    *state.ready.lock().unwrap()
}

#[tauri::command]
fn get_builtin_backend_config(state: tauri::State<'_, BackendHandle>) -> BuiltinBackendConfig {
    BuiltinBackendConfig {
        port: state.port.load(Ordering::Relaxed),
        token: state.token.lock().unwrap().clone(),
    }
}

/// Ask the OS for a free loopback port. The listener is dropped immediately so
/// the backend can bind to the same port.
fn pick_free_port() -> u16 {
    let listener = TcpListener::bind("127.0.0.1:0").expect("failed to bind to a free port");
    let port = listener.local_addr().unwrap().port();
    drop(listener);
    port
}

/// Generate a random bearer token for the built-in backend.
fn generate_token() -> String {
    let mut rng = rand::thread_rng();
    (0..32).map(|_| format!("{:02x}", rng.gen::<u8>())).collect()
}

#[tauri::command]
async fn start_builtin_backend(
    app: tauri::AppHandle,
    state: tauri::State<'_, BackendHandle>,
) -> Result<BuiltinBackendConfig, String> {
    // Ensure the backend is only started once.
    if state
        .started
        .compare_exchange(false, true, Ordering::Relaxed, Ordering::Relaxed)
        .is_err()
    {
        return Ok(BuiltinBackendConfig {
            port: state.port.load(Ordering::Relaxed),
            token: state.token.lock().unwrap().clone(),
        });
    }

    let backend_path = app
        .path()
        .resolve("backend/backend", tauri::path::BaseDirectory::Resource)
        .map_err(|e| e.to_string())?;
    let backend_path = if cfg!(windows) {
        backend_path.with_extension("exe")
    } else {
        backend_path
    };

    if !backend_path.exists() {
        return Err("Bundled backend not found".to_string());
    }

    let port = pick_free_port();
    let token = generate_token();

    state.port.store(port, Ordering::Relaxed);
    *state.token.lock().unwrap() = token.clone();

    let parent_pid = std::process::id();
    let child = Command::new(&backend_path)
        .env("ROSSER_PORT", port.to_string())
        .env("ROSSER_PARENT_PID", parent_pid.to_string())
        .env("ROSSER_TOKEN", &token)
        .spawn()
        .map_err(|e| e.to_string())?;

    state.child.lock().unwrap().replace(KillOnDrop(child));

    let app_handle = app.clone();
    let ready = state.ready.clone();
    std::thread::spawn(move || {
        let addr = format!("127.0.0.1:{}", port);
        for _ in 0..120 {
            if std::net::TcpStream::connect(&addr).is_ok() {
                *ready.lock().unwrap() = true;
                app_handle.emit("backend:ready", ()).ok();
                return;
            }
            std::thread::sleep(Duration::from_millis(500));
        }
        eprintln!("Backend failed to become ready on {}", addr);
    });

    Ok(BuiltinBackendConfig { port, token })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .manage(BackendHandle {
            child: Arc::new(Mutex::new(None)),
            ready: Arc::new(Mutex::new(false)),
            port: AtomicU16::new(0),
            token: Mutex::new(String::new()),
            started: AtomicBool::new(false),
        })
        .setup(|_app| {
            #[cfg(all(debug_assertions, target_os = "macos"))]
            set_dock_icon();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            is_backend_ready,
            get_builtin_backend_config,
            start_builtin_backend
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(all(debug_assertions, target_os = "macos"))]
fn set_dock_icon() {
    use objc2::ClassType;
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::NSData;

    let mtm = objc2_foundation::MainThreadMarker::new().expect("must be on main thread");

    let bytes = include_bytes!("../icons/icon.png");
    let data = NSData::with_bytes(bytes);
    let image = NSImage::initWithData(NSImage::alloc(), &data);

    let app = NSApplication::sharedApplication(mtm);
    unsafe {
        app.setApplicationIconImage(image.as_deref());
    }
}
