use crate::docker::client::DockerClient;
use crate::docker::containers::ContainerOps;
use crate::docker::models::{ContainerStatus, ContainerSummary};
use anyhow::Result;

/// High-level container operations that compose multiple low-level calls.
pub struct ContainerHighOps<'a> {
    client: &'a DockerClient,
}

impl<'a> ContainerHighOps<'a> {
    pub fn new(client: &'a DockerClient) -> Self {
        Self { client }
    }

    /// List only running containers.
    pub async fn list_running(&self) -> Result<Vec<ContainerSummary>> {
        let ops = ContainerOps::new(self.client);
        let all = ops.list(false).await?;
        Ok(all
            .into_iter()
            .filter(|c| c.status == ContainerStatus::Running)
            .collect())
    }

    /// Stop then remove a container in one call.
    pub async fn stop_and_remove(&self, id: &str, force: bool) -> Result<()> {
        let ops = ContainerOps::new(self.client);
        // Ignore stop errors (container might already be stopped)
        let _ = ops.stop(id, Some(5)).await;
        ops.remove(id, force).await
    }

    /// Restart all containers that match a set of IDs (e.g. a Compose stack).
    pub async fn restart_batch(&self, ids: &[String]) -> Vec<(String, Result<()>)> {
        let ops = ContainerOps::new(self.client);
        let mut results = Vec::new();
        for id in ids {
            let r = ops.restart(id, 10_i64).await;
            results.push((id.clone(), r));
        }
        results
    }

    /// SIGKILL a container that refuses to stop gracefully.
    pub async fn kill(&self, id: &str) -> Result<()> {
        let docker = self.client.get().await?;
        docker
            .kill_container(
                id,
                Some(bollard::container::KillContainerOptions { signal: "SIGKILL" }),
            )
            .await
            .map_err(|e| anyhow::anyhow!("Failed to kill container: {}", e))
    }

    /// Prune all stopped containers, returning (ids_removed, bytes_reclaimed).
    pub async fn prune_stopped(&self) -> Result<(Vec<String>, u64)> {
        let docker = self.client.get().await?;
        let result = docker
            .prune_containers(None::<bollard::container::PruneContainersOptions<String>>)
            .await
            .map_err(|e| anyhow::anyhow!("Prune failed: {}", e))?;
        let ids = result.containers_deleted.unwrap_or_default();
        let reclaimed = result.space_reclaimed.unwrap_or(0) as u64;
        Ok((ids, reclaimed))
    }
}
