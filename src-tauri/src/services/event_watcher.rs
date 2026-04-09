use crate::{docker::models::DockerEvent, state::AppState};
use bollard::system::EventsOptions;
use futures_util::StreamExt;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

/// Spawns a background task that streams Docker daemon events and emits them
/// to the frontend as `docker://event` Tauri events.
pub fn spawn(app: AppHandle, state: Arc<AppState>) {
    tauri::async_runtime::spawn(async move {
        loop {
            let docker = match state.docker.get().await {
                Ok(d) => d,
                Err(_) => {
                    // Daemon not ready yet — wait and retry
                    tokio::time::sleep(std::time::Duration::from_secs(3)).await;
                    continue;
                }
            };

            let opts = EventsOptions::<String>::default();
            let mut stream = docker.events(Some(opts));

            tracing::info!("Docker event watcher connected");

            loop {
                tokio::select! {
                    event = stream.next() => {
                        match event {
                            Some(Ok(ev)) => {
                                let actor_id = ev
                                    .actor
                                    .as_ref()
                                    .and_then(|a| a.id.clone())
                                    .unwrap_or_default();

                                let actor_name = ev
                                    .actor
                                    .as_ref()
                                    .and_then(|a| a.attributes.as_ref())
                                    .and_then(|attrs| attrs.get("name"))
                                    .cloned()
                                    .unwrap_or_default();

                                let attributes = ev
                                    .actor
                                    .as_ref()
                                    .and_then(|a| a.attributes.clone())
                                    .unwrap_or_default();

                                let payload = DockerEvent {
                                    event_type: ev
                                        .typ
                                        .map(|t| format!("{:?}", t).to_lowercase())
                                        .unwrap_or_default(),
                                    action: ev.action.unwrap_or_default(),
                                    actor_id,
                                    actor_name,
                                    time: ev.time.unwrap_or(0),
                                    attributes,
                                };

                                if let Err(e) = app.emit("docker://event", &payload) {
                                    tracing::warn!("Failed to emit docker event: {}", e);
                                }
                            }
                            Some(Err(e)) => {
                                tracing::warn!("Docker event stream error: {}", e);
                                break; // reconnect outer loop
                            }
                            None => {
                                tracing::info!("Docker event stream ended");
                                break;
                            }
                        }
                    }
                    _ = state.shutdown.notified() => {
                        tracing::info!("Event watcher shutting down");
                        return;
                    }
                }
            }

            // Stream ended or errored — wait before reconnecting
            tokio::time::sleep(std::time::Duration::from_secs(2)).await;
        }
    });
}
