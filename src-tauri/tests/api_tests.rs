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
    fn stats_cpu_percent_normal() {
        let stats = sample_stats(1_000_000, 100_000_000, 4);
        let s = dock_lib::docker::models::bollard_stats_to_container_stats("abc123", &stats);
        // (1M cpu delta / 100M system delta) * 4 cpus * 100 ≈ 4 %
        assert!(
            (s.cpu_percent - 4.0).abs() < 0.01,
            "Expected ~4.0, got {}",
            s.cpu_percent
        );
    }

    #[test]
    fn stats_cpu_percent_zero_deltas() {
        let stats = sample_stats(0, 0, 4);
        let s = dock_lib::docker::models::bollard_stats_to_container_stats("abc123", &stats);
        assert_eq!(s.cpu_percent, 0.0);
    }

    fn sample_stats(
        cpu_usage: u64,
        system_cpu_usage: u64,
        online_cpus: u64,
    ) -> bollard::container::Stats {
        serde_json::from_value(serde_json::json!({
            "read": "2026-01-01T00:00:00Z",
            "preread": "2026-01-01T00:00:00Z",
            "num_procs": 0,
            "pids_stats": { "current": 2 },
            "cpu_stats": {
                "cpu_usage": {
                    "total_usage": cpu_usage,
                    "usage_in_usermode": 0,
                    "usage_in_kernelmode": 0
                },
                "system_cpu_usage": system_cpu_usage,
                "online_cpus": online_cpus,
                "throttling_data": { "periods": 0, "throttled_periods": 0, "throttled_time": 0 }
            },
            "precpu_stats": {
                "cpu_usage": {
                    "total_usage": 0,
                    "usage_in_usermode": 0,
                    "usage_in_kernelmode": 0
                },
                "system_cpu_usage": 0,
                "online_cpus": 1,
                "throttling_data": { "periods": 0, "throttled_periods": 0, "throttled_time": 0 }
            },
            "memory_stats": { "usage": 50_000_000, "limit": 200_000_000 },
            "blkio_stats": {},
            "storage_stats": {},
            "name": "web",
            "id": "abc123"
        }))
        .expect("valid stats json")
    }

    // ─── MODEL ───────────────────────────────────────────────────────────────

    #[test]
    fn container_status_from_str() {
        use dock_lib::docker::models::ContainerStatus;
        assert_eq!(
            ContainerStatus::from_status("running"),
            ContainerStatus::Running
        );
        assert_eq!(
            ContainerStatus::from_status("paused"),
            ContainerStatus::Paused
        );
        assert_eq!(
            ContainerStatus::from_status("exited"),
            ContainerStatus::Exited
        );
        assert_eq!(
            ContainerStatus::from_status("restarting"),
            ContainerStatus::Restarting
        );
        assert_eq!(
            ContainerStatus::from_status("unknown"),
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
