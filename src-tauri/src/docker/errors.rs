use thiserror::Error;

#[derive(Debug, Error)]
pub enum DockerError {
    #[error("Docker daemon unreachable: {0}")]
    DaemonUnreachable(String),

    #[error("Container not found: {0}")]
    ContainerNotFound(String),

    #[error("Image not found: {0}")]
    ImageNotFound(String),

    #[error("Volume not found: {0}")]
    VolumeNotFound(String),

    #[error("Network not found: {0}")]
    NetworkNotFound(String),

    #[error("Operation not permitted: {0}")]
    PermissionDenied(String),

    #[error("Container is already running: {0}")]
    AlreadyRunning(String),

    #[error("Container is not running: {0}")]
    NotRunning(String),

    #[error("Image pull failed for {image}:{tag}: {reason}")]
    PullFailed {
        image: String,
        tag: String,
        reason: String,
    },

    #[error("Build failed: {0}")]
    BuildFailed(String),

    #[error("Bollard error: {0}")]
    Bollard(#[from] bollard::errors::Error),

    #[error("Unexpected error: {0}")]
    Other(#[from] anyhow::Error),
}

impl DockerError {
    /// Map a bollard error to a more descriptive `DockerError`.
    pub fn from_bollard(e: bollard::errors::Error, context: &str) -> Self {
        let msg = e.to_string();
        if msg.contains("No such container") {
            Self::ContainerNotFound(context.to_string())
        } else if msg.contains("No such image") {
            Self::ImageNotFound(context.to_string())
        } else if msg.contains("permission denied") || msg.contains("connect: permission denied") {
            Self::PermissionDenied(msg)
        } else if msg.contains("Is the docker daemon running") || msg.contains("Connection refused")
        {
            Self::DaemonUnreachable(msg)
        } else {
            Self::Bollard(e)
        }
    }
}
