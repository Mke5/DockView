use crate::{
    api::utils::{CmdResult, CommandError},
    state::ExecSession,
    state::AppState,
};
use tauri::State;
use uuid::Uuid;

/// Start a shell session inside a container via `docker exec -i`.
///
/// Returns a session id that the frontend uses for subsequent `exec_write`
/// and `exec_stop` calls.  Output is streamed to the frontend via the
/// `exec://output` event.
#[tauri::command]
pub async fn exec_session_start(
    app: tauri::AppHandle,
    container_id: String,
    shell: String,
    state: State<'_, AppState>,
) -> CmdResult<String> {
    use tokio::io::AsyncReadExt;

    let session_id = Uuid::new_v4().to_string();

    let mut child = tokio::process::Command::new("docker")
        .args(["exec", "-i", &container_id, &shell])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| CommandError::new(format!("Failed to spawn docker exec: {e}")))?;

    let stdin = child.stdin.take();
    let mut stdout = child
        .stdout
        .take()
        .ok_or_else(|| CommandError::new("No stdout on exec child"))?;
    let mut stderr = child
        .stderr
        .take()
        .ok_or_else(|| CommandError::new("No stderr on exec child"))?;

    // Spawn a task that reads stdout and fires events
    let sid = session_id.clone();
    let app_clone = app.clone();
    tokio::spawn(async move {
        let mut buf = vec![0u8; 4096];
        loop {
            match stdout.read(&mut buf).await {
                Ok(0) => break,
                Ok(n) => {
                    let payload = serde_json::json!({
                        "sessionId": sid,
                        "stream": "stdout",
                        "data": String::from_utf8_lossy(&buf[..n]),
                    });
                    let _ = app_clone.emit("exec://output", payload);
                }
                Err(_) => break,
            }
        }
    });

    // Spawn a task that reads stderr and fires events
    let sid = session_id.clone();
    let app_clone2 = app.clone();
    tokio::spawn(async move {
        let mut buf = vec![0u8; 4096];
        loop {
            match stderr.read(&mut buf).await {
                Ok(0) => break,
                Ok(n) => {
                    let payload = serde_json::json!({
                        "sessionId": sid,
                        "stream": "stderr",
                        "data": String::from_utf8_lossy(&buf[..n]),
                    });
                    let _ = app_clone2.emit("exec://output", payload);
                }
                Err(_) => break,
            }
        }
    });

    // Store session
    let session = ExecSession {
        child: Some(child),
        stdin,
        container_id: container_id.clone(),
        shell: shell.clone(),
    };
    state.exec_sessions.lock().await.insert(session_id.clone(), session);

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

    if let Some(stdin) = session.stdin.as_mut() {
        stdin
            .write_all(data.as_bytes())
            .await
            .map_err(|e| CommandError::new(format!("stdin write error: {e}")))?;
    }

    Ok(())
}

/// Resize the terminal (send SIGWINCH / set cols/rows) inside the exec session.
#[tauri::command]
pub async fn exec_session_resize(
    session_id: String,
    cols: u32,
    rows: u32,
    state: State<'_, AppState>,
) -> CmdResult<()> {
    let sessions = state.exec_sessions.lock().await;
    let session = sessions
        .get(&session_id)
        .ok_or_else(|| CommandError::new("Session not found"))?;

    // Use `resize` command inside the container to update terminal size
    tokio::process::Command::new("docker")
        .args([
            "exec",
            &session.container_id,
            "resize",
            "-s",
            &rows.to_string(),
            &cols.to_string(),
        ])
        .output()
        .await
        .map_err(|e| CommandError::new(format!("resize error: {e}")))?;

    Ok(())
}

/// Stop and remove an exec session.
#[tauri::command]
pub async fn exec_session_stop(
    session_id: String,
    state: State<'_, AppState>,
) -> CmdResult<()> {
    let mut sessions = state.exec_sessions.lock().await;
    if let Some(mut session) = sessions.remove(&session_id) {
        if let Some(ref mut child) = session.child {
            let _ = child.kill().await;
            let _ = child.wait().await;
        }
    }
    Ok(())
}
