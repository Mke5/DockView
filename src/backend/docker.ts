import { Channel, invoke } from '@tauri-apps/api/core';

// ─── SHARED TYPES ─────────────────────────────────────────────────────────────
export interface OkResponse {
  ok: boolean;
  message?: string;
}

export interface PruneResult {
  deleted: string[];
  reclaimedBytes: number;
  reclaimedHuman: string;
}

export interface CommandError {
  message: string;
  code?: string;
}

// ─── SYSTEM ───────────────────────────────────────────────────────────────────
export interface SystemInfo {
  dockerVersion: string;
  apiVersion: string;
  os: string;
  arch: string;
  totalMemory: number;
  cpuCount: number;
  containersRunning: number;
  containersStopped: number;
  containersPaused: number;
  imagesCount: number;
  serverVersion: string;
  kernelVersion: string;
  operatingSystem: string;
  storageDriver: string;
}

export interface DiskUsage {
  containersSize: number;
  imagesSize: number;
  volumesSize: number;
  buildCacheSize: number;
  totalSize: number;
}

export const dockerPing = () => invoke<boolean>('docker_ping');
export const dockerReconnect = () => invoke<boolean>('docker_reconnect');
export const dockerSystemInfo = () => invoke<SystemInfo>('docker_system_info');
export const dockerDiskUsage = () => invoke<DiskUsage>('docker_disk_usage');

// ─── CONTAINERS ───────────────────────────────────────────────────────────────

export type ContainerStatus =
  | 'running'
  | 'stopped'
  | 'paused'
  | 'exited'
  | 'restarting'
  | 'dead'
  | 'created'
  | 'removing';

export type RestartPolicy = 'no' | 'always' | 'on-failure' | 'unless-stopped';

export interface PortMapping {
  hostPort: string;
  containerPort: string;
  protocol: string;
}

export interface ContainerSummary {
  id: string;
  shortId: string;
  name: string;
  image: string;
  status: ContainerStatus;
  state: string;
  ports: PortMapping[];
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryHuman: string;
  uptime: string;
  created: number;
  labels: Record<string, string>;
}

export interface MountPoint {
  source: string;
  destination: string;
  mode: string;
  rw: boolean;
  mountType: string;
}

export interface NetworkEndpoint {
  ipAddress: string;
  gateway: string;
  macAddress: string;
}

export interface ContainerInspect {
  id: string;
  name: string;
  image: string;
  imageId: string;
  status: ContainerStatus;
  created: string;
  startedAt: string;
  finishedAt: string;
  restartCount: number;
  platform: string;
  environment: string[];
  cmd: string[];
  entrypoint: string[];
  workingDir: string;
  ports: PortMapping[];
  mounts: MountPoint[];
  networks: Record<string, NetworkEndpoint>;
  labels: Record<string, string>;
  hostname: string;
  ipAddress: string;
}

export interface ContainerStats {
  id: string;
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  networkRx: number;
  networkTx: number;
  blockRead: number;
  blockWrite: number;
  pids: number;
}

export interface RunContainerOptions {
  image: string;
  name?: string;
  ports: PortMapping[];
  env: string[];
  cmd?: string[];
  volumes: string[];
  detach: boolean;
  autoRemove: boolean;
  restartPolicy: RestartPolicy;
  network?: string;
  labels: Record<string, string>;
}

export interface LogLine {
  containerId: string;
  containerName: string;
  stream: 'stdout' | 'stderr';
  message: string;
  timestamp: string;
}

export const listContainers = (all?: boolean) =>
  invoke<ContainerSummary[]>('list_containers', { all });
export const inspectContainer = (id: string) =>
  invoke<ContainerInspect>('inspect_container', { id });
export const startContainer = (id: string) =>
  invoke<OkResponse>('start_container', { id });
export const stopContainer = (id: string, timeout?: number) =>
  invoke<OkResponse>('stop_container', { id, timeout });
export const restartContainer = (id: string, timeout?: number) =>
  invoke<OkResponse>('restart_container', { id, timeout });
export const pauseContainer = (id: string) =>
  invoke<OkResponse>('pause_container', { id });
