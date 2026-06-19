import { create } from 'zustand';
import { Network, NetworkContainer } from './types';

export type NetworkFilter = 'all' | 'custom' | 'default';
export type NetworkSortKey = 'name' | 'driver' | 'created' | 'containers';

interface NetworkState {
  networks: Network[];
  selectedId: string | null;
  filter: NetworkFilter;
  sortKey: NetworkSortKey;
  sortDir: 'asc' | 'desc';
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
  {
    id: 'net-bridge-001',
    shortId: 'b3a1c2d4',
    name: 'bridge',
    driver: 'bridge',
    scope: 'local',
    subnet: '172.17.0.0/16',
    gateway: '172.17.0.1',
    ipRange: '172.17.0.0/16',
    internal: false,
    attachable: false,
    created: '2026-01-01',
    containers: [],
    labels: {},
    isDefault: true,
  },
  {
    id: 'net-host-001',
    shortId: 'f7e8d9c0',
    name: 'host',
    driver: 'host',
    scope: 'local',
    subnet: '—',
    gateway: '—',
    ipRange: '—',
    internal: false,
    attachable: false,
    created: '2026-01-01',
    containers: [],
    labels: {},
    isDefault: true,
  },
  {
    id: 'net-none-001',
    shortId: 'a0b1c2d3',
    name: 'none',
    driver: 'null',
    scope: 'local',
    subnet: '—',
    gateway: '—',
    ipRange: '—',
    internal: true,
    attachable: false,
    created: '2026-01-01',
    containers: [],
    labels: {},
    isDefault: true,
  },
  {
    id: 'net-app-001',
    shortId: 'e4f5a6b7',
    name: 'app_network',
    driver: 'bridge',
    scope: 'local',
    subnet: '172.20.0.0/16',
    gateway: '172.20.0.1',
    ipRange: '172.20.0.0/24',
    internal: false,
    attachable: true,
    created: '2026-03-15',
    containers: [
      { name: 'nginx-proxy', ip: '172.20.0.2' },
      { name: 'api-server', ip: '172.20.0.3' },
      { name: 'postgres-db', ip: '172.20.0.4' },
    ],
    labels: {
      'com.docker.compose.project': 'dockview',
      'com.docker.compose.network': 'app_network',
    },
    isDefault: false,
  },
  {
    id: 'net-monitoring-001',
    shortId: 'c8d9e0f1',
    name: 'monitoring',
    driver: 'bridge',
    scope: 'local',
    subnet: '172.21.0.0/16',
    gateway: '172.21.0.1',
    ipRange: '172.21.0.0/24',
    internal: true,
    attachable: true,
    created: '2026-02-28',
    containers: [{ name: 'redis-cache', ip: '172.21.0.2' }],
    labels: {},
    isDefault: false,
  },
  {
    id: 'net-internal-001',
    shortId: 'a2b3c4d5',
    name: 'internal_only',
    driver: 'bridge',
    scope: 'local',
    subnet: '10.0.0.0/24',
    gateway: '10.0.0.1',
    ipRange: '10.0.0.0/24',
    internal: true,
    attachable: false,
    created: '2026-03-01',
    containers: [],
    labels: {},
    isDefault: false,
  },
];

export const useNetworkStore = create<NetworkState>((set) => ({
  networks: [],
  selectedId: null,
  filter: 'all',
  sortKey: 'name',
  sortDir: 'asc',
  setNetworks: (networks) => set({ networks }),
  selectNetwork: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc',
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
          : n
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
          : n
      ),
    })),
}));
