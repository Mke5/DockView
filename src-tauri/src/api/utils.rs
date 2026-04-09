use serde::{Deserialize, Serialize};

/// Every Tauri command returns `Result<T, CommandError>`.
/// `CommandError` serialises to a plain string so the frontend can display it.
#[derive(Debug, Serialize, Deserialize)]
pub struct CommandError {
    pub message: String,
    pub code: Option<String>,
}

impl CommandError {
    pub fn new(msg: impl ToString) -> Self {
        Self {
            message: msg.to_string(),
            code: None,
        }
    }

    pub fn with_code(msg: impl ToString, code: impl ToString) -> Self {
        Self {
            message: msg.to_string(),
            code: Some(code.to_string()),
        }
    }
}

impl From<anyhow::Error> for CommandError {
    fn from(e: anyhow::Error) -> Self {
        Self::new(e.to_string())
    }
}

impl std::fmt::Display for CommandError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

/// Convenience alias used in every command signature.
pub type CmdResult<T> = Result<T, CommandError>;

/// Wrap an `anyhow::Result` into a `CmdResult`.
pub fn map_err<T>(r: anyhow::Result<T>) -> CmdResult<T> {
    r.map_err(CommandError::from)
}

/// Generic success/count response.
#[derive(Debug, Serialize, Deserialize)]
pub struct OkResponse {
    pub ok: bool,
    pub message: Option<String>,
}

impl OkResponse {
    pub fn ok() -> Self {
        Self {
            ok: true,
            message: None,
        }
    }

    pub fn with_message(msg: impl ToString) -> Self {
        Self {
            ok: true,
            message: Some(msg.to_string()),
        }
    }
}

/// Prune result returned to the frontend.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PruneResult {
    pub deleted: Vec<String>,
    pub reclaimed_bytes: u64,
    pub reclaimed_human: String,
}