export const unpauseContainer = (id: string) =>
  invoke<OkResponse>('unpause_container', { id });
export const killContainer = (id: string, signal?: string) =>
  invoke<OkResponse>('kill_container', { id, signal });
export const removeContainer = (id: string, force?: boolean) =>
  invoke<OkResponse>('remove_container', { id, force });
export const renameContainer = (id: string, newName: string) =>
  invoke<OkResponse>('rename_container', { id, newName });
export const runContainer = (options: RunContainerOptions) =>
  invoke<string>('run_container', { options });
export const getContainerStats = (id: string) =>
  invoke<ContainerStats>('get_container_stats', { id });
export const getContainerLogs = (id: string, tail?: number, since?: number) =>
  invoke<LogLine[]>('get_container_logs', { id, tail, since });

// ─── IMAGES ───────────────────────────────────────────────────────────────────

export interface ImageSummary {
  id: string;
  shortId: string;
  repository: string;
  tag: string;
  digest: string;
  size: number;
  sizeHuman: string;
  created: number;
  inUse: boolean;
  architecture: string;
  os: string;
  labels: Record<string, string>;
  containers: string[];
}

export const listImages = () => invoke<ImageSummary[]>('list_images');
export const inspectImage = (id: string) =>
  invoke<ImageSummary>('inspect_image', { id });
export const pullImage = (image: string, tag?: string) =>
  invoke<OkResponse>('pull_image', { image, tag });
export const removeImage = (id: string, force?: boolean) =>
  invoke<OkResponse>('remove_image', { id, force });
export const pruneImages = () => invoke<PruneResult>('prune_images');

// ─── VOLUMES ──────────────────────────────────────────────────────────────────

export interface VolumeSummary {
  name: string;
  driver: string;
  mountpoint: string;
  scope: string;
  created: string;
  labels: Record<string, string>;
  options: Record<string, string>;
  inUse: boolean;
  containers: string[];
  size?: number;
  sizeHuman: string;
}

export const listVolumes = () => invoke<VolumeSummary[]>('list_volumes');
export const createVolume = (
  name: string,
  driver?: string,
  labels?: Record<string, string>,
  driverOpts?: Record<string, string>
) =>
  invoke<VolumeSummary>('create_volume', { name, driver, labels, driverOpts });
export const removeVolume = (name: string, force?: boolean) =>
  invoke<OkResponse>('remove_volume', { name, force });
export const pruneVolumes = () => invoke<PruneResult>('prune_volumes');

// ─── NETWORKS ─────────────────────────────────────────────────────────────────

export interface NetworkContainerEntry {
  name: string;
  ip: string;
  macAddress: string;
}

export interface NetworkSummary {
  id: string;
  shortId: string;
  name: string;
  driver: string;
  scope: string;
  subnet: string;
  gateway: string;
  ipRange: string;
  internal: boolean;
  attachable: boolean;
  created: string;
  labels: Record<string, string>;
  isDefault: boolean;
  containers: NetworkContainerEntry[];
}

export interface CreateNetworkOptions {
  name: string;
  driver: string;
  subnet?: string;
  gateway?: string;
  ipRange?: string;
  internal: boolean;
  attachable: boolean;
  labels: Record<string, string>;
}

export const listNetworks = () => invoke<NetworkSummary[]>('list_networks');
export const createNetwork = (options: CreateNetworkOptions) =>
  invoke<string>('create_network', { options });
export const removeNetwork = (id: string) =>
  invoke<OkResponse>('remove_network', { id });
export const connectContainerToNetwork = (
  networkId: string,
  containerId: string,
  ip?: string
) =>
  invoke<OkResponse>('connect_container_to_network', {
    networkId,
    containerId,
    ip,
  });
export const disconnectContainerFromNetwork = (
  networkId: string,
  containerId: string
) =>
  invoke<OkResponse>('disconnect_container_from_network', {
    networkId,
    containerId,
  });

// ─── STREAMING ────────────────────────────────────────────────────────────────
export interface LogChunk {
  containerId: string;
  containerName: string;
  stream: 'stdout' | 'stderr';
  message: string;
  timestamp: string;
}

