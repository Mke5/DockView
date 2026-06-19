use crate::{
    api::utils::{map_err, CmdResult, CommandError, OkResponse, PruneResult},
    docker::{
        client::bytes_to_human,
        containers::ContainerOps,
        context::DockerContext,
        images::ImageOps,
        models::{
            ContainerInspect, ContainerStats, ContainerSummary, CreateNetworkOptions, DiskUsage,
            ImageSummary, NetworkSummary, RunContainerOptions, SystemInfo, VolumeSummary,
        },
        networks::NetworkOps,
        volumes::VolumeOps,
    },
    state::AppState,
};
use std::collections::HashMap;
use tauri::State;

// ═══════════════════════════════════════════════════════════════════════════════
// SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

/// Ping the Docker daemon. Returns `true` if reachable.
#[tauri::command]
pub async fn docker_ping(state: State<'_, AppState>) -> CmdResult<bool> {
    Ok(state.docker.ping().await)
}

/// Try to reconnect after the daemon was offline.
#[tauri::command]
pub async fn docker_reconnect(state: State<'_, AppState>) -> CmdResult<bool> {
    Ok(state.reconnect().await)
}

/// Fetch overall Docker system info.
#[tauri::command]
pub async fn docker_system_info(state: State<'_, AppState>) -> CmdResult<SystemInfo> {
    let docker = state.docker.get().await.map_err(CommandError::from)?;
    let (info, version) = tokio::try_join!(
        docker.info(),
        docker.version(),
    )
    .map_err(|e| CommandError::new(e.to_string()))?;

    Ok(SystemInfo {
        docker_version: info.server_version.clone().unwrap_or_default(),
        api_version: version.api_version.unwrap_or_default(),
        os: info.operating_system.clone().unwrap_or_default(),
        arch: info.architecture.unwrap_or_default(),
        total_memory: info.mem_total.unwrap_or(0) as u64,
        cpu_count: info.ncpu.unwrap_or(0) as u64,
        containers_running: info.containers_running.unwrap_or(0) as u64,
        containers_stopped: info.containers_stopped.unwrap_or(0) as u64,
        containers_paused: info.containers_paused.unwrap_or(0) as u64,
        images_count: info.images.unwrap_or(0) as u64,
        server_version: info.server_version.unwrap_or_default(),
        kernel_version: info.kernel_version.unwrap_or_default(),
        operating_system: info.operating_system.unwrap_or_default(),
        storage_driver: info.driver.unwrap_or_default(),
    })
}

/// Fetch disk usage summary.
#[tauri::command]
pub async fn docker_disk_usage(state: State<'_, AppState>) -> CmdResult<DiskUsage> {
    let docker = state.docker.get().await.map_err(CommandError::from)?;
    let df = docker
        .df()
        .await
        .map_err(|e| CommandError::new(e.to_string()))?;

    let containers_size = df
        .containers
        .unwrap_or_default()
        .iter()
        .filter_map(|c| c.size_root_fs) // This is Option<i64>, keep filter_map
        .map(|s| s.max(0) as u64)
        .sum();

    let images_size = df
        .images
        .unwrap_or_default()
        .iter()
        .map(|i| i.size) // i.size is i64, not Option, so use map instead of filter_map
        .map(|s| s.max(0) as u64) // Convert i64 to u64 safely
        .sum();

    let volumes_size = df
        .volumes
        .unwrap_or_default()
        .iter()
        .filter_map(|v| v.usage_data.as_ref()) // This is Option<UsageData>
        .map(|u| u.size) // u.size is i64, not Option
        .map(|s| s.max(0) as u64) // Convert i64 to u64 safely
        .sum();

    let build_cache_size = df
        .build_cache
        .unwrap_or_default()
        .iter()
        .filter_map(|b| b.size) // Check if this is Option<i64> or i64
        .map(|s| s.max(0) as u64)
        .sum();

    let total = containers_size + images_size + volumes_size + build_cache_size;

    Ok(DiskUsage {
        containers_size,
        images_size,
        volumes_size,
        build_cache_size,
        total_size: total,
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTAINERS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn list_containers(
    all: Option<bool>,
    state: State<'_, AppState>,
) -> CmdResult<Vec<ContainerSummary>> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.list(all.unwrap_or(true)).await)
}

#[tauri::command]
pub async fn inspect_container(
    id: String,
    state: State<'_, AppState>,
) -> CmdResult<ContainerInspect> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.inspect(&id).await)
}

