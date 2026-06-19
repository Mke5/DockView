use std::time::Duration;

const INITIAL_DELAY: Duration = Duration::from_secs(1);
const MAX_DELAY: Duration = Duration::from_secs(30);

/// Exponential backoff timer for reconnection loops.
/// Resets to the initial delay on [`reset`](ConnectionBackoff::reset).
pub struct ConnectionBackoff {
    current: Duration,
}

impl ConnectionBackoff {
    pub fn new() -> Self {
        Self {
            current: INITIAL_DELAY,
        }
    }

    /// Return the current delay, then double it (capped at [`MAX_DELAY`]).
    pub fn delay(&mut self) -> Duration {
        let d = self.current;
        self.current = (self.current * 2).min(MAX_DELAY);
        d
    }

    /// Sleep for the current backoff duration, then advance.
    pub async fn sleep(&mut self) {
        tokio::time::sleep(self.delay()).await;
    }

    /// Reset to the initial (shortest) delay — call this after a successful
    /// connection or meaningful progress.
    pub fn reset(&mut self) {
        self.current = INITIAL_DELAY;
    }
}
