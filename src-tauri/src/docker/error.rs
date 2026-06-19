use thiserror::Error;

#[derive(Debug, Error)]
pub enum DockerError {
    #[error("Docker daemon unreachable: {0}")]
    DaemonUnreachable(String),

    #[error("Container operation failed: {0}")]
    Container(String, #[source] anyhow::Error),

    #[error("Image operation failed: {0}")]
    Image(String, #[source] anyhow::Error),

    #[error("Volume operation failed: {0}")]
    Volume(String, #[source] anyhow::Error),

    #[error("Network operation failed: {0}")]
    Network(String, #[source] anyhow::Error),

    #[error("Prune failed: {0}")]
    Prune(String, #[source] anyhow::Error),

    #[error("Not connected to Docker daemon")]
    NotConnected,

    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl DockerError {
    pub fn container<S: Into<String>, M: std::fmt::Display>(op: S, msg: M) -> Self {
        Self::Container(op.into(), anyhow::anyhow!("{}", msg))
    }
    pub fn image<S: Into<String>, M: std::fmt::Display>(op: S, msg: M) -> Self {
        Self::Image(op.into(), anyhow::anyhow!("{}", msg))
    }
    pub fn volume<S: Into<String>, M: std::fmt::Display>(op: S, msg: M) -> Self {
        Self::Volume(op.into(), anyhow::anyhow!("{}", msg))
    }
    pub fn network<S: Into<String>, M: std::fmt::Display>(op: S, msg: M) -> Self {
        Self::Network(op.into(), anyhow::anyhow!("{}", msg))
    }
    pub fn prune<S: Into<String>, M: std::fmt::Display>(op: S, msg: M) -> Self {
        Self::Prune(op.into(), anyhow::anyhow!("{}", msg))
    }
}

