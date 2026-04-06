// stores/types.ts

export type ContainerStatus = "running" | "paused" | "stopped" | "exited";
export type ViewSection =
  | "containers"
  | "images"
  | "volumes"
  | "networks"
  | "compose"
  | "builds"
  | "registry"
  | "logs"
  | "terminal"
  | "settings";

export interface Container {
  id: string;
  shortId: string;
  name: string;
  image: string;
  status: ContainerStatus;
  ports: string[];
  cpu: number;
  memory: string;
  uptime: string;
  created: string;
}

export interface DockerImage {
  id: string;
  shortId: string;
  repository: string;
  tag: string;
  size: string;
  sizeBytes: number;
  created: string;
  inUse: boolean;
  architecture: string;
  os: string;
  digest: string;
  containers: string[];
}

export interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  size: string;
  sizeBytes: number;
  inUse: boolean;
  containers: string[];
  created: string;
  scope: "local" | "global" | "swarm";
  labels: Record<string, string>;
}

export interface NetworkContainer {
  name: string;
  ip: string;
}

export interface Network {
  id: string;
  shortId: string;
  name: string;
  driver: string;
  scope: "local" | "global" | "swarm";
  subnet: string;
  gateway: string;
  ipRange: string;
  internal: boolean;
  attachable: boolean;
  created: string;
  containers: NetworkContainer[];
  labels: Record<string, string>;
  isDefault: boolean;
}

export interface SystemResources {
  cpu: number;
  memUsed: number;
  memTotal: number;
  disk: number;
}

// Compose types
export type ComposeServiceStatus =
  | "running"
  | "stopped"
  | "paused"
  | "exited"
  | "restarting";
export type ComposeStackStatus = "running" | "partial" | "stopped" | "degraded";

export interface ComposeService {
  name: string;
  image: string;
  status: ComposeServiceStatus;
  replicas: number;
  running: number;
  ports: string[];
  cpu: number;
  memory: string;
  containerId: string;
}

export interface ComposeStack {
  id: string;
  name: string;
  project: string;
  configPath: string;
  status: ComposeStackStatus;
  services: ComposeService[];
  created: string;
  lastStarted: string;
  networks: string[];
  volumes: string[];
}

// Build types
export type BuildStatus =
  | "success"
  | "failed"
  | "building"
  | "cancelled"
  | "cached";
export type BuildTrigger = "manual" | "compose" | "cli" | "api";

export interface BuildStep {
  id: string;
  name: string;
  status: "done" | "running" | "error" | "pending" | "cached";
  duration: string;
  log: string;
}

export interface BuildRecord {
  id: string;
  shortId: string;
  image: string;
  status: BuildStatus;
  trigger: BuildTrigger;
  duration: string;
  durationMs: number;
  startedAt: string;
  finishedAt: string;
  size: string;
  sizeBytes: number;
  dockerfile: string;
  context: string;
  platform: string;
  cacheUsed: boolean;
  steps: BuildStep[];
  tags: string[];
  error?: string;
}

// Registry types
export type RegistryType = "dockerhub" | "ghcr" | "ecr" | "gcr" | "custom";
export type RegistryStatus =
  | "connected"
  | "disconnected"
  | "error"
  | "checking";

export interface RegistryTag {
  name: string;
  digest: string;
  size: string;
  pushed: string;
  platform: string;
}

export interface RegistryRepo {
  id: string;
  name: string;
  fullName: string;
  description: string;
  isPrivate: boolean;
  stars: number;
  pulls: string;
  lastPushed: string;
  tags: RegistryTag[];
}

export interface RegistryAccount {
  id: string;
  type: RegistryType;
  name: string;
  url: string;
  username: string;
  status: RegistryStatus;
  repos: RegistryRepo[];
  lastSync: string;
  namespace: string;
}

// Logs types
export type LogLevel =
  | "info"
  | "warn"
  | "error"
  | "debug"
  | "stdout"
  | "stderr";
export type LogSource = "container" | "compose" | "system";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: string;
  sourceId: string;
  message: string;
  stream: "stdout" | "stderr";
}

export interface LogStream {
  id: string;
  name: string;
  source: LogSource;
  color: string;
  active: boolean;
  entries: LogEntry[];
}

export type LogFilter = "all" | "info" | "warn" | "error" | "debug";

// Terminal types
export type TerminalTarget = "container" | "host" | "compose";

export interface TerminalHistoryLine {
  id: string;
  type: "input" | "output" | "error" | "system" | "prompt";
  content: string;
}

export interface TerminalTab {
  id: string;
  label: string;
  target: TerminalTarget;
  targetId: string;
  targetName: string;
  shell: string;
  cwd: string;
  user: string;
  history: TerminalHistoryLine[];
  connected: boolean;
}

// Settings types
export type SettingsSection =
  | "general"
  | "engine"
  | "resources"
  | "network"
  | "docker-hub"
  | "extensions"
  | "keybindings"
  | "about";

export type ThemeOption = "dark" | "darker" | "light" | "system";
export type UpdateChannel = "stable" | "beta" | "nightly";
export type LoggingDriver = "json-file" | "local" | "syslog" | "none";

export interface KeyBinding {
  id: string;
  action: string;
  shortcut: string;
  category: string;
}

export interface DockviewSettings {
  theme: ThemeOption;
  language: string;
  startOnLogin: boolean;
  minimizeToTray: boolean;
  showSystemTray: boolean;
  checkUpdatesAuto: boolean;
  updateChannel: UpdateChannel;
  telemetry: boolean;
  crashReports: boolean;
  dockerHost: string;
  contextName: string;
  tlsVerify: boolean;
  certPath: string;
  loggingDriver: LoggingDriver;
  logMaxSize: string;
  logMaxFiles: number;
  cpuLimit: number;
  memoryLimit: number;
  swapLimit: number;
  diskImageSize: number;
  enableVirtioFS: boolean;
  dnsServer: string;
  proxyHttp: string;
  proxyHttps: string;
  noProxy: string;
  enableIPv6: boolean;
}
