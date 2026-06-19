use anyhow::{Context, Result};
use bollard::{
    container::{
        Config, CreateContainerOptions, InspectContainerOptions, KillContainerOptions,
        ListContainersOptions, LogOutput, LogsOptions, RemoveContainerOptions,
        RenameContainerOptions, RestartContainerOptions, StartContainerOptions, StatsOptions,
        StopContainerOptions,
    },
    models::{HostConfig, PortBinding, RestartPolicy as BollardRestartPolicy},
};
use futures_util::StreamExt;
use std::collections::HashMap;

use crate::docker::{
    client::DockerClient,
    models::{
        bollard_stats_to_container_stats, ContainerInspect, ContainerStats, ContainerStatus,
        ContainerSummary, LogLine, LogStream, MountPoint, NetworkEndpoint, PortMapping,
        RunContainerOptions,
    },
};

pub struct ContainerOps<'a> {
    client: &'a DockerClient,
}

impl<'a> ContainerOps<'a> {
    pub fn new(client: &'a DockerClient) -> Self {
        Self { client }
    }

    // ─── LIST ─────────────────────────────────────────────────────────────────

    pub async fn list(&self, all: bool) -> Result<Vec<ContainerSummary>> {
        let docker = self.client.get().await?;
        let opts = ListContainersOptions::<String> {
            all,
            ..Default::default()
        };
        let raw = docker
            .list_containers(Some(opts))
            .await
            .context("Failed to list containers")?;

        let summaries = raw
            .into_iter()
            .map(|c| {
                let id = c.id.unwrap_or_default();
                let short_id = id.chars().take(12).collect();
                let name = c
                    .names
                    .unwrap_or_default()
                    .into_iter()
                    .next()
                    .unwrap_or_default()
                    .trim_start_matches('/')
                    .to_string();
                let image = c.image.unwrap_or_default();
                let state = c.state.clone().unwrap_or_default();
                let status_str = c.status.unwrap_or_default();
                let status = ContainerStatus::from_str(&state);

                let ports = c
                    .ports
                    .unwrap_or_default()
                    .into_iter()
                    .filter_map(|p| {
                        let host_port = p.public_port.map(|p| p.to_string())?;
                        let container_port = p.private_port.to_string();
                        let protocol = p
                            .typ
                            .map(|t| format!("{:?}", t).to_lowercase())
                            .unwrap_or_else(|| "tcp".into());
                        Some(PortMapping {
                            host_port,
                            container_port,
                            protocol,
                        })
                    })
                    .collect();

                let uptime = parse_status_uptime(&status_str);

                ContainerSummary {
                    id,
                    short_id,
                    name,
                    image,
                    status,
                    state,
                    ports,
                    cpu_percent: 0.0,
                    memory_usage: 0,
                    memory_limit: 0,
                    memory_human: "—".into(),
                    uptime,
                    created: c.created.unwrap_or_default(),
                    labels: c.labels.unwrap_or_default(),
                }
            })
            .collect();

        Ok(summaries)
    }

    // ─── INSPECT ─────────────────────────────────────────────────────────────

