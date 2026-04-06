/**
 * src/backend/bridge.ts
 *
 * Bridges the real Docker backend to the existing Zustand stores.
 *
 * Call `initDockerBridge()` once from App.tsx.  It will:
 *   1. Check if Docker is reachable
 *   2. Do an initial load of all resource types into each store
 *   3. Subscribe to live events so stores stay up-to-date automatically
 *   4. Start a polling loop for stats (CPU / memory)
 */

import {
  Container,
  ContainerStatus,
  DockerImage,
  Network,
  useAppStore,
  useContainerStore,
  useImageStore,
  useNetworkStore,
  useVolumeStore,
  Volume,
} from "../store";
import {
  ContainerStats,
  ContainerSummary,
  DockerEvent,
  dockerPing,
  ImageSummary,
  listContainers,
  listImages,
  listNetworks,
  listVolumes,
  NetworkSummary,
  onDockerEvent,
  onDockerStats,
  VolumeSummary,
} from "./docker";
import {
  bytesToHuman,
  errorMessage,
  isTauri,
  poll,
  unixToDate,
  unixToRelative,
} from "./utils";

// ─── TYPE CONVERTERS ─────────────────────────────────────────────────────────

function toStoreContainer(c: ContainerSummary): Container {
  return {
    id: c.id,
    shortId: c.shortId,
    name: c.name,
    image: c.image,
    status: mapStatus(c.status),
    ports: c.ports.map((p) => `${p.hostPort}:${p.containerPort}`),
    cpu: Math.round(c.cpuPercent * 10) / 10,
    memory: c.memoryHuman !== "—" ? c.memoryHuman : bytesToHuman(c.memoryUsage),
    uptime: c.uptime || unixToRelative(c.created),
    created: unixToDate(c.created),
  };
}

function mapStatus(s: ContainerSummary["status"]): ContainerStatus {
  switch (s) {
    case "running":
      return "running";
    case "paused":
      return "paused";
    case "exited":
      return "exited";
    case "restarting":
      return "running"; // treat as running for UI purposes
    default:
      return "stopped";
  }
}

function toStoreImage(i: ImageSummary): DockerImage {
  return {
    id: i.id,
    shortId: i.shortId,
    repository: i.repository,
    tag: i.tag,
    size: i.sizeHuman,
    sizeBytes: i.size,
    created: unixToDate(i.created),
    inUse: i.inUse,
    architecture: i.architecture || "amd64",
    os: i.os || "linux",
    digest: i.digest,
    containers: i.containers,
  };
}

function toStoreVolume(v: VolumeSummary): Volume {
  return {
    name: v.name,
    driver: v.driver,
    mountpoint: v.mountpoint,
    size: v.sizeHuman,
    sizeBytes: v.size ?? 0,
    inUse: v.inUse,
    containers: v.containers,
    created: v.created.slice(0, 10),
    scope: v.scope as "local" | "global" | "swarm",
    labels: v.labels,
  };
}

function toStoreNetwork(n: NetworkSummary): Network {
  return {
    id: n.id,
    shortId: n.shortId,
    name: n.name,
    driver: n.driver,
    scope: n.scope as "local" | "global" | "swarm",
    subnet: n.subnet,
    gateway: n.gateway,
    ipRange: n.ipRange,
    internal: n.internal,
    attachable: n.attachable,
    created: n.created.slice(0, 10),
    containers: n.containers.map((c) => ({ name: c.name, ip: c.ip })),
    labels: n.labels,
    isDefault: n.isDefault,
  };
}

// ─── LOADERS ─────────────────────────────────────────────────────────────────

async function loadContainers() {
  try {
    const raw = await listContainers(true);
    const containers = raw.map(toStoreContainer);
    useContainerStore.getState().setContainers(containers);
  } catch (e) {
    console.warn("[bridge] loadContainers failed:", errorMessage(e));
  }
}

async function loadImages() {
  try {
    const raw = await listImages();
    const images = raw.map(toStoreImage);
    useImageStore.getState().setImages(images);
  } catch (e) {
    console.warn("[bridge] loadImages failed:", errorMessage(e));
  }
}

async function loadVolumes() {
  try {
    const raw = await listVolumes();
    const volumes = raw.map(toStoreVolume);
    useVolumeStore.getState().setVolumes(volumes);
  } catch (e) {
    console.warn("[bridge] loadVolumes failed:", errorMessage(e));
  }
}

