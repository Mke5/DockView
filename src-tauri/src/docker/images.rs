use anyhow::{Context, Result};
use bollard::{
    image::{CreateImageOptions, ListImagesOptions, RemoveImageOptions},
    models::ImageSummary as BollardImageSummary,
};
use chrono::DateTime;
use futures_util::StreamExt;
use std::collections::HashSet;

use crate::docker::{
    client::{bytes_to_human, DockerClient},
    models::{ImageSummary, ProgressDetail, PullProgress},
};

pub struct ImageOps<'a> {
    client: &'a DockerClient,
}

impl<'a> ImageOps<'a> {
    pub fn new(client: &'a DockerClient) -> Self {
        Self { client }
    }

    // ─── LIST ─────────────────────────────────────────────────────────────────

    pub async fn list(&self) -> Result<Vec<ImageSummary>> {
        let docker = self.client.get().await?;

        // Collect container image IDs to determine in-use status
        let containers = docker
            .list_containers(Some(bollard::container::ListContainersOptions::<String> {
                all: true,
                ..Default::default()
            }))
            .await
            .unwrap_or_default();

        let in_use_ids: HashSet<String> = containers
            .iter()
            .filter_map(|c| c.image_id.clone())
            .collect();

        let in_use_names: HashSet<String> =
            containers.iter().filter_map(|c| c.image.clone()).collect();

        let container_map: std::collections::HashMap<String, Vec<String>> = {
            let mut m: std::collections::HashMap<String, Vec<String>> =
                std::collections::HashMap::new();
            for c in &containers {
                if let (Some(img_id), Some(names)) = (&c.image_id, &c.names) {
                    let name = names
                        .first()
                        .map(|n| n.trim_start_matches('/').to_string())
                        .unwrap_or_default();
                    m.entry(img_id.clone()).or_default().push(name);
                }
            }
            m
        };

        let raw: Vec<BollardImageSummary> = docker
            .list_images(Some(ListImagesOptions::<String> {
                all: false,
                ..Default::default()
            }))
            .await
            .context("Failed to list images")?;

        let images = raw
            .into_iter()
            .map(|img| {
                let id = img.id;
                let short_id = id
                    .trim_start_matches("sha256:")
                    .chars()
                    .take(12)
                    .collect::<String>();

                let (repository, tag) = {
                    let tags = img.repo_tags;
                    let first = tags
                        .into_iter()
                        .next()
                        .unwrap_or_else(|| "<none>:<none>".into());
                    let parts: Vec<&str> = first.splitn(2, ':').collect();
                    (
                        parts.first().copied().unwrap_or("<none>").to_string(),
                        parts.get(1).copied().unwrap_or("latest").to_string(),
                    )
                };

                let digest = img
                    .repo_digests
                    .into_iter()
                    .next()
                    .unwrap_or_else(|| format!("sha256:{}", &short_id));

                let size = img.size as u64;
                let in_use = in_use_ids.contains(&id)
                    || in_use_names.contains(&format!("{}:{}", repository, tag));

                let containers_using = container_map.get(&id).cloned().unwrap_or_default();

                ImageSummary {
                    id: id.clone(),
                    short_id,
                    repository,
                    tag,
                    digest,
                    size,
                    size_human: bytes_to_human(size),
                    created: img.created,
                    in_use,
                    architecture: String::new(), // not in list — need inspect
                    os: String::new(),
                    labels: img.labels,
                    containers: containers_using,
                }
            })
            .collect();

        Ok(images)
    }

    // ─── PULL (streaming progress) ────────────────────────────────────────────

    /// Pull an image, emitting progress events via the provided callback.
    pub async fn pull<F>(&self, image: &str, tag: &str, on_progress: F) -> Result<()>
    where
        F: Fn(PullProgress) + Send + 'static,
    {
        let docker = self.client.get().await?;
        let opts = CreateImageOptions {
            from_image: image,
            tag,
            ..Default::default()
        };

        let mut stream = docker.create_image(Some(opts), None, None);

        while let Some(event) = stream.next().await {
            match event {
                Ok(info) => {
                    on_progress(PullProgress {
                        image: image.to_string(),
                        tag: tag.to_string(),
                        status: info.status.unwrap_or_default(),
                        progress: info.progress,
                        progress_detail: info.progress_detail.map(|pd| ProgressDetail {
                            current: pd.current.map(|c| c as u64),
                            total: pd.total.map(|t| t as u64),
                        }),
                        id: info.id,
                    });
                }
                Err(e) => {
                    return Err(anyhow::anyhow!("Pull failed: {}", e));
                }
            }
        }

        Ok(())
    }

    // ─── REMOVE ───────────────────────────────────────────────────────────────

    pub async fn remove(&self, id: &str, force: bool) -> Result<()> {
        let docker = self.client.get().await?;
        let opts = RemoveImageOptions {
            force,
            noprune: false,
        };
        docker
            .remove_image(id, Some(opts), None)
            .await
            .context("Failed to remove image")?;
        Ok(())
    }

    // ─── PRUNE ────────────────────────────────────────────────────────────────

    pub async fn prune(&self) -> Result<(Vec<String>, u64)> {
        let docker = self.client.get().await?;
        let result = docker
            .prune_images(None::<bollard::image::PruneImagesOptions<String>>)
            .await
            .context("Failed to prune images")?;

        let deleted = result
            .images_deleted
            .unwrap_or_default()
            .into_iter()
            .filter_map(|d| d.deleted)
            .collect();

        let reclaimed = result.space_reclaimed.unwrap_or(0) as u64;
        Ok((deleted, reclaimed))
    }

    // ─── INSPECT ──────────────────────────────────────────────────────────────

    pub async fn inspect(&self, id: &str) -> Result<ImageSummary> {
        let docker = self.client.get().await?;
        let raw = docker
            .inspect_image(id)
            .await
            .context("Failed to inspect image")?;

        let img_id = raw.id.unwrap_or_default();
        let short_id = img_id
            .trim_start_matches("sha256:")
            .chars()
            .take(12)
            .collect();

        let (repository, tag) = {
            let tags = raw.repo_tags.unwrap_or_default();
            let first = tags
                .into_iter()
                .next()
                .unwrap_or_else(|| "<none>:<none>".into());
            let parts: Vec<&str> = first.splitn(2, ':').collect();
            (
                parts.first().copied().unwrap_or("<none>").to_string(),
                parts.get(1).copied().unwrap_or("latest").to_string(),
            )
        };

        let digest = raw
            .repo_digests
            .unwrap_or_default()
            .into_iter()
            .next()
            .unwrap_or_default();

        let size = raw.size.unwrap_or(0) as u64;

        let arch = raw.architecture.as_deref().unwrap_or("amd64").to_string();

        let os = raw.os.as_deref().unwrap_or("linux").to_string();

        Ok(ImageSummary {
            id: img_id,
            short_id,
            repository,
            tag,
            digest,
            size,
            size_human: bytes_to_human(size),
            created: raw
                .created
                .as_deref()
                .and_then(|s| DateTime::parse_from_rfc3339(s).ok())
                .map(|dt| dt.timestamp())
                .unwrap_or(0),
            in_use: false,
            architecture: arch,
            os,
            labels: raw
                .config
                .as_ref()
                .and_then(|c| c.labels.clone())
                .unwrap_or_default(),
            containers: vec![],
        })
    }
}