    pub async fn inspect(&self, id: &str) -> Result<ContainerInspect> {
        let docker = self.client.get().await?;
        let raw = docker
            .inspect_container(id, None::<InspectContainerOptions>)
            .await
            .context("Failed to inspect container")?;

        let state = raw.state.as_ref();
        let status_str = state
            .and_then(|s| s.status.as_ref())
            .map(|s| format!("{:?}", s).to_lowercase())
            .unwrap_or_default();
        let config = raw.config.as_ref();
        let host_config = raw.host_config.as_ref();
        let net_settings = raw.network_settings.as_ref();

        let ports: Vec<PortMapping> = host_config
            .and_then(|h| h.port_bindings.as_ref())
            .map(|pb| {
                pb.iter()
                    .flat_map(|(container_port, bindings)| {
                        let cp = container_port
                            .split('/')
                            .next()
                            .unwrap_or(container_port)
                            .to_string();
                        let proto = container_port
                            .split('/')
                            .nth(1)
                            .unwrap_or("tcp")
                            .to_string();
                        bindings
                            .iter()
                            .flatten()
                            .filter_map(move |b| {
                                Some(PortMapping {
                                    host_port: b.host_port.clone().unwrap_or_default(),
                                    container_port: cp.clone(),
                                    protocol: proto.clone(),
                                })
                            })
                            .collect::<Vec<_>>()
                    })
                    .collect()
            })
            .unwrap_or_default();

        let mounts: Vec<MountPoint> = raw
            .mounts
            .unwrap_or_default()
            .into_iter()
            .map(|m| MountPoint {
                source: m.source.unwrap_or_default(),
                destination: m.destination.unwrap_or_default(),
                mode: m.mode.unwrap_or_default(),
                rw: m.rw.unwrap_or(false),
                mount_type: m
                    .typ
                    .map(|t| format!("{:?}", t).to_lowercase())
                    .unwrap_or_default(),
            })
            .collect();

        let networks: HashMap<String, NetworkEndpoint> = net_settings
            .and_then(|ns| ns.networks.as_ref())
            .map(|nets| {
                nets.iter()
                    .map(|(name, ep)| {
                        (
                            name.clone(),
                            NetworkEndpoint {
                                ip_address: ep.ip_address.clone().unwrap_or_default(),
                                gateway: ep.gateway.clone().unwrap_or_default(),
                                mac_address: ep.mac_address.clone().unwrap_or_default(),
                            },
                        )
                    })
                    .collect()
            })
            .unwrap_or_default();

        let ip = net_settings
            .and_then(|ns| ns.ip_address.as_deref())
            .unwrap_or_default()
            .to_string();

        Ok(ContainerInspect {
            id: raw.id.unwrap_or_default(),
            name: raw
                .name
                .unwrap_or_default()
                .trim_start_matches('/')
                .to_string(),
            image: config.and_then(|c| c.image.clone()).unwrap_or_default(),
            image_id: raw.image.unwrap_or_default(),
            status: ContainerStatus::from_str(&status_str),
            created: raw.created.unwrap_or_default(),
            started_at: state.and_then(|s| s.started_at.clone()).unwrap_or_default(),
            finished_at: state
                .and_then(|s| s.finished_at.clone())
                .unwrap_or_default(),
            restart_count: raw.restart_count.unwrap_or(0) as u64,
            platform: raw.platform.unwrap_or_default(),
            environment: config.and_then(|c| c.env.clone()).unwrap_or_default(),
            cmd: config.and_then(|c| c.cmd.clone()).unwrap_or_default(),
            entrypoint: config
                .and_then(|c| c.entrypoint.clone())
                .unwrap_or_default(),
            working_dir: config
                .and_then(|c| c.working_dir.clone())
                .unwrap_or_default(),
            hostname: config.and_then(|c| c.hostname.clone()).unwrap_or_default(),
            ports,
            mounts,
            networks,
            labels: config.and_then(|c| c.labels.clone()).unwrap_or_default(),
            ip_address: ip,
        })
    }

    // ─── LIFECYCLE ───────────────────────────────────────────────────────────

    pub async fn start(&self, id: &str) -> Result<()> {
        let docker = self.client.get().await?;
        docker
            .start_container(id, None::<StartContainerOptions<String>>)
            .await
            .context("Failed to start container")
    }

    pub async fn stop(&self, id: &str, timeout: Option<i64>) -> Result<()> {
        let docker = self.client.get().await?;
        let opts = StopContainerOptions {
            t: timeout.unwrap_or(10),
        };
        docker
            .stop_container(id, Some(opts))
            .await
            .context("Failed to stop container")
    }

    pub async fn restart(&self, id: &str, timeout: i64) -> Result<()> {
        let docker = self.client.get().await?;
        let opts = RestartContainerOptions { t: timeout as isize };
        docker
            .restart_container(id, Some(opts))
            .await
            .context("Failed to restart container")
    }

    /// Pause a running container (SIGSTOP).
    pub async fn pause(&self, id: &str) -> Result<()> {
        let docker = self.client.get().await?;
        docker
            .pause_container(id)
            .await
            .context("Failed to pause container")
    }

    /// Unpause a paused container (SIGCONT).
    pub async fn unpause(&self, id: &str) -> Result<()> {
        let docker = self.client.get().await?;
        docker
            .unpause_container(id)
            .await
            .context("Failed to unpause container")
    }

    /// SIGKILL a container immediately.
    pub async fn kill(&self, id: &str, signal: &str) -> Result<()> {
        let docker = self.client.get().await?;
        docker
            .kill_container(id, Some(KillContainerOptions { signal }))
            .await
            .context("Failed to kill container")
    }

    pub async fn remove(&self, id: &str, force: bool) -> Result<()> {
        let docker = self.client.get().await?;
        let opts = RemoveContainerOptions {
            force,
            v: false,
            link: false,
        };
        docker
            .remove_container(id, Some(opts))
            .await
            .context("Failed to remove container")
    }

    pub async fn rename(&self, id: &str, new_name: &str) -> Result<()> {
        let docker = self.client.get().await?;
        let opts = RenameContainerOptions { name: new_name };
        docker
            .rename_container(id, opts)
            .await
            .context("Failed to rename container")
    }

    // ─── RUN (create + start) ─────────────────────────────────────────────────

