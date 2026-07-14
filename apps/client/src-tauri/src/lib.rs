#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    // Windows and Linux deliver protocol callbacks to a second process. Keep a
    // single process so the original in-memory session receives the deep link.
    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {
            // The deep-link feature forwards validated scheme arguments to
            // tauri-plugin-deep-link; authentication is handled in the UI.
        }));
    }

    builder
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_secure_storage::init())
        .setup(|app| {
            // Static registration is available after install. Registering in
            // development also makes the desktop callback testable on Linux
            // and debug Windows builds.
            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running the TACHYON application");
}
