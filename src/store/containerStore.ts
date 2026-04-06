// stores/containerStore.ts
import { create } from "zustand";
import { Container, ContainerStatus } from "./types";

export type ContainerFilter = "all" | ContainerStatus;
export type ContainerSortKey =
  | "name"
  | "status"
  | "cpu"
  | "memory"
  | "created"
  | "uptime";
export type ContainerSortDir = "asc" | "desc";
export type ContainerGroupKey = "none" | "status" | "image" | "created";

interface ContainerState {
  containers: Container[];
  selectedId: string | null;
  filter: ContainerFilter;
  sortKey: ContainerSortKey;
  sortDir: ContainerSortDir;
  groupKey: ContainerGroupKey;
  setContainers: (containers: Container[]) => void;
  selectContainer: (id: string | null) => void;
  setFilter: (filter: ContainerFilter) => void;
  setSortKey: (key: ContainerSortKey) => void;
  setSortDir: (dir: ContainerSortDir) => void;
  setSort: (key: ContainerSortKey) => void;
  setGroupKey: (key: ContainerGroupKey) => void;
  updateContainerStatus: (id: string, status: ContainerStatus) => void;
  removeContainer: (id: string) => void;
  addContainer: (container: Container) => void;
}

const MOCK_CONTAINERS: Container[] = [
  // ... copy the mock data from your original file
  // (I'll omit for brevity, but you can paste exactly as before)
];

export const useContainerStore = create<ContainerState>((set) => ({
  containers: MOCK_CONTAINERS,
  selectedId: null,
  filter: "all",
  sortKey: "name",
  sortDir: "asc",
  groupKey: "none",
  setContainers: (containers) => set({ containers }),
  selectContainer: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSortKey: (key) => set({ sortKey: key }),
  setSortDir: (dir) => set({ sortDir: dir }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc",
    })),
  setGroupKey: (key) => set({ groupKey: key }),
  updateContainerStatus: (id, status) =>
    set((state) => ({
      containers: state.containers.map((c) =>
        c.id === id ? { ...c, status } : c,
      ),
    })),
  removeContainer: (id) =>
    set((state) => ({
      containers: state.containers.filter((c) => c.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  addContainer: (container) =>
    set((state) => ({ containers: [container, ...state.containers] })),
}));
