use anyhow::{Context, Result};
use bollard::volume::{CreateVolumeOptions, ListVolumesOptions, RemoveVolumeOptions};
use std::collections::HashMap;

use crate::docker::{client::DockerClient, models::VolumeSummary};

// ─── VOLUMES ─────────────────────────────────────────────────────────────────

pub struct VolumeOps<'a> {
    client: &'a DockerClient,
}

impl<'a> VolumeOps<'a> {
    pub fn new(client: &'a DockerClient) -> Self {
        Self { client }
    }

    pub async fn list(&self) -> Result<Vec<VolumeSummary>> {
        let docker = self.client.get().await?;

        // Collect volumes in use from containers
        let containers = docker
            .list_containers(Some(bollard::container::ListContainersOptions::<String> {
                all: true,
                ..Default::default()
            }))
            .await
            .unwrap_or_default();

        // volume_name → [container_names]
        let mut volume_containers: HashMap<String, Vec<String>> = HashMap::new();
        for c in &containers {
            let cname = c
                .names
                .as_ref()
                .and_then(|n| n.first())
                .map(|n| n.trim_start_matches('/').to_string())
                .unwrap_or_default();
            if let Some(mounts) = &c.mounts {
                for m in mounts {
                    if let Some(vname) = &m.name {
                        volume_containers
                            .entry(vname.clone())
                            .or_default()
                            .push(cname.clone());
                    }
                }
            }
        }

        let result = docker
            .list_volumes(None::<ListVolumesOptions<String>>)
            .await
            .context("Failed to list volumes")?;

        let volumes = result
            .volumes
            .unwrap_or_default()
            .into_iter()
            .map(|v| {
                let name = v.name;
                let containers = volume_containers.get(&name).cloned().unwrap_or_default();
                let in_use = !containers.is_empty();

                VolumeSummary {
                    name: name.clone(),
                    driver: v.driver,
                    mountpoint: v.mountpoint,
                    scope: v.scope.map(|s| format!("{:?}", s)).unwrap_or_default(),
                    created: v.created_at.unwrap_or_default(),
                    labels: v.labels,
                    options: v.options,
                    in_use,
                    containers,
                    size: None,
                    size_human: "—".into(),
                }
            })
            .collect();

        Ok(volumes)
    }

    pub async fn create(
        &self,
        name: &str,
        driver: &str,
        labels: HashMap<String, String>,
        driver_opts: HashMap<String, String>,
    ) -> Result<VolumeSummary> {
        let docker = self.client.get().await?;
        let opts = CreateVolumeOptions {
            name: name.to_string(),
            driver: driver.to_string(),
            driver_opts,
            labels,
        };

        let vol = docker
            .create_volume(opts)
            .await
            .context("Failed to create volume")?;

        Ok(VolumeSummary {
            name: vol.name,
            driver: vol.driver,
            mountpoint: vol.mountpoint,
            scope: vol.scope.map(|s| format!("{:?}", s)).unwrap_or_default(),
            created: vol.created_at.unwrap_or_default(),
            labels: vol.labels,
            options: vol.options,
            in_use: false,
            containers: vec![],
            size: None,
            size_human: "—".into(),
        })
    }

    pub async fn remove(&self, name: &str, force: bool) -> Result<()> {
        let docker = self.client.get().await?;
        let opts = RemoveVolumeOptions { force };
        docker
            .remove_volume(name, Some(opts))
            .await
            .context("Failed to remove volume")
    }

    pub async fn prune(&self) -> Result<(Vec<String>, u64)> {
        let docker = self.client.get().await?;
        let result = docker
            .prune_volumes(None::<bollard::volume::PruneVolumesOptions<String>>)
            .await
            .context("Failed to prune volumes")?;

        let deleted = result.volumes_deleted.unwrap_or_default();
        let reclaimed = result.space_reclaimed.unwrap_or(0) as u64;
        Ok((deleted, reclaimed))
    }
}
