use crate::{
    docker::{containers::ContainerOps, models::ContainerStats},
    state::AppState,
};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};

const POLL_INTERVAL_MS: u64 = 2_000;

/// Spawns a background task that polls stats for all running containers and
/// emits a `docker://stats` event to the frontend on every tick.
pub fn spawn(app: AppHandle, state: Arc<AppState>) {
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::select! {
                _ = tokio::time::sleep(std::time::Duration::from_millis(POLL_INTERVAL_MS)) => {}
                _ = state.shutdown.notified() => {
                    tracing::info!("Stats collector shutting down");
                    return;
                }
            }

            // Bail if Docker isn't reachable
            if !state.is_connected().await {
                continue;
            }

            let ops = ContainerOps::new(&state.docker);

            let containers = match ops.list(false).await {
                Ok(c) => c,
                Err(_) => continue,
            };

            // Collect stats concurrently with a cap of 10 parallel requests
            let semaphore = Arc::new(tokio::sync::Semaphore::new(10));
            let mut handles = Vec::new();

            for container in containers {
                let docker_client = state.docker.clone();
                let sem = semaphore.clone();
                let container_id = container.id.clone();

                handles.push(tokio::spawn(async move {
                    let _permit = sem.acquire().await.ok()?;
                    let ops = ContainerOps::new(&docker_client);
                    ops.stats(&container_id).await.ok()
                }));
            }

            let mut stats: Vec<ContainerStats> = Vec::new();
            for handle in handles {
                if let Ok(Some(s)) = handle.await {
                    stats.push(s);
                }
            }

            if !stats.is_empty() {
                if let Err(e) = app.emit("docker://stats", &stats) {
                    tracing::warn!("Failed to emit stats: {}", e);
                }
            }
        }
    });
}
