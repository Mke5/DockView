use crate::docker::client::DockerClient;
use std::sync::Arc;
use tokio::sync::Mutex;

/// Top-level application state injected into every Tauri command via
/// `tauri::State<AppState>`.
///
/// All fields are `Arc`-wrapped so the struct is cheaply `Clone`able —
/// Tauri requires managed state to be `Send + Sync + 'static`.
#[derive(Clone)]
pub struct AppState {
    pub docker: DockerClient,
    pub shutdown: Arc<tokio::sync::Notify>,
    pub connected: Arc<Mutex<bool>>,
}

impl AppState {
    pub async fn new() -> Self {
        let (docker, connected) = match DockerClient::new().await {
            Ok(client) => {
                tracing::info!("Connected to Docker daemon");
                (client, true)
            }
            Err(e) => {
                tracing::warn!("Docker daemon not reachable at startup: {}", e);
                (DockerClient::disconnected(), false)
            }
        };

        Self {
            docker,
            shutdown: Arc::new(tokio::sync::Notify::new()),
            connected: Arc::new(Mutex::new(connected)),
        }
    }

    pub async fn is_connected(&self) -> bool {
        *self.connected.lock().await
    }

    pub async fn reconnect(&self) -> bool {
        let ok = self.docker.reconnect().await.is_ok();
        *self.connected.lock().await = ok;
        if ok {
            tracing::info!("Reconnected to Docker daemon");
        }
        ok
    }
}
