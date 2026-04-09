use serde::{Deserialize, Serialize};

/// Snapshot of the Docker daemon connection state emitted to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DockerConnectionState {
    pub connected: bool,
    pub socket_path: String,
    pub api_version: Option<String>,
    pub server_version: Option<String>,
    pub last_ping_ms: Option<u64>,
    pub error: Option<String>,
}

impl DockerConnectionState {
    pub fn connected(api_version: String, server_version: String, ping_ms: u64) -> Self {
        Self {
            connected: true,
            socket_path: default_socket(),
            api_version: Some(api_version),
            server_version: Some(server_version),
            last_ping_ms: Some(ping_ms),
            error: None,
        }
    }

    pub fn disconnected(error: String) -> Self {
        Self {
            connected: false,
            socket_path: default_socket(),
            api_version: None,
            server_version: None,
            last_ping_ms: None,
            error: Some(error),
        }
    }
}

fn default_socket() -> String {
    if cfg!(target_os = "windows") {
        "npipe:////./pipe/docker_engine".into()
    } else {
        "unix:///var/run/docker.sock".into()
    }
}
