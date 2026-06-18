import { create } from 'zustand';
import { Volume } from './types';

export type VolumeFilter = 'all' | 'in-use' | 'unused';
export type VolumeSortKey = 'name' | 'size' | 'created' | 'driver';

interface VolumeState {
  volumes: Volume[];
  selectedId: string | null; // uses name as id
  filter: VolumeFilter;
  sortKey: VolumeSortKey;
  sortDir: 'asc' | 'desc';
  setVolumes: (volumes: Volume[]) => void;
  selectVolume: (id: string | null) => void;
  setFilter: (filter: VolumeFilter) => void;
  setSort: (key: VolumeSortKey) => void;
  removeVolume: (id: string) => void;
  pruneUnused: () => void;
  addVolume: (volume: Volume) => void;
}

const MOCK_VOLUMES: Volume[] = [
  {
    id: 'vol-1',
    name: 'postgres_data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/postgres_data/_data',
    size: '842 MB',
    sizeBytes: 842_000_000,
    inUse: true,
    containers: ['postgres-db'],
    created: '2026-03-15',
    scope: 'local',
    labels: {},
  },
  {
    id: 'vol-2',
    name: 'redis_data',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/redis_data/_data',
    size: '12 MB',
    sizeBytes: 12_000_000,
    inUse: true,
    containers: ['redis-cache'],
    created: '2026-03-15',
    scope: 'local',
    labels: {},
  },
  {
    id: 'vol-3',
    name: 'app_uploads',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/app_uploads/_data',
    size: '256 MB',
    sizeBytes: 256_000_000,
    inUse: false,
    containers: [],
    created: '2026-03-16',
    scope: 'local',
    labels: {},
  },
  {
    id: 'vol-4',
    name: 'nginx_certs',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/nginx_certs/_data',
    size: '4 MB',
    sizeBytes: 4_000_000,
    inUse: true,
    containers: ['nginx-proxy'],
    created: '2026-03-15',
    scope: 'local',
    labels: {},
  },
  {
    id: 'vol-5',
    name: 'old_build_cache',
    driver: 'local',
    mountpoint: '/var/lib/docker/volumes/old_build_cache/_data',
    size: '1.2 GB',
    sizeBytes: 1_200_000_000,
    inUse: false,
    containers: [],
    created: '2026-02-10',
    scope: 'local',
    labels: {},
  },
];

export const useVolumeStore = create<VolumeState>((set) => ({
  volumes: MOCK_VOLUMES,
  selectedId: null,
  filter: 'all',
  sortKey: 'name',
  sortDir: 'asc',
  setVolumes: (volumes) => set({ volumes }),
  selectVolume: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc',
    })),
  removeVolume: (id) =>
    set((state) => ({
      volumes: state.volumes.filter((v) => v.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  pruneUnused: () =>
    set((state) => ({
      volumes: state.volumes.filter((v) => v.inUse),
      selectedId: null,
    })),
  addVolume: (volume) =>
    set((state) => ({ volumes: [volume, ...state.volumes] })),
}));
