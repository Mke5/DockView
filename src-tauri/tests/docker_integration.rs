/// Integration tests that require a live Docker daemon.
/// Run with: `cargo test --test docker_integration -- --ignored`
/// (They are marked `#[ignore]` so CI without Docker skips them.)

#[cfg(test)]
mod integration {
    use dock_lib::docker::client::DockerClient;
    use dock_lib::docker::containers::ContainerOps;
    use dock_lib::docker::images::ImageOps;

    /// Helper — connect to Docker or skip the test.
    async fn docker() -> Option<DockerClient> {
        match DockerClient::new().await {
            Ok(c) => Some(c),
            Err(_) => None,
        }
    }

    #[tokio::test]
    #[ignore]
    async fn ping_docker_daemon() {
        let client = docker().await.expect("Docker not available");
        assert!(client.is_connected().await);
    }

    #[tokio::test]
    #[ignore]
    async fn list_containers_succeeds() {
        let client = docker().await.expect("Docker not available");
        let ops = ContainerOps::new(&client);
        let containers = ops.list(true).await.expect("list_containers failed");
        // Just assert we got a Vec back — length may be 0 in a clean env
        println!("Found {} containers", containers.len());
    }

    #[tokio::test]
    #[ignore]
    async fn list_images_succeeds() {
        let client = docker().await.expect("Docker not available");
        let ops = ImageOps::new(&client);
        let images = ops.list().await.expect("list_images failed");
        println!("Found {} images", images.len());
    }

    #[tokio::test]
    #[ignore]
    async fn pull_alpine_image() {    use std::sync::atomic::{AtomicUsize, Ordering};    use std::sync::Arc;
        let client = docker().await.expect("Docker not available");
        let ops = ImageOps::new(&client);
        let events = Arc::new(AtomicUsize::new(0));
        let events_clone = Arc::clone(&events);
        ops.pull("alpine", "latest", move |_p| {
            events_clone.fetch_add(1, Ordering::SeqCst);
        })
        .await
        .expect("pull failed");
        let event_count = events.load(Ordering::SeqCst);
        assert!(event_count > 0, "Expected at least one progress event");}
}
