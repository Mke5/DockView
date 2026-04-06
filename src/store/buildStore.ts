// stores/buildStore.ts
import { create } from "zustand";
import { BuildRecord } from "./types";

export type BuildFilter = "all" | "success" | "failed" | "building";
export type BuildSortKey = "image" | "status" | "duration" | "started" | "size";

interface BuildState {
  builds: BuildRecord[];
  selectedId: string | null;
  filter: BuildFilter;
  activeLog: string | null;
  sortKey: BuildSortKey;
  sortDir: "asc" | "desc";
  setBuilds: (builds: BuildRecord[]) => void;
  selectBuild: (id: string | null) => void;
  setFilter: (filter: BuildFilter) => void;
  setActiveLog: (id: string | null) => void;
  setSort: (key: BuildSortKey) => void;
  clearBuild: (id: string) => void;
  clearAll: () => void;
  addBuild: (build: BuildRecord) => void;
  rebuildBuild: (id: string) => void;
  cancelBuild: (id: string) => void;
}

const MOCK_BUILDS: BuildRecord[] = [
  // ... copy from original
];

export const useBuildStore = create<BuildState>((set) => ({
  builds: MOCK_BUILDS,
  selectedId: null,
  filter: "all",
  activeLog: null,
  sortKey: "started",
  sortDir: "desc",
  setBuilds: (builds) => set({ builds }),
  selectBuild: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setActiveLog: (id) => set({ activeLog: id }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc",
    })),
  clearBuild: (id) =>
    set((state) => ({
      builds: state.builds.filter((b) => b.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  clearAll: () => set({ builds: [], selectedId: null }),
  addBuild: (build) => set((state) => ({ builds: [build, ...state.builds] })),
  rebuildBuild: (id) =>
    set((state) => {
      const original = state.builds.find((b) => b.id === id);
      if (!original) return state;
      const newId = `build-${Date.now()}`;
      const newBuild: BuildRecord = {
        ...original,
        id: newId,
        shortId: `bld-${String(state.builds.length + 1).padStart(3, "0")}`,
        status: "building",
        startedAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        finishedAt: "",
        duration: "",
        durationMs: 0,
        size: "—",
        sizeBytes: 0,
        steps: original.steps.map((s) => ({
          ...s,
          status: s.status === "cached" ? "cached" : "pending",
          duration: s.status === "cached" ? s.duration : "",
          log: s.status === "cached" ? s.log : "",
        })),
        error: undefined,
      };
      return { builds: [newBuild, ...state.builds] };
    }),
  cancelBuild: (id) =>
    set((state) => ({
      builds: state.builds.map((b) =>
        b.id === id && b.status === "building"
          ? {
              ...b,
              status: "cancelled",
              finishedAt: new Date()
                .toISOString()
                .slice(0, 19)
                .replace("T", " "),
            }
          : b,
      ),
    })),
}));