#[tauri::command]
pub async fn start_container(id: String, state: State<'_, AppState>) -> CmdResult<OkResponse> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.start(&id).await)?;
    Ok(OkResponse::with_message(format!(
        "Container {} started",
        id
    )))
}

#[tauri::command]
pub async fn stop_container(
    id: String,
    timeout: Option<i64>,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.stop(&id, timeout).await)?;
    Ok(OkResponse::with_message(format!(
        "Container {} stopped",
        id
    )))
}

#[tauri::command]
pub async fn restart_container(
    id: String,
    timeout: i64,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.restart(&id, timeout).await)?;
    Ok(OkResponse::with_message(format!(
        "Container {} restarted",
        id
    )))
}

#[tauri::command]
pub async fn pause_container(id: String, state: State<'_, AppState>) -> CmdResult<OkResponse> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.pause(&id).await)?;
    Ok(OkResponse::with_message(format!("Container {} paused", id)))
}

#[tauri::command]
pub async fn unpause_container(id: String, state: State<'_, AppState>) -> CmdResult<OkResponse> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.unpause(&id).await)?;
    Ok(OkResponse::with_message(format!(
        "Container {} unpaused",
        id
    )))
}

#[tauri::command]
pub async fn kill_container(
    id: String,
    signal: Option<String>,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.kill(&id, &signal.unwrap_or_else(|| "SIGKILL".into())).await)?;
    Ok(OkResponse::with_message(format!(
        "Container {} killed",
        id
    )))
}

#[tauri::command]
pub async fn remove_container(
    id: String,
    force: Option<bool>,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.remove(&id, force.unwrap_or(false)).await)?;
    Ok(OkResponse::with_message(format!(
        "Container {} removed",
        id
    )))
}

#[tauri::command]
pub async fn rename_container(
    id: String,
    new_name: String,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.rename(&id, &new_name).await)?;
    Ok(OkResponse::ok())
}

#[tauri::command]
pub async fn run_container(
    options: RunContainerOptions,
    state: State<'_, AppState>,
) -> CmdResult<String> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.run(options).await)
}

#[tauri::command]
pub async fn get_container_stats(
    id: String,
    state: State<'_, AppState>,
) -> CmdResult<ContainerStats> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.stats(&id).await)
}

#[tauri::command]
pub async fn get_container_logs(
    id: String,
    tail: Option<u64>,
    since: Option<i64>,
    state: State<'_, AppState>,
) -> CmdResult<Vec<crate::docker::models::LogLine>> {
    let ops = ContainerOps::new(&state.docker);
    map_err(ops.logs(&id, tail, since).await)
}

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGES
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn list_images(state: State<'_, AppState>) -> CmdResult<Vec<ImageSummary>> {
    let ops = ImageOps::new(&state.docker);
    map_err(ops.list().await)
}

#[tauri::command]
pub async fn inspect_image(id: String, state: State<'_, AppState>) -> CmdResult<ImageSummary> {
    let ops = ImageOps::new(&state.docker);
    map_err(ops.inspect(&id).await)
}

#[tauri::command]
pub async fn pull_image(
    image: String,
    tag: Option<String>,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = ImageOps::new(&state.docker);
    let t = tag.as_deref().unwrap_or("latest");
    map_err(ops.pull(&image, t, |_| {}).await)?;
    Ok(OkResponse::with_message(format!("Pulled {}:{}", image, t)))
}

#[tauri::command]
pub async fn remove_image(
    id: String,
    force: Option<bool>,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = ImageOps::new(&state.docker);
    map_err(ops.remove(&id, force.unwrap_or(false)).await)?;
    Ok(OkResponse::with_message(format!("Image {} removed", id)))
}

