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

export const useVolumeStore = create<VolumeState>((set) => ({
  volumes: [],
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
