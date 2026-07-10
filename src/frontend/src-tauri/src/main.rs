// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|_app| {
            #[cfg(all(debug_assertions, target_os = "macos"))]
            set_dock_icon();
            Ok(())
        })
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
