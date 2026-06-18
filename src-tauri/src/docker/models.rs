use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ─── CONTAINER ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerSummary {
    pub id: String,
    pub short_id: String,
    pub name: String,
    pub image: String,
    pub status: ContainerStatus,
    pub state: String,
    pub ports: Vec<PortMapping>,
    pub cpu_percent: f64,
    pub memory_usage: u64,
    pub memory_limit: u64,
    pub memory_human: String,
    pub uptime: String,
    pub created: i64,
    pub labels: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ContainerStatus {
    Running,
    Stopped,
    Paused,
    Exited,
    Restarting,
    Dead,
    Created,
    Removing,
}

impl ContainerStatus {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "running" => Self::Running,
            "paused" => Self::Paused,
            "exited" => Self::Exited,
            "restarting" => Self::Restarting,
            "dead" => Self::Dead,
            "created" => Self::Created,
            "removing" => Self::Removing,
            _ => Self::Stopped,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortMapping {
    pub host_port: String,
    pub container_port: String,
    pub protocol: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerStats {
    pub id: String,
    pub cpu_percent: f64,
    pub memory_usage: u64,
    pub memory_limit: u64,
    pub memory_percent: f64,
    pub network_rx: u64,
    pub network_tx: u64,
    pub block_read: u64,
    pub block_write: u64,
    pub pids: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContainerInspect {
    pub id: String,
    pub name: String,
    pub image: String,
    pub image_id: String,
    pub status: ContainerStatus,
    pub created: String,
    pub started_at: String,
    pub finished_at: String,
    pub restart_count: u64,
    pub platform: String,
    pub environment: Vec<String>,
    pub cmd: Vec<String>,
    pub entrypoint: Vec<String>,
    pub working_dir: String,
    pub ports: Vec<PortMapping>,
    pub mounts: Vec<MountPoint>,
    pub networks: HashMap<String, NetworkEndpoint>,
    pub labels: HashMap<String, String>,
    pub hostname: String,
    pub ip_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MountPoint {
    pub source: String,
    pub destination: String,
    pub mode: String,
    pub rw: bool,
    pub mount_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkEndpoint {
    pub ip_address: String,
    pub gateway: String,
    pub mac_address: String,
}

// ─── RUN CONFIG ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunContainerOptions {
    pub image: String,
    pub name: Option<String>,
    pub ports: Vec<PortMapping>,
    pub env: Vec<String>,
    pub cmd: Option<Vec<String>>,
    pub volumes: Vec<String>,
    pub detach: bool,
    pub auto_remove: bool,
    pub restart_policy: RestartPolicy,
    pub network: Option<String>,
    pub labels: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RestartPolicy {
    No,
    Always,
    OnFailure,
    UnlessStopped,
}

impl RestartPolicy {
    pub fn as_str(&self) -> &str {
        match self {
            Self::No => "no",
            Self::Always => "always",
            Self::OnFailure => "on-failure",
            Self::UnlessStopped => "unless-stopped",
        }
    }
}

// ─── IMAGE ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImageSummary {
    pub id: String,
    pub short_id: String,
    pub repository: String,
    pub tag: String,
    pub digest: String,
    pub size: u64,
    pub size_human: String,
    pub created: i64,
    pub in_use: bool,
    pub architecture: String,
    pub os: String,
    pub labels: HashMap<String, String>,
    pub containers: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PullProgress {
    pub image: String,
    pub tag: String,
    pub status: String,
    pub progress: Option<String>,
    pub progress_detail: Option<ProgressDetail>,
    pub id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProgressDetail {
    pub current: Option<u64>,
    pub total: Option<u64>,
}

// ─── VOLUME ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VolumeSummary {
    pub name: String,
    pub driver: String,
    pub mountpoint: String,
    pub scope: String,
    pub created: String,
    pub labels: HashMap<String, String>,
    pub options: HashMap<String, String>,
    pub in_use: bool,
    pub containers: Vec<String>,
    pub size: Option<u64>,
    pub size_human: String,
}

// ─── NETWORK ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkSummary {
    pub id: String,
    pub short_id: String,
    pub name: String,
    pub driver: String,
    pub scope: String,
    pub subnet: String,
    pub gateway: String,
    pub ip_range: String,
    pub internal: bool,
    pub attachable: bool,
    pub created: String,
    pub labels: HashMap<String, String>,
    pub is_default: bool,
    pub containers: Vec<NetworkContainer>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkContainer {
    pub name: String,
    pub ip: String,
    pub mac_address: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNetworkOptions {
    pub name: String,
    pub driver: String,
    pub subnet: Option<String>,
    pub gateway: Option<String>,
    pub ip_range: Option<String>,
    pub internal: bool,
    pub attachable: bool,
    pub labels: HashMap<String, String>,
}

// ─── SYSTEM ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub docker_version: String,
    pub api_version: String,
    pub os: String,
    pub arch: String,
    pub total_memory: u64,
    pub cpu_count: u64,
    pub containers_running: u64,
    pub containers_stopped: u64,
    pub containers_paused: u64,
    pub images_count: u64,
    pub server_version: String,
    pub kernel_version: String,
    pub operating_system: String,
    pub storage_driver: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskUsage {
    pub containers_size: u64,
    pub images_size: u64,
    pub volumes_size: u64,
    pub build_cache_size: u64,
    pub total_size: u64,
}

// ─── EVENTS ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DockerEvent {
    pub event_type: String,
    pub action: String,
    pub actor_id: String,
    pub actor_name: String,
    pub time: i64,
    pub attributes: HashMap<String, String>,
}

// ─── LOG STREAM ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogLine {
    pub container_id: String,
    pub container_name: String,
    pub stream: LogStream,
    pub message: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogStream {
    Stdout,
    Stderr,
}
