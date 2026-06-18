use crate::docker::models::bollard_stats_to_container_stats;
use crate::state::AppState;
use bollard::container::StatsOptions;
use futures_util::StreamExt;
use std::{
    collections::HashMap,
    sync::Arc,
    time::Duration,
};
use tauri::{AppHandle, Emitter};

const BATCH_INTERVAL: Duration = Duration::from_secs(2);
const RECONCILE_INTERVAL: Duration = Duration::from_secs(5);

/// Spawns a background task that subscribes to per-container streaming stats
/// and emits a `docker://stats` event every 2 seconds.
///
/// This replaces the old polling approach — instead of one-shot stats calls
/// every 2 seconds per container we maintain one persistent stream per
/// running container.  For 100+ containers this reduces daemon load from
/// 50 queries/second to effectively zero incremental queries (streams push
/// data as the kernel produces it).
pub fn spawn(app: AppHandle, state: Arc<AppState>) {
    tauri::async_runtime::spawn(async move {
        let (stats_tx, mut stats_rx) =
            tokio::sync::mpsc::unbounded_channel::<(String, crate::docker::models::ContainerStats)>();
        let mut stream_handles: HashMap<String, tokio::task::JoinHandle<()>> = HashMap::new();
        let mut latest: HashMap<String, crate::docker::models::ContainerStats> = HashMap::new();

        let mut reconcile = tokio::time::interval(RECONCILE_INTERVAL);
        let mut batch = tokio::time::interval(BATCH_INTERVAL);

        loop {
            tokio::select! {
                _ = state.shutdown.notified() => {
                    tracing::info!("Stats collector shutting down");
                    return;
                }
                _ = reconcile.tick() => {
                    reconcile_containers(&state, &stats_tx, &mut stream_handles).await;
                }
                Some((id, s)) = stats_rx.recv() => {
                    latest.insert(id, s);
                }
                _ = batch.tick() => {
                    if !latest.is_empty() {
                        let batch: Vec<_> = latest.values().cloned().collect();
                        if let Err(e) = app.emit("docker://stats", &batch) {
                            tracing::warn!("Failed to emit stats: {}", e);
                        }
                    }
                }
            }
        }
    });
}

async fn reconcile_containers(
    state: &Arc<AppState>,
    tx: &tokio::sync::mpsc::UnboundedSender<(String, crate::docker::models::ContainerStats)>,
    handles: &mut HashMap<String, tokio::task::JoinHandle<()>>,
) {
    if !state.is_connected().await {
        return;
    }

    let docker = match state.docker.get().await {
        Ok(d) => d,
        Err(_) => return,
    };

    let ops = crate::docker::containers::ContainerOps::new(&state.docker);
    let containers = match ops.list(false).await {
        Ok(c) => c,
        Err(_) => return,
    };

    let running: std::collections::HashSet<String> = containers
        .into_iter()
        .filter(|c| c.status == crate::docker::models::ContainerStatus::Running)
        .map(|c| c.id)
        .collect();

    // Tear down streams for containers that are no longer running
    handles.retain(|id, handle| {
        if !running.contains(id) {
            handle.abort();
            false
        } else {
            true
        }
    });

    // Start new streams for newly-running containers
    for id in &running {
        if !handles.contains_key(id) {
            let cid = id.clone();
            let d = docker.clone();
            let tx = tx.clone();
            let handle = tokio::spawn(async move {
                stream_container_stats(&d, &cid, &tx).await;
            });
            handles.insert(id.clone(), handle);
        }
    }
}

async fn stream_container_stats(
    docker: &bollard::Docker,
    container_id: &str,
    tx: &tokio::sync::mpsc::UnboundedSender<(String, crate::docker::models::ContainerStats)>,
) {
    let mut stream = docker.stats(
        container_id,
        Some(StatsOptions {
            stream: true,
            one_shot: false,
        }),
    );

    while let Some(item) = stream.next().await {
        match item {
            Ok(raw) => {
                let stats = bollard_stats_to_container_stats(container_id, &raw);
                if tx.send((container_id.to_string(), stats)).is_err() {
                    break;
                }
            }
            Err(e) => {
                tracing::debug!("Stats stream error for {}: {}", container_id, e);
                break;
            }
        }
    }
}
