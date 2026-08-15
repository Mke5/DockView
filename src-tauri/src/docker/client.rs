use anyhow::{Context, Result};
use bollard::Docker;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Wraps a Bollard `Docker` client with reconnect support.
/// The inner `Option<Arc<Docker>>` uses double-indirection so
/// [`DockerClient::get`] returns an `Arc<Docker>` — a single atomic
/// reference increment — avoiding the cost of cloning the inner
/// `hyper::Client` connection pool on every operation.
#[derive(Clone)]
pub struct DockerClient {
    inner: Arc<RwLock<Option<Arc<Docker>>>>,
}

impl DockerClient {
    /// Try to connect to the local Docker daemon using the default socket path.
    pub async fn new() -> Result<Self> {
        let docker = Arc::new(connect()?);
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

    /// Get the inner `Docker` client, returning an error if
    /// the daemon is currently disconnected.
    ///
    /// The returned `Arc` is cheap to clone (one atomic increment).
    pub async fn get(&self) -> Result<Arc<Docker>> {
        let guard = self.inner.read().await;
        guard
            .as_ref()
            .cloned()
            .ok_or_else(|| crate::docker::error::DockerError::NotConnected.into())
    }

    /// Attempt to reconnect to the Docker daemon.
    pub async fn reconnect(&self) -> Result<()> {
        let docker = connect()?;
        docker
            .ping()
            .await
            .context("Docker daemon still unreachable")?;

        let mut guard = self.inner.write().await;
        *guard = Some(Arc::new(docker));
        tracing::info!("Reconnected to Docker daemon");
        Ok(())
    }

    /// Reconnect to a different Docker host (e.g. from the Settings view).
    /// Supports `unix://` paths and `tcp://`/`http(s)://` endpoints.
    pub async fn reconnect_to(&self, host: &str) -> Result<()> {
        let docker = connect_to(host)?;
        docker
            .ping()
            .await
            .with_context(|| format!("Docker daemon unreachable at {host}"))?;

        let mut guard = self.inner.write().await;
        *guard = Some(Arc::new(docker));
        tracing::info!("Reconnected to Docker daemon at {host}");
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
        self.reconnect().await.is_ok()
    }
}

/// Build a Bollard `Docker` from environment / defaults.
/// On Linux/macOS this hits `unix:///var/run/docker.sock`.
/// On Windows it uses the named pipe. Override with `DOCKER_HOST`.
fn connect() -> Result<Docker> {
    let host =
        std::env::var("DOCKER_HOST").unwrap_or_else(|_| "unix:///var/run/docker.sock".to_string());
    connect_to(&host).with_context(|| format!("Failed to create Docker client for {host}"))
}

/// Connect to a specific Docker endpoint: `unix:///path/to/socket` or a
/// `tcp://`/`http(s)://` URL. Bare paths are treated as unix sockets.
pub fn connect_to(host: &str) -> Result<Docker> {
    if let Some(path) = host.strip_prefix("unix://") {
        return Docker::connect_with_local(path, 120, bollard::API_DEFAULT_VERSION)
            .context("Failed to connect via unix socket");
    }

    let url = if let Some(rest) = host.strip_prefix("tcp://") {
        format!("http://{rest}")
    } else if host.starts_with("https://") {
        return Err(anyhow::anyhow!(
            "TLS endpoints are not supported yet — use tcp:// or a unix socket"
        ));
    } else if let Some(rest) = host.strip_prefix("http://") {
        rest.to_string()
    } else {
        // Assume a bare unix socket path
        return Docker::connect_with_local(host, 120, bollard::API_DEFAULT_VERSION)
            .context("Failed to connect via unix socket");
    };

    Docker::connect_with_http(&url, 120, bollard::API_DEFAULT_VERSION)
        .context("Failed to connect via tcp")
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
