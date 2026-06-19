use crate::{docker::models::DockerEvent, services::backoff::ConnectionBackoff, state::AppState};
use bollard::system::EventsOptions;
use futures_util::StreamExt;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

/// Spawns a background task that streams Docker daemon events and emits them
/// to the frontend as `docker://event` Tauri events.
///
/// Uses exponential backoff (1s → 30s max) between reconnection attempts.
pub fn spawn(app: AppHandle, state: Arc<AppState>) {
    tauri::async_runtime::spawn(async move {
        let mut backoff = ConnectionBackoff::new();

        loop {
            let docker = match state.docker.get().await {
                Ok(d) => {
                    backoff.reset();
                    d
                }
                Err(_) => {
                    backoff.sleep().await;
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
                                break;
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

            backoff.sleep().await;
        }
    });
}
