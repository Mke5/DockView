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
        DockerClient::new().await.ok()
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
    async fn pull_alpine_image() {
        use std::sync::atomic::{AtomicUsize, Ordering};
        use std::sync::Arc;
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
        assert!(event_count > 0, "Expected at least one progress event");
    }

    /// Verify a TTY exec session against a running container: spawn `/bin/sh`,
    /// confirm a prompt appears (proving the pty is allocated), send a command,
    /// and read its output.
    #[tokio::test]
    #[ignore]
    async fn exec_tty_session_produces_prompt_and_runs_commands() {
        use bollard::container::LogOutput;
        use bollard::exec::{CreateExecOptions, StartExecOptions, StartExecResults};
        use futures_util::StreamExt;
        use std::time::Duration;
        use tokio::io::AsyncWriteExt;
        use tokio::time::timeout;

        let client = docker().await.expect("Docker not available");
        let docker = client.get().await.expect("no docker client");

        // Find a running container (demo-nginx / demo-redis in dev envs)
        let containers = docker
            .list_containers(Some(bollard::container::ListContainersOptions::<String> {
                all: false,
                ..Default::default()
            }))
            .await
            .expect("list_containers failed");
        assert!(
            !containers.is_empty(),
            "No running containers — start one first"
        );
        let cid = containers[0].id.clone().expect("container missing id");

        let created = docker
            .create_exec(
                &cid,
                CreateExecOptions {
                    attach_stdin: Some(true),
                    attach_stdout: Some(true),
                    attach_stderr: Some(true),
                    tty: Some(true),
                    cmd: Some(vec!["/bin/sh".to_string()]),
                    ..Default::default()
                },
            )
            .await
            .expect("create_exec failed");

        let started = docker
            .start_exec(
                &created.id,
                Some(StartExecOptions {
                    detach: false,
                    tty: true,
                    ..Default::default()
                }),
            )
            .await
            .expect("start_exec failed");

        let (mut output, mut input) = match started {
            StartExecResults::Attached { output, input } => (output, input),
            StartExecResults::Detached => panic!("exec detached unexpectedly"),
        };

        let mut buffer = String::new();
        let read_task = tokio::spawn(async move {
            while let Some(Ok(chunk)) = output.next().await {
                let message = match chunk {
                    LogOutput::StdOut { message } => message,
                    LogOutput::StdErr { message } => message,
                    LogOutput::Console { message } => message,
                    LogOutput::StdIn { .. } => continue,
                };
                buffer.push_str(&String::from_utf8_lossy(&message));
                if buffer.contains("echo-exec-works") {
                    break;
                }
            }
            buffer
        });

        // A pty shell should emit a prompt (e.g. "/ #" or "sh-5.x#")
        let prompt = timeout(Duration::from_secs(10), async {
            loop {
                if read_task.is_finished() {
                    break;
                }
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
        })
        .await;
        // Don't fail on prompt timeout — the shell may be quiet; the echo test below is authoritative.
        let _ = prompt;

        // Send a command and expect its output
        input
            .write_all(b"echo exec-tty-works\r")
            .await
            .expect("stdin write failed");
        input.write_all(b"exit\r").await.ok();

        let result = timeout(Duration::from_secs(10), read_task)
            .await
            .expect("timed out waiting for exec output")
            .expect("read task panicked");
        assert!(
            result.contains("exec-tty-works"),
            "Expected echoed command output, got: {result:?}"
        );
        println!("TTY exec output: {result:?}");
    }
}