async function loadNetworks() {
  try {
    const raw = await listNetworks();
    const networks = raw.map(toStoreNetwork);
    useNetworkStore.getState().setNetworks(networks);
  } catch (e) {
    console.warn("[bridge] loadNetworks failed:", errorMessage(e));
  }
}

async function loadAll() {
  await Promise.all([
    loadContainers(),
    loadImages(),
    loadVolumes(),
    loadNetworks(),
  ]);
}

// ─── EVENT HANDLER ───────────────────────────────────────────────────────────

function handleDockerEvent(event: DockerEvent) {
  const { eventType, action } = event;

  // Container lifecycle events — reload containers + images
  if (eventType === "container") {
    switch (action) {
      case "start":
      case "die":
      case "stop":
      case "kill":
      case "pause":
      case "unpause":
      case "restart":
      case "rename":
      case "create":
      case "destroy":
        loadContainers();
        break;
    }
  }

  // Image events
  if (eventType === "image") {
    switch (action) {
      case "pull":
      case "delete":
      case "tag":
      case "untag":
        loadImages();
        loadContainers(); // inUse flags need refresh too
        break;
    }
  }

  // Volume events
  if (eventType === "volume") {
    loadVolumes();
  }

  // Network events
  if (eventType === "network") {
    loadNetworks();
  }
}

// ─── STATS HANDLER ───────────────────────────────────────────────────────────

function handleStats(stats: ContainerStats[]) {
  const containerStore = useContainerStore.getState();
  stats.forEach((s) => {
    const existing = containerStore.containers.find((c) => c.id === s.id);
    if (!existing) return;

    // Only update if values changed meaningfully (>0.5% CPU diff)
    const newCpu = Math.round(s.cpuPercent * 10) / 10;
    const newMem = bytesToHuman(s.memoryUsage);
    if (Math.abs(newCpu - existing.cpu) > 0.5 || newMem !== existing.memory) {
      containerStore.updateContainerStatus(s.id, existing.status); // trigger reactivity
      // Direct patch via setContainers for CPU/mem without touching status
      containerStore.setContainers(
        containerStore.containers.map((c) =>
          c.id === s.id ? { ...c, cpu: newCpu, memory: newMem } : c,
        ),
      );
    }
  });
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

let _cleanupFns: Array<() => void> = [];
let _initialised = false;

/**
 * Initialise the Docker bridge.  Safe to call multiple times — only runs once.
 *
 * @example
 * // In App.tsx:
 * useEffect(() => { initDockerBridge(); }, []);
 */

export async function initDockerBridge(): Promise<void> {
  if (_initialised) return;
  _initialised = true;

  // Only wire up real Docker when running inside Tauri, for development
  if (!isTauri()) {
    console.info("[bridge] Not running in Tauri — using mock store data");
    return;
  }

  const connected = await dockerPing().catch(() => false);
  useAppStore.getState().setEngineRunning(connected);

  if (!connected) {
    console.warn("[bridge] Docker daemon unreachable — retrying in 5s");
    setTimeout(() => {
      _initialised = false;
      initDockerBridge();
    }, 5000);
    return;
  }

  console.info("[bridge] Docker connected — loading data");

  // Initial data load
  await loadAll();

  // Subscribe to live Docker events from the backend service
  const unlistenEvent = await onDockerEvent(handleDockerEvent).catch(
    () => () => {},
  );
  _cleanupFns.push(unlistenEvent);

  // Subscribe to stats pushed by the Rust stats_collector every ~2s
  const unlistenStats = await onDockerStats(handleStats).catch(() => () => {});
  _cleanupFns.push(unlistenStats);

  // Fallback polling every 30s in case events miss something
  const stopPoll = poll(30_000, loadAll);
  _cleanupFns.push(stopPoll);

  console.info("[bridge] Bridge active");
}

/** Tear down all listeners and polling loops. */
export function destroyDockerBridge(): void {
  _cleanupFns.forEach((fn) => fn());
  _cleanupFns = [];
  _initialised = false;
}

// ─── MANUAL REFRESH HELPERS ──────────────────────────────────────────────────
// Used by "Refresh" toolbar buttons in each view

export const refreshContainers = () => loadContainers();
export const refreshImages = () => loadImages();
export const refreshVolumes = () => loadVolumes();
export const refreshNetworks = () => loadNetworks();
export const refreshAll = () => loadAll();
