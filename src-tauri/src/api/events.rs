use crate::{
    api::utils::{CmdResult, CommandError},
    state::AppState,
};
use bollard::container::{InspectContainerOptions, LogsOptions};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use tauri::{ipc::Channel, State};

/// Payload sent to the frontend for each log chunk.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LogChunk {
    pub container_id: String,
    pub container_name: String,
    pub stream: String, // "stdout" | "stderr"
    pub message: String,
    pub timestamp: String,
}

/// Stream container logs line-by-line over a Tauri `Channel`.
/// The channel is a typed one-way pipe from Rust → frontend.
///
/// Call from TypeScript:
/// ```ts
/// const channel = new Channel<LogChunk>();
/// channel.onmessage = (chunk) => { ... };
/// await invoke('stream_container_logs', { id, tail: 200, channel });
/// ```
#[tauri::command]
pub async fn stream_container_logs(
    id: String,
    tail: Option<u64>,
    follow: Option<bool>,
    channel: Channel<LogChunk>,
    state: State<'_, AppState>,
) -> CmdResult<()> {
    let docker = state.docker.get().await.map_err(CommandError::from)?;

    // Resolve container name
    let inspect = docker
        .inspect_container(&id, None::<InspectContainerOptions>)
        .await
        .map_err(|e| CommandError::new(e.to_string()))?;

    let container_name = inspect
        .name
        .unwrap_or_else(|| id.clone())
        .trim_start_matches('/')
        .to_string();

    let opts = LogsOptions::<String> {
        stdout: true,
        stderr: true,
        follow: follow.unwrap_or(true),
        timestamps: true,
        tail: tail.map(|t| t.to_string()).unwrap_or_else(|| "200".into()),
        ..Default::default()
    };

    let mut stream = docker.logs(&id, Some(opts));

    while let Some(chunk) = stream.next().await {
        use bollard::container::LogOutput;
        match chunk {
            Ok(LogOutput::StdOut { message }) => {
                let text = String::from_utf8_lossy(&message).to_string();
                for line in text.lines() {
                    if line.is_empty() {
                        continue;
                    }
                    let (timestamp, message) = split_ts(line);
                    let chunk = LogChunk {
                        container_id: id.clone(),
                        container_name: container_name.clone(),
                        stream: "stdout".into(),
                        message,
                        timestamp,
                    };
                    if channel.send(chunk).is_err() {
                        // Frontend closed the channel
                        return Ok(());
                    }
                }
            }
            Ok(LogOutput::StdErr { message }) => {
                let text = String::from_utf8_lossy(&message).to_string();
                for line in text.lines() {
                    if line.is_empty() {
                        continue;
                    }
                    let (timestamp, message) = split_ts(line);
                    let chunk = LogChunk {
                        container_id: id.clone(),
                        container_name: container_name.clone(),
                        stream: "stderr".into(),
                        message,
                        timestamp,
                    };
                    if channel.send(chunk).is_err() {
                        // Frontend closed the channel
                        return Ok(());
                    }
                }
            }
            Ok(_) => {}
            Err(e) => return Err(CommandError::new(e.to_string())),
        }
    }

    Ok(())
}

/// Pull an image with streaming progress events.
///
/// Emits `PullProgress` objects over a `Channel` so the frontend can show
/// a live progress bar.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PullProgressChunk {
    pub image: String,
    pub tag: String,
    pub status: String,
    pub progress: Option<String>,
    pub current: Option<u64>,
    pub total: Option<u64>,
    pub layer_id: Option<String>,
    pub done: bool,
}

#[tauri::command]
pub async fn pull_image_stream(
    image: String,
    tag: Option<String>,
    channel: Channel<PullProgressChunk>,
    state: State<'_, AppState>,
) -> CmdResult<()> {
    let docker = state.docker.get().await.map_err(CommandError::from)?;
    let tag = tag.unwrap_or_else(|| "latest".into());

    let opts = bollard::image::CreateImageOptions {
        from_image: image.as_str(),
        tag: tag.as_str(),
        ..Default::default()
    };

    let mut stream = docker.create_image(Some(opts), None, None);

    while let Some(event) = stream.next().await {
        match event {
            Ok(info) => {
                let current = info
                    .progress_detail
                    .as_ref()
                    .and_then(|pd| pd.current)
                    .map(|c| c as u64);
                let total = info
                    .progress_detail
                    .as_ref()
                    .and_then(|pd| pd.total)
                    .map(|t| t as u64);

                let chunk = PullProgressChunk {
                    image: image.clone(),
                    tag: tag.clone(),
                    status: info.status.unwrap_or_default(),
                    progress: info.progress,
                    current,
                    total,
                    layer_id: info.id,
                    done: false,
                };
                if channel.send(chunk).is_err() {
                    return Ok(());
                }
            }
            Err(e) => return Err(CommandError::new(e.to_string())),
        }
    }

    // Send a final "done" marker
    let _ = channel.send(PullProgressChunk {
        image: image.clone(),
        tag: tag.clone(),
        status: "Pull complete".into(),
        progress: None,
        current: None,
        total: None,
        layer_id: None,
        done: true,
    });

    Ok(())
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

fn split_ts(line: &str) -> (String, String) {
    let trimmed = line.trim();
    if let Some(pos) = trimmed.find(' ') {
        let ts = &trimmed[..pos];
        let msg = &trimmed[pos + 1..];
        if ts.contains('T') && (ts.ends_with('Z') || ts.contains('+')) {
            return (ts.to_string(), msg.to_string());
        }
    }
    (String::new(), trimmed.to_string())
}
