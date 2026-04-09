// stores/volumeStore.ts
import { create } from "zustand";
import { Volume } from "./types";

export type VolumeFilter = "all" | "in-use" | "unused";
export type VolumeSortKey = "name" | "size" | "created" | "driver";

interface VolumeState {
  volumes: Volume[];
  selectedName: string | null;
  filter: VolumeFilter;
  sortKey: VolumeSortKey;
  sortDir: "asc" | "desc";
  setVolumes: (volumes: Volume[]) => void;
  selectVolume: (name: string | null) => void;
  setFilter: (filter: VolumeFilter) => void;
  setSort: (key: VolumeSortKey) => void;
  removeVolume: (name: string) => void;
  pruneUnused: () => void;
  addVolume: (volume: Volume) => void;
}

const MOCK_VOLUMES: Volume[] = [
  {
    name: "postgres_data",
    driver: "local",
    mountpoint: "/var/lib/docker/volumes/postgres_data/_data",
    size: "842 MB",
    sizeBytes: 842_000_000,
    inUse: true,
    containers: ["postgres-db"],
    created: "2026-03-15",
    scope: "local",
    labels: {
      "com.docker.compose.project": "dockview",
      "com.docker.compose.volume": "postgres_data",
    },
  },
  {
    name: "redis_data",
    driver: "local",
    mountpoint: "/var/lib/docker/volumes/redis_data/_data",
    size: "12 MB",
    sizeBytes: 12_000_000,
    inUse: true,
    containers: ["redis-cache"],
    created: "2026-03-15",
    scope: "local",
    labels: {
      "com.docker.compose.project": "dockview",
      "com.docker.compose.volume": "redis_data",
    },
  },
  {
    name: "app_uploads",
    driver: "local",
    mountpoint: "/var/lib/docker/volumes/app_uploads/_data",
    size: "256 MB",
    sizeBytes: 256_000_000,
    inUse: false,
    containers: [],
    created: "2026-03-16",
    scope: "local",
    labels: {},
  },
  {
    name: "nginx_certs",
    driver: "local",
    mountpoint: "/var/lib/docker/volumes/nginx_certs/_data",
    size: "4 MB",
    sizeBytes: 4_000_000,
    inUse: true,
    containers: ["nginx-proxy"],
    created: "2026-03-15",
    scope: "local",
    labels: { "com.docker.compose.project": "dockview" },
  },
  {
    name: "old_build_cache",
    driver: "local",
    mountpoint: "/var/lib/docker/volumes/old_build_cache/_data",
    size: "1.2 GB",
    sizeBytes: 1_200_000_000,
    inUse: false,
    containers: [],
    created: "2026-02-10",
    scope: "local",
    labels: {},
  },
  {
    name: "grafana_storage",
    driver: "local",
    mountpoint: "/var/lib/docker/volumes/grafana_storage/_data",
    size: "38 MB",
    sizeBytes: 38_000_000,
    inUse: false,
    containers: [],
    created: "2026-02-28",
    scope: "local",
    labels: {},
  },
  {
    name: "traefik_acme",
    driver: "local",
    mountpoint: "/var/lib/docker/volumes/traefik_acme/_data",
    size: "2 MB",
    sizeBytes: 2_000_000,
    inUse: false,
    containers: [],
    created: "2026-03-12",
    scope: "local",
    labels: {},
  },
];

export const useVolumeStore = create<VolumeState>((set) => ({
  volumes: MOCK_VOLUMES,
  selectedName: null,
  filter: "all",
  sortKey: "name",
  sortDir: "asc",
  setVolumes: (volumes) => set({ volumes }),
  selectVolume: (name) => set({ selectedName: name }),
  setFilter: (filter) => set({ filter }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc",
    })),
  removeVolume: (name) =>
    set((state) => ({
      volumes: state.volumes.filter((v) => v.name !== name),
      selectedName: state.selectedName === name ? null : state.selectedName,
    })),
  pruneUnused: () =>
    set((state) => ({
      volumes: state.volumes.filter((v) => v.inUse),
      selectedName: null,
    })),
  addVolume: (volume) =>
    set((state) => ({ volumes: [volume, ...state.volumes] })),
}));
