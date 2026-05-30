/** Returns true when running inside the Tauri desktop shell. */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

// ─── ERROR HANDLING ───────────────────────────────────────────────────────────

export interface BackendError {
  message: string;
  code?: string;
}

/**
 * Normalise any error value thrown by `invoke()` into a plain message string.
 * Tauri serialises Rust errors as `{ message: string; code?: string }`.
 */
export function parseError(err: unknown): BackendError {
  if (typeof err === 'string') return { message: err };
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e.message === 'string')
      return { message: e.message, code: e.code as string | undefined };
  }
  return { message: String(err) };
}

export function errorMessage(err: unknown): string {
  return parseError(err).message;
}

// ─── SIZE HELPERS ─────────────────────────────────────────────────────────────

export function bytesToHuman(bytes: number): string {
  const GB = 1_000_000_000;
  const MB = 1_000_000;
  const KB = 1_000;
  if (bytes >= GB) return `${(bytes / GB).toFixed(1)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(0)} MB`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(0)} KB`;
  return `${bytes} B`;
}

// ─── TIME HELPERS ─────────────────────────────────────────────────────────────

export function unixToRelative(unix: number): string {
  const now = Date.now() / 1000;
  const diff = now - unix;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function unixToDate(unix: number): string {
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

// ─── POLLING ──────────────────────────────────────────────────────────────────

/**
 * Run `fn` immediately, then on every `intervalMs`.
 * Returns a cleanup function that stops polling.
 *
 * @example
 * const stop = poll(5000, () => fetchContainers());
 * // later: stop();
 */
export function poll(
  intervalMs: number,
  fn: () => void | Promise<void>
): () => void {
  fn(); // immediate first call
  const id = setInterval(fn, intervalMs);
  return () => clearInterval(id);
}
