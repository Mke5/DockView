use crate::docker::client::DockerClient;
use crate::docker::error::DockerError;
use anyhow::Result;
use serde::{Deserialize, Serialize};

pub struct SystemOps<'a> {
    client: &'a DockerClient,
}

impl<'a> SystemOps<'a> {
    pub fn new(client: &'a DockerClient) -> Self {
        Self { client }
    }

    /// Prune everything: stopped containers, dangling images,
    /// unused networks, unused volumes.
    pub async fn prune_all(&self) -> Result<PruneAllResult> {
        let docker = self.client.get().await?;

        let containers = docker
            .prune_containers(None::<bollard::container::PruneContainersOptions<String>>)
            .await
            .map_err(|e| DockerError::prune("containers", e))?;

        let images = docker
            .prune_images(None::<bollard::image::PruneImagesOptions<String>>)
            .await
            .map_err(|e| DockerError::prune("images", e))?;

        let volumes = docker
            .prune_volumes(None::<bollard::volume::PruneVolumesOptions<String>>)
            .await
            .map_err(|e| DockerError::prune("volumes", e))?;

        let networks = docker
            .prune_networks(None::<bollard::network::PruneNetworksOptions<String>>)
            .await
            .map_err(|e| DockerError::prune("networks", e))?;

        Ok(PruneAllResult {
            containers_deleted: containers.containers_deleted.unwrap_or_default(),
            images_deleted: images
                .images_deleted
                .unwrap_or_default()
                .into_iter()
                .filter_map(|d| d.deleted)
                .collect(),
            volumes_deleted: volumes.volumes_deleted.unwrap_or_default(),
            networks_deleted: networks.networks_deleted.unwrap_or_default(),
            space_reclaimed: (containers.space_reclaimed.unwrap_or(0)
                + images.space_reclaimed.unwrap_or(0)
                + volumes.space_reclaimed.unwrap_or(0)) as u64,
        })
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PruneAllResult {
    pub containers_deleted: Vec<String>,
    pub images_deleted: Vec<String>,
    pub volumes_deleted: Vec<String>,
    pub networks_deleted: Vec<String>,
    pub space_reclaimed: u64,
}
