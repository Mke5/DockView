#[cfg(test)]
mod tests {
    // ─── CLIENT HELPERS ───────────────────────────────────────────────────────

    #[test]
    fn bytes_to_human_gb() {
        // bring the function into scope via the crate path
        let result = dock_lib::docker::client::bytes_to_human(2_500_000_000);
        assert_eq!(result, "2.5 GB");
    }

    #[test]
    fn bytes_to_human_mb() {
        let result = dock_lib::docker::client::bytes_to_human(188_000_000);
        assert_eq!(result, "188 MB");
    }

    #[test]
    fn bytes_to_human_kb() {
        let result = dock_lib::docker::client::bytes_to_human(4_096);
        assert_eq!(result, "4 KB");
    }

    #[test]
    fn bytes_to_human_bytes() {
        let result = dock_lib::docker::client::bytes_to_human(512);
        assert_eq!(result, "512 B");
    }

    #[test]
    fn cpu_percent_normal() {
        let pct = dock_lib::docker::client::cpu_percent(1_000_000.0, 100_000_000.0, 4.0);
        // Should be ~4 %
        assert!((pct - 4.0).abs() < 0.01, "Expected ~4.0, got {}", pct);
    }

    #[test]
    fn cpu_percent_zero_system_delta() {
        let pct = dock_lib::docker::client::cpu_percent(0.0, 0.0, 4.0);
        assert_eq!(pct, 0.0);
    }

    // ─── MODEL ───────────────────────────────────────────────────────────────

    #[test]
    fn container_status_from_str() {
        use dock_lib::docker::models::ContainerStatus;
        assert_eq!(
            ContainerStatus::from_str("running"),
            ContainerStatus::Running
        );
        assert_eq!(ContainerStatus::from_str("paused"), ContainerStatus::Paused);
        assert_eq!(ContainerStatus::from_str("exited"), ContainerStatus::Exited);
        assert_eq!(
            ContainerStatus::from_str("restarting"),
            ContainerStatus::Restarting
        );
        assert_eq!(
            ContainerStatus::from_str("unknown"),
            ContainerStatus::Stopped
        );
    }

    #[test]
    fn restart_policy_as_str() {
        use dock_lib::docker::models::RestartPolicy;
        assert_eq!(RestartPolicy::No.as_str(), "no");
        assert_eq!(RestartPolicy::Always.as_str(), "always");
        assert_eq!(RestartPolicy::OnFailure.as_str(), "on-failure");
        assert_eq!(RestartPolicy::UnlessStopped.as_str(), "unless-stopped");
    }

    // ─── API UTILS ────────────────────────────────────────────────────────────

    #[test]
    fn command_error_from_anyhow() {
        use dock_lib::api::utils::CommandError;
        let err = anyhow::anyhow!("something went wrong");
        let cmd_err = CommandError::from(err);
        assert!(cmd_err.message.contains("something went wrong"));
        assert!(cmd_err.code.is_none());
    }

    #[test]
    fn ok_response_with_message() {
        use dock_lib::api::utils::OkResponse;
        let r = OkResponse::with_message("done");
        assert!(r.ok);
        assert_eq!(r.message.as_deref(), Some("done"));
    }
}
