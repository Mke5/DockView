pub mod api;
pub mod docker;
pub mod services;
pub mod state;

use state::AppState;
use std::sync::Arc;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Initialise tracing to stderr
            tracing_subscriber::fmt()
                .with_env_filter(
                    tracing_subscriber::EnvFilter::try_from_default_env()
                        .unwrap_or_else(|_| "dockview=info,warn".into()),
                )
                .init();

            let handle = app.handle().clone();

            // Build AppState; all heavy fields are Arc-wrapped so cloning is cheap
            let state = tauri::async_runtime::block_on(AppState::new());
            let state_arc = Arc::new(state);

            // Tauri owns a clone; our Arc keeps refs alive for background services
            app.manage((*state_arc).clone());

            // Spawn background services
            services::event_watcher::spawn(handle.clone(), state_arc.clone());
            services::stats_collector::spawn(handle, state_arc);

            tracing::info!("Dockview backend ready");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ── System ───────────────────────────────────────────────────────
            api::docker::docker_ping,
            api::docker::docker_reconnect,
            api::docker::docker_system_info,
            api::docker::docker_disk_usage,
            // ── Containers ───────────────────────────────────────────────────
            api::docker::list_containers,
            api::docker::inspect_container,
            api::docker::start_container,
            api::docker::stop_container,
            api::docker::restart_container,
            api::docker::pause_container,
            api::docker::unpause_container,
            api::docker::remove_container,
            api::docker::rename_container,
            api::docker::run_container,
            api::docker::get_container_stats,
            api::docker::get_container_logs,
            // ── Images ───────────────────────────────────────────────────────
            api::docker::list_images,
            api::docker::inspect_image,
            api::docker::pull_image,
            api::docker::remove_image,
            api::docker::prune_images,
            // ── Volumes ──────────────────────────────────────────────────────
            api::docker::list_volumes,
            api::docker::create_volume,
            api::docker::remove_volume,
            api::docker::prune_volumes,
            // ── Networks ─────────────────────────────────────────────────────
            api::docker::list_networks,
            api::docker::create_network,
            api::docker::remove_network,
            api::docker::connect_container_to_network,
            api::docker::disconnect_container_from_network,
            // ── Streaming ────────────────────────────────────────────────────
            api::events::stream_container_logs,
            api::events::pull_image_stream,
        ])
        .run(tauri::generate_context!())
        .expect("error while running dockview");
}
