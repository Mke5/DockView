pub mod api;
pub mod docker;
pub mod services;
pub mod state;

use state::AppState;
use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            tracing_subscriber::fmt()
                .with_env_filter(
                    tracing_subscriber::EnvFilter::try_from_default_env()
                        .unwrap_or_else(|_| "dock=info,warn".into()),
                )
                .init();

            let handle = app.handle().clone();
            let state = tauri::async_runtime::block_on(AppState::new());
            let state_arc = Arc::new(state);

            app.manage((*state_arc).clone());

            services::event_watcher::spawn(handle.clone(), state_arc.clone());
            services::stats_collector::spawn(handle.clone(), state_arc);

            // System tray
            let show = MenuItem::with_id(app, "show", "Show/Hide", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(move |app_handle, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app_handle.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    "quit" => {
                        app_handle.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            tracing::info!("Dock backend ready");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // System
            api::docker::docker_ping,
            api::docker::docker_reconnect,
            api::docker::docker_system_info,
            api::docker::docker_disk_usage,
            // Containers
            api::docker::list_containers,
            api::docker::inspect_container,
            api::docker::start_container,
            api::docker::stop_container,
            api::docker::restart_container,
            api::docker::pause_container,
            api::docker::unpause_container,
            api::docker::remove_container,
            api::docker::rename_container,
            api::docker::kill_container,
            api::docker::run_container,
            api::docker::get_container_stats,
            api::docker::get_container_logs,
            // Images
            api::docker::list_images,
            api::docker::inspect_image,
            api::docker::pull_image,
            api::docker::remove_image,
            api::docker::prune_images,
            // Volumes
            api::docker::list_volumes,
            api::docker::create_volume,
            api::docker::remove_volume,
            api::docker::prune_volumes,
            // Networks
            api::docker::list_networks,
            api::docker::create_network,
            api::docker::remove_network,
            api::docker::connect_container_to_network,
            api::docker::disconnect_container_from_network,
            // Streaming
            api::events::stream_container_logs,
            api::events::pull_image_stream,
            // Compose
            api::docker::compose_up,
            api::docker::compose_down,
            // Build & Push
            api::docker::image_build,
            api::docker::image_push,
            // Registry
            api::docker::registry_login,
            // Exec / Terminal
            api::exec::exec_session_start,
            api::exec::exec_session_write,
            api::exec::exec_session_resize,
            api::exec::exec_session_stop,
        ])
        .run(tauri::generate_context!())
        .expect("error while running dock");
}
