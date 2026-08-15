use crate::{
    api::utils::{CmdResult, CommandError},
    state::{AppState, ExecSession},
};
use bollard::container::LogOutput;
use bollard::exec::{CreateExecOptions, ResizeExecOptions, StartExecOptions, StartExecResults};
use futures_util::StreamExt;
use tauri::{Emitter, State};
use uuid::Uuid;

/// Start a shell session inside a container via bollard's exec API.
///
/// A pseudo-TTY is allocated inside the container (`tty: true`), so
/// interactive shells get a prompt, input echo, colors, and resize
/// support.  Output is streamed to the frontend via the `exec://output`
/// event.
#[tauri::command]
pub async fn exec_session_start(
    app: tauri::AppHandle,
    container_id: String,
    shell: String,
    state: State<'_, AppState>,
) -> CmdResult<String> {
    let docker = state.docker.get().await.map_err(CommandError::from)?;

    let created = docker
        .create_exec(
            &container_id,
            CreateExecOptions {
                attach_stdin: Some(true),
                attach_stdout: Some(true),
                attach_stderr: Some(true),
                tty: Some(true),
                cmd: Some(vec![shell.clone()]),
                ..Default::default()
            },
        )
        .await
        .map_err(|e| CommandError::new(format!("Failed to create exec: {e}")))?;

    let exec_id = created.id;

    let started = docker
        .start_exec(
            &exec_id,
            Some(StartExecOptions {
                detach: false,
                tty: true,
                ..Default::default()
            }),
        )
        .await
        .map_err(|e| CommandError::new(format!("Failed to start exec: {e}")))?;

    let (mut output, input) = match started {
        StartExecResults::Attached { output, input } => (output, input),
        StartExecResults::Detached => {
            return Err(CommandError::new("Exec session detached unexpectedly"));
        }
    };

    let session_id = Uuid::new_v4().to_string();

    // Forward exec output to the frontend. With a TTY the daemon sends a
    // single raw stream, which bollard surfaces as `LogOutput::Console`.
    let sid = session_id.clone();
    let app_clone = app.clone();
    let read_handle = tokio::spawn(async move {
        while let Some(chunk) = output.next().await {
            let payload = match chunk {
                Ok(LogOutput::StdOut { message }) => Some(("stdout", message)),
                Ok(LogOutput::StdErr { message }) => Some(("stderr", message)),
                Ok(LogOutput::Console { message }) => Some(("stdout", message)),
                Ok(LogOutput::StdIn { .. }) | Err(_) => None,
            };
            if let Some((stream, message)) = payload {
                let data = String::from_utf8_lossy(&message).to_string();
                let payload = serde_json::json!({
                    "sessionId": sid,
                    "stream": stream,
                    "data": data,
                });
                if app_clone.emit("exec://output", payload).is_err() {
                    break;
                }
            }
        }
    });

    let session = ExecSession {
        exec_id,
        input: Some(input),
        container_id: container_id.clone(),
        shell: shell.clone(),
        read_handles: vec![read_handle],
    };
    state
        .exec_sessions
        .lock()
        .await
        .insert(session_id.clone(), session);

    Ok(session_id)
}

/// Write raw bytes to the stdin of a running exec session.
#[tauri::command]
pub async fn exec_session_write(
    session_id: String,
    data: String,
    state: State<'_, AppState>,
) -> CmdResult<()> {
    use tokio::io::AsyncWriteExt;

    let mut sessions = state.exec_sessions.lock().await;
    let session = sessions
        .get_mut(&session_id)
        .ok_or_else(|| CommandError::new("Session not found"))?;

    if let Some(input) = session.input.as_mut() {
        input
            .write_all(data.as_bytes())
            .await
            .map_err(|e| CommandError::new(format!("stdin write error: {e}")))?;
    }

    Ok(())
}

/// Resize the pseudo-TTY of an exec session.
#[tauri::command]
pub async fn exec_session_resize(
    session_id: String,
    cols: u32,
    rows: u32,
    state: State<'_, AppState>,
) -> CmdResult<()> {
    let docker = state.docker.get().await.map_err(CommandError::from)?;

    let sessions = state.exec_sessions.lock().await;
    let session = sessions
        .get(&session_id)
        .ok_or_else(|| CommandError::new("Session not found"))?;

    docker
        .resize_exec(
            &session.exec_id,
            ResizeExecOptions {
                height: rows as u16,
                width: cols as u16,
            },
        )
        .await
        .map_err(|e| CommandError::new(format!("resize error: {e}")))?;

    Ok(())
}

/// Stop and remove an exec session.
#[tauri::command]
pub async fn exec_session_stop(session_id: String, state: State<'_, AppState>) -> CmdResult<()> {
    use tokio::io::AsyncWriteExt;

    let mut sessions = state.exec_sessions.lock().await;
    if let Some(mut session) = sessions.remove(&session_id) {
        // Ask the shell to exit, then abort the read task and close the
        // connection. Dropping `input` detaches the client; the TTY will
        // be torn down by the daemon.
        if let Some(input) = session.input.as_mut() {
            let _ = input.write_all(b"exit\r\n").await;
        }
        for handle in &session.read_handles {
            handle.abort();
        }
    }
    Ok(())
}