export interface PullProgressChunk {
  image: string;
  tag: string;
  status: string;
  progress?: string;
  current?: number;
  total?: number;
  layerId?: string;
  done: boolean;
}

/**
 * Stream container logs to a callback.
 * Returns a cleanup function — call it to close the channel.
 *
 * @example
 * const stop = await streamContainerLogs('abc123', (chunk) => {
 *   console.log(chunk.message);
 * });
 * // later:
 * stop();
 */
export async function streamContainerLogs(
  id: string,
  onChunk: (chunk: LogChunk) => void,
  options?: { tail?: number; follow?: boolean }
): Promise<() => void> {
  const channel = new Channel<LogChunk>();
  channel.onmessage = onChunk;

  invoke('stream_container_logs', {
    id,
    tail: options?.tail,
    follow: options?.follow ?? true,
    channel,
  }).catch(console.error);

  return () => {
    // Closing the channel stops the Rust stream
    channel.onmessage = () => {};
  };
}

/**
 * Pull an image with streaming progress events.
 *
 * @example
 * const stop = await pullImageStream('nginx', 'alpine', (chunk) => {
 *   console.log(chunk.status, chunk.progress);
 * });
 */
export async function pullImageStream(
  image: string,
  tag: string,
  onProgress: (chunk: PullProgressChunk) => void
): Promise<() => void> {
  const channel = new Channel<PullProgressChunk>();
  channel.onmessage = onProgress;

  invoke('pull_image_stream', { image, tag, channel }).catch(console.error);

  return () => {
    channel.onmessage = () => {};
  };
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────

export interface DockerEvent {
  eventType: string;
  action: string;
  actorId: string;
  actorName: string;
  time: number;
  attributes: Record<string, string>;
}

/**
 * Listen for Docker daemon events (container start/stop/die etc).
 * Returns an unlisten function.
 *
 * @example
 * const unlisten = await onDockerEvent((event) => {
 *   if (event.action === 'die') refetchContainers();
 * });
 */
export async function onDockerEvent(
  handler: (event: DockerEvent) => void
): Promise<() => void> {
  const { listen } = await import('@tauri-apps/api/event');
  return listen<DockerEvent>('docker://event', (e) => handler(e.payload));
}

/**
 * Listen for bulk stats updates emitted by the stats collector every ~2s.
 */
export async function onDockerStats(
  handler: (stats: ContainerStats[]) => void
): Promise<() => void> {
  const { listen } = await import('@tauri-apps/api/event');
  return listen<ContainerStats[]>('docker://stats', (e) => handler(e.payload));
}

// ─── EXEC / TERMINAL ──────────────────────────────────────────────────────────

export interface ExecOutputChunk {
  sessionId: string;
  stream: 'stdout' | 'stderr';
  data: string;
}

/**
 * Start an interactive exec session inside a container.
 * Returns the session ID.
 * Output is streamed via the `exec://output` event — listen with
 * `onExecOutput`.
 */
export async function execSessionStart(
  containerId: string,
  shell: string = '/bin/sh'
): Promise<string> {
  return invoke<string>('exec_session_start', { containerId, shell });
}

/** Write data to the stdin of an exec session. */
export async function execSessionWrite(
  sessionId: string,
  data: string
): Promise<void> {
  return invoke('exec_session_write', { sessionId, data });
}

/** Resize the terminal inside the exec session. */
export async function execSessionResize(
  sessionId: string,
  cols: number,
  rows: number
): Promise<void> {
  return invoke('exec_session_resize', { sessionId, cols, rows });
}

/** Stop and clean up an exec session. */
export async function execSessionStop(
  sessionId: string
): Promise<void> {
  return invoke('exec_session_stop', { sessionId });
}

/** Listen for exec output events. Returns an unlisten function. */
export async function onExecOutput(
  handler: (chunk: ExecOutputChunk) => void
): Promise<() => void> {
  const { listen } = await import('@tauri-apps/api/event');
  return listen<ExecOutputChunk>('exec://output', (e) => handler(e.payload));
}