    pub async fn run(&self, opts: RunContainerOptions) -> Result<String> {
        let docker = self.client.get().await?;

        // Build port bindings
        let mut port_bindings: HashMap<String, Option<Vec<PortBinding>>> = HashMap::new();
        let mut exposed_ports: HashMap<String, HashMap<(), ()>> = HashMap::new();
        for pm in &opts.ports {
            let key = format!("{}/{}", pm.container_port, pm.protocol);
            exposed_ports.insert(key.clone(), HashMap::new());
            port_bindings.insert(
                key,
                Some(vec![PortBinding {
                    host_ip: Some("0.0.0.0".into()),
                    host_port: Some(pm.host_port.clone()),
                }]),
            );
        }

        let restart_policy = BollardRestartPolicy {
            name: Some(match opts.restart_policy {
                crate::docker::models::RestartPolicy::No => {
                    bollard::models::RestartPolicyNameEnum::NO
                }
                crate::docker::models::RestartPolicy::Always => {
                    bollard::models::RestartPolicyNameEnum::ALWAYS
                }
                crate::docker::models::RestartPolicy::OnFailure => {
                    bollard::models::RestartPolicyNameEnum::ON_FAILURE
                }
                crate::docker::models::RestartPolicy::UnlessStopped => {
                    bollard::models::RestartPolicyNameEnum::UNLESS_STOPPED
                }
            }),
            maximum_retry_count: None,
        };

        let host_config = HostConfig {
            port_bindings: Some(port_bindings),
            binds: if opts.volumes.is_empty() {
                None
            } else {
                Some(opts.volumes.clone())
            },
            auto_remove: Some(opts.auto_remove),
            restart_policy: Some(restart_policy),
            ..Default::default()
        };

        let config = Config {
            image: Some(opts.image.clone()),
            env: if opts.env.is_empty() {
                None
            } else {
                Some(opts.env.clone())
            },
            cmd: opts.cmd.clone(),
            labels: if opts.labels.is_empty() {
                None
            } else {
                Some(opts.labels.clone())
            },
            exposed_ports: Some(exposed_ports),
            host_config: Some(host_config),
            ..Default::default()
        };

        let create_opts = opts.name.as_deref().map(|n| CreateContainerOptions {
            name: n,
            platform: None,
        });

        let response = docker
            .create_container(create_opts, config)
            .await
            .context("Failed to create container")?;

        docker
            .start_container(&response.id, None::<StartContainerOptions<String>>)
            .await
            .context("Failed to start container after creation")?;

        Ok(response.id)
    }

    // ─── STATS ───────────────────────────────────────────────────────────────

    pub async fn stats(&self, id: &str) -> Result<ContainerStats> {
        let docker = self.client.get().await?;
        let opts = StatsOptions {
            stream: false,
            one_shot: true,
        };
        let mut stream = docker.stats(id, Some(opts));

        let raw = stream
            .next()
            .await
            .ok_or_else(|| anyhow::anyhow!("No stats returned"))?
            .context("Stats stream error")?;

        Ok(bollard_stats_to_container_stats(id, &raw))
    }

    // ─── LOGS ────────────────────────────────────────────────────────────────

    pub async fn logs(
        &self,
        id: &str,
        tail: Option<u64>,
        since: Option<i64>,
    ) -> Result<Vec<LogLine>> {
        let docker = self.client.get().await?;

        let name = docker
            .inspect_container(id, None::<InspectContainerOptions>)
            .await
            .ok()
            .and_then(|i| i.name)
            .unwrap_or_else(|| id.to_string())
            .trim_start_matches('/')
            .to_string();

        let opts = LogsOptions::<String> {
            stdout: true,
            stderr: true,
            follow: false,
            timestamps: true,
            tail: tail.map(|t| t.to_string()).unwrap_or_else(|| "200".into()),
            since: since.unwrap_or(0),
            ..Default::default()
        };

        let mut stream = docker.logs(id, Some(opts));
        let mut lines = Vec::new();

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(LogOutput::StdOut { message }) => {
                    let text = String::from_utf8_lossy(&message).to_string();
                    for line in text.lines() {
                        if let Some((ts, msg)) = split_log_timestamp(line) {
                            lines.push(LogLine {
                                container_id: id.to_string(),
                                container_name: name.clone(),
                                stream: LogStream::Stdout,
                                message: msg.to_string(),
                                timestamp: ts.to_string(),
                            });
                        }
                    }
                }
                Ok(LogOutput::StdErr { message }) => {
                    let text = String::from_utf8_lossy(&message).to_string();
                    for line in text.lines() {
                        if let Some((ts, msg)) = split_log_timestamp(line) {
                            lines.push(LogLine {
                                container_id: id.to_string(),
                                container_name: name.clone(),
                                stream: LogStream::Stderr,
                                message: msg.to_string(),
                                timestamp: ts.to_string(),
                            });
                        }
                    }
                }
                _ => {}
            }
        }

        Ok(lines)
    }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

fn parse_status_uptime(status: &str) -> String {
    status.trim_start_matches("Up ").to_string()
}

fn split_log_timestamp(line: &str) -> Option<(&str, &str)> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return None;
    }
    if let Some(pos) = trimmed.find(' ') {
        let ts = &trimmed[..pos];
        let msg = &trimmed[pos + 1..];
        if ts.contains('T') && (ts.ends_with('Z') || ts.contains('+')) {
            return Some((ts, msg));
        }
    }
    Some(("", trimmed))
}