#[tauri::command]
pub async fn prune_images(state: State<'_, AppState>) -> CmdResult<PruneResult> {
    let ops = ImageOps::new(&state.docker);
    let (deleted, reclaimed) = map_err(ops.prune().await)?;
    Ok(PruneResult {
        deleted,
        reclaimed_bytes: reclaimed,
        reclaimed_human: bytes_to_human(reclaimed),
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOLUMES
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn list_volumes(state: State<'_, AppState>) -> CmdResult<Vec<VolumeSummary>> {
    let ops = VolumeOps::new(&state.docker);
    map_err(ops.list().await)
}

#[tauri::command]
pub async fn create_volume(
    name: String,
    driver: Option<String>,
    labels: Option<HashMap<String, String>>,
    driver_opts: Option<HashMap<String, String>>,
    state: State<'_, AppState>,
) -> CmdResult<VolumeSummary> {
    let ops = VolumeOps::new(&state.docker);
    map_err(
        ops.create(
            &name,
            driver.as_deref().unwrap_or("local"),
            labels.unwrap_or_default(),
            driver_opts.unwrap_or_default(),
        )
        .await,
    )
}

#[tauri::command]
pub async fn remove_volume(
    name: String,
    force: Option<bool>,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = VolumeOps::new(&state.docker);
    map_err(ops.remove(&name, force.unwrap_or(false)).await)?;
    Ok(OkResponse::with_message(format!("Volume {} removed", name)))
}

#[tauri::command]
pub async fn prune_volumes(state: State<'_, AppState>) -> CmdResult<PruneResult> {
    let ops = VolumeOps::new(&state.docker);
    let (deleted, reclaimed) = map_err(ops.prune().await)?;
    Ok(PruneResult {
        deleted,
        reclaimed_bytes: reclaimed,
        reclaimed_human: bytes_to_human(reclaimed),
    })
}

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORKS
// ═══════════════════════════════════════════════════════════════════════════════

#[tauri::command]
pub async fn list_networks(state: State<'_, AppState>) -> CmdResult<Vec<NetworkSummary>> {
    let ops = NetworkOps::new(&state.docker);
    map_err(ops.list().await)
}

#[tauri::command]
pub async fn create_network(
    options: CreateNetworkOptions,
    state: State<'_, AppState>,
) -> CmdResult<String> {
    let ops = NetworkOps::new(&state.docker);
    map_err(ops.create(options).await)
}

#[tauri::command]
pub async fn remove_network(id: String, state: State<'_, AppState>) -> CmdResult<OkResponse> {
    let ops = NetworkOps::new(&state.docker);
    map_err(ops.remove(&id).await)?;
    Ok(OkResponse::with_message(format!("Network {} removed", id)))
}

#[tauri::command]
pub async fn connect_container_to_network(
    network_id: String,
    container_id: String,
    ip: Option<String>,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = NetworkOps::new(&state.docker);
    map_err(ops.connect(&network_id, &container_id, ip).await)?;
    Ok(OkResponse::ok())
}

#[tauri::command]
pub async fn disconnect_container_from_network(
    network_id: String,
    container_id: String,
    state: State<'_, AppState>,
) -> CmdResult<OkResponse> {
    let ops = NetworkOps::new(&state.docker);
    map_err(ops.disconnect(&network_id, &container_id).await)?;
    Ok(OkResponse::ok())
}

// ─── COMPOSE ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn compose_up(
    project_dir: String,
) -> CmdResult<OkResponse> {
    use std::process::Command;
    let output = Command::new("docker")
        .args(["compose", "-f", &format!("{}/docker-compose.yml", project_dir), "up", "-d"])
        .output()
        .map_err(|e| CommandError::from(e))?;
    if output.status.success() {
        Ok(OkResponse { ok: true, message: Some("Stack started".into()) })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(stderr.into())
    }
}

#[tauri::command]
pub async fn compose_down(
    project_dir: String,
) -> CmdResult<OkResponse> {
    use std::process::Command;
    let output = Command::new("docker")
        .args(["compose", "-f", &format!("{}/docker-compose.yml", project_dir), "down"])
        .output()
        .map_err(|e| CommandError::new(format!("Failed to run compose down: {}", e)))?;
    if output.status.success() {
        Ok(OkResponse { ok: true, message: Some("Stack stopped".into()) })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(stderr.into())
    }
}

// ─── BUILD ────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn image_build(
    tag: String,
    dockerfile: String,
    context: String,
) -> CmdResult<OkResponse> {
    use std::process::Command;
    let output = Command::new("docker")
        .args(["build", "-t", &tag, "-f", &dockerfile, &context])
        .output()
        .map_err(|e| CommandError::new(format!("Failed to build image: {}", e)))?;
    if output.status.success() {
        Ok(OkResponse { ok: true, message: Some(format!("Built {}", tag)) })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(stderr.into())
    }
}

// ─── PUSH ─────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn image_push(
    image: String,
    destination: String,
) -> CmdResult<OkResponse> {
    use std::process::Command;
    // Tag if different
    if image != destination {
        let tag_output = Command::new("docker")
            .args(["tag", &image, &destination])
            .output()
            .map_err(|e| CommandError::new(format!("Failed to tag image: {}", e)))?;
        if !tag_output.status.success() {
            let stderr = String::from_utf8_lossy(&tag_output.stderr).to_string();
            return Err(stderr.into());
        }
    }
    let output = Command::new("docker")
        .args(["push", &destination])
        .output()
        .map_err(|e| CommandError::new(format!("Failed to push image: {}", e)))?;
    if output.status.success() {
        Ok(OkResponse { ok: true, message: Some(format!("Pushed {}", destination)) })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        Err(stderr.into())
    }
}

