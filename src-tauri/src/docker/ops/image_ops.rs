use crate::docker::client::DockerClient;
use crate::docker::images::ImageOps;
use crate::docker::models::ImageSummary;
use anyhow::Result;

pub struct ImageHighOps<'a> {
    client: &'a DockerClient,
}

impl<'a> ImageHighOps<'a> {
    pub fn new(client: &'a DockerClient) -> Self {
        Self { client }
    }

    /// Pull multiple images concurrently (up to `concurrency` at a time).
    pub async fn pull_batch(
        &self,
        images: &[(String, String)], // (image, tag) pairs
        concurrency: usize,
    ) -> Vec<(String, String, Result<()>)> {
        use futures_util::stream::{iter, StreamExt};
        iter(images.iter())
            .map(|(image, tag)| async move {
                let ops = ImageOps::new(self.client);
                let r = ops.pull(image, tag, |_| {}).await;
                (image.clone(), tag.clone(), r)
            })
            .buffer_unordered(concurrency)
            .collect::<Vec<_>>()
            .await
    }

    /// Return images not referenced by any container.
    pub async fn unused(&self) -> Result<Vec<ImageSummary>> {
        let ops = ImageOps::new(self.client);
        let all = ops.list().await?;
        Ok(all.into_iter().filter(|i| !i.in_use).collect())
    }

    /// Total disk space used by all images.
    pub async fn total_size(&self) -> Result<u64> {
        let ops = ImageOps::new(self.client);
        let all = ops.list().await?;
        Ok(all.iter().map(|i| i.size).sum())
    }
}
