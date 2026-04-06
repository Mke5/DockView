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
  // ... copy from original
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