// ─── DOCKER CONTEXT ──────────────────────────────────────────────────────────

#[tauri::command]
pub async fn docker_context() -> CmdResult<DockerContext> {
    Ok(crate::docker::context::read_config().await)
}

// ─── REGISTRY CREDENTIALS (OS Keychain) ───────────────────────────────────────

#[tauri::command]
pub async fn registry_login(
    registry: String,
    username: String,
    password: String,
) -> CmdResult<OkResponse> {
    // Verify credentials by running docker login
    let verified = {
        use std::io::Write;
        use std::process::{Command, Stdio};
        let mut child = Command::new("docker")
            .args(["login", &registry, "-u", &username, "--password-stdin"])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| CommandError::new(format!("Failed to spawn docker login: {}", e)))?;
        if let Some(stdin) = child.stdin.as_mut() {
            let _ = stdin.write_all(password.as_bytes());
        }
        let output = child
            .wait_with_output()
            .map_err(|e| CommandError::new(format!("docker login failed: {}", e)))?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            return Err(CommandError::new(stderr));
        }
    };

    // Store in OS keychain
    crate::docker::credentials::save(&registry, &username, &password)
        .map_err(CommandError::new)?;

    Ok(OkResponse {
        ok: true,
        message: Some(format!("Logged in to {}", registry)),
    })
}

#[tauri::command]
pub async fn registry_logout(registry: String) -> CmdResult<OkResponse> {
    crate::docker::credentials::delete(&registry).map_err(CommandError::new)?;
    Ok(OkResponse {
        ok: true,
        message: Some(format!("Logged out of {}", registry)),
    })
}

#[tauri::command]
pub async fn registry_list_credentials() -> CmdResult<Vec<crate::docker::credentials::StoredCredential>> {
    // Read stored registries from Docker config
    let ctx = crate::docker::context::read_config().await;
    let creds = ctx
        .auths
        .into_iter()
        .filter_map(|r| {
            crate::docker::credentials::get(&r)
                .ok()
                .or_else(|| {
                    Some(crate::docker::credentials::StoredCredential {
                        username: String::new(),
                        registry: r,
                    })
                })
        })
        .collect();
    Ok(creds)
}
