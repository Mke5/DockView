use anyhow::{Context, Result};
use bollard::Docker;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Wraps a Bollard `Docker` client with reconnect support.
/// The inner `Option<Docker>` is `None` while the daemon is unreachable.
#[derive(Clone)]
pub struct DockerClient {
    inner: Arc<RwLock<Option<Docker>>>,
}

impl DockerClient {
    /// Try to connect to the local Docker daemon using the default socket path.
    pub async fn new() -> Result<Self> {
        let docker = connect()?;
        // Ping to verify the connection is live
        docker
            .ping()
            .await
            .context("Docker daemon unreachable — is Docker running?")?;

        Ok(Self {
            inner: Arc::new(RwLock::new(Some(docker))),
        })
    }

    /// Create a client that starts disconnected (used in tests / offline mode).
    pub fn disconnected() -> Self {
        Self {
            inner: Arc::new(RwLock::new(None)),
        }
    }

    /// Get a reference to the inner `Docker` client, returning an error if
    /// the daemon is currently disconnected.
    pub async fn get(&self) -> Result<Docker> {
        let guard = self.inner.read().await;
        guard
            .clone()
            .ok_or_else(|| anyhow::anyhow!("Not connected to Docker daemon"))
    }

    /// Attempt to reconnect to the Docker daemon.
    pub async fn reconnect(&self) -> Result<()> {
        let docker = connect()?;
        docker
            .ping()
            .await
            .context("Docker daemon still unreachable")?;

        let mut guard = self.inner.write().await;
        *guard = Some(docker);
        tracing::info!("Reconnected to Docker daemon");
        Ok(())
    }

    /// Check whether we currently have a live connection.
    pub async fn is_connected(&self) -> bool {
        let guard = self.inner.read().await;
        if let Some(ref docker) = *guard {
            docker.ping().await.is_ok()
        } else {
            false
        }
    }

    /// Ping the daemon and update the connection state.
    pub async fn ping(&self) -> bool {
        if self.is_connected().await {
            return true;
        }
        // Try a fresh connection
        self.reconnect().await.is_ok()
    }
}

/// Build a Bollard `Docker` from environment / defaults.
/// On Linux/macOS this hits `unix:///var/run/docker.sock`.
/// On Windows it uses the named pipe.
fn connect() -> Result<Docker> {
    Docker::connect_with_local_defaults()
        .context("Failed to create Docker client — check that /var/run/docker.sock is accessible")
}

// ─── HELPER: bytes → human-readable size ─────────────────────────────────────

pub fn bytes_to_human(bytes: u64) -> String {
    const GB: u64 = 1_000_000_000;
    const MB: u64 = 1_000_000;
    const KB: u64 = 1_000;
    if bytes >= GB {
        format!("{:.1} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.0} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.0} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

/// Compute CPU % from two consecutive stats snapshots.
pub fn cpu_percent(cpu_delta: f64, system_delta: f64, num_cpus: f64) -> f64 {
    if system_delta > 0.0 && cpu_delta > 0.0 {
        (cpu_delta / system_delta) * num_cpus * 100.0
    } else {
        0.0
    }
}
