// stores/networkStore.ts
import { create } from "zustand";
import { Network, NetworkContainer } from "./types";

export type NetworkFilter = "all" | "custom" | "default";
export type NetworkSortKey = "name" | "driver" | "created" | "containers";

interface NetworkState {
  networks: Network[];
  selectedId: string | null;
  filter: NetworkFilter;
  sortKey: NetworkSortKey;
  sortDir: "asc" | "desc";
  setNetworks: (networks: Network[]) => void;
  selectNetwork: (id: string | null) => void;
  setFilter: (filter: NetworkFilter) => void;
  setSort: (key: NetworkSortKey) => void;
  removeNetwork: (id: string) => void;
  addNetwork: (network: Network) => void;
  connectContainer: (networkId: string, container: NetworkContainer) => void;
  disconnectContainer: (networkId: string, containerName: string) => void;
}

const MOCK_NETWORKS: Network[] = [
  // ... copy from original
];

export const useNetworkStore = create<NetworkState>((set) => ({
  networks: MOCK_NETWORKS,
  selectedId: null,
  filter: "all",
  sortKey: "name",
  sortDir: "asc",
  setNetworks: (networks) => set({ networks }),
  selectNetwork: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === "asc" ? "desc" : "asc",
    })),
  removeNetwork: (id) =>
    set((state) => ({
      networks: state.networks.filter((n) => n.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  addNetwork: (network) =>
    set((state) => ({ networks: [...state.networks, network] })),
  connectContainer: (networkId, container) =>
    set((state) => ({
      networks: state.networks.map((n) =>
        n.id === networkId &&
        !n.containers.find((c) => c.name === container.name)
          ? { ...n, containers: [...n.containers, container] }
          : n,
      ),
    })),
  disconnectContainer: (networkId, containerName) =>
    set((state) => ({
      networks: state.networks.map((n) =>
        n.id === networkId
          ? {
              ...n,
              containers: n.containers.filter((c) => c.name !== containerName),
            }
          : n,
      ),
    })),
}));
