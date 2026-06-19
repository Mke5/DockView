use crate::docker::client::DockerClient;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct ExecSession {
    pub child: Option<tokio::process::Child>,
    pub stdin: Option<tokio::process::ChildStdin>,
    pub container_id: String,
    pub shell: String,
    pub read_handles: Vec<tokio::task::JoinHandle<()>>,
}

/// Top-level application state injected into every Tauri command via
/// `tauri::State<AppState>`.
#[derive(Clone)]
pub struct AppState {
    pub docker: DockerClient,
    pub shutdown: Arc<tokio::sync::Notify>,
    pub connected: Arc<Mutex<bool>>,
    pub exec_sessions: Arc<Mutex<HashMap<String, ExecSession>>>,
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
            exec_sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn new_disconnected() -> Self {
        Self {
            docker: DockerClient::disconnected(),
            shutdown: Arc::new(tokio::sync::Notify::new()),
            connected: Arc::new(Mutex::new(false)),
            exec_sessions: Arc::new(Mutex::new(HashMap::new())),
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
