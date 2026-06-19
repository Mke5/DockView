// stores/containerStore.ts
import { create } from 'zustand';
import { Container, ContainerStatus } from './types';

export type ContainerFilter = 'all' | ContainerStatus;
export type ContainerSortKey =
  | 'name'
  | 'status'
  | 'cpu'
  | 'memory'
  | 'created'
  | 'uptime';
export type ContainerSortDir = 'asc' | 'desc';
export type ContainerGroupKey = 'none' | 'status' | 'image' | 'created';

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
  {
    id: 'a3f8e2c1d9b4f7e6',
    shortId: 'a3f8e2c1',
    name: 'nginx-proxy',
    image: 'nginx:alpine',
    status: 'running',
    ports: ['80:80', '443:443'],
    cpu: 12,
    memory: '128 MB',
    uptime: '3d 14h',
    created: '2026-03-15',
  },
  {
    id: 'b7c4d9a2e1f5c8b3',
    shortId: 'b7c4d9a2',
    name: 'postgres-db',
    image: 'postgres:15',
    status: 'running',
    ports: ['5432:5432'],
    cpu: 8,
    memory: '312 MB',
    uptime: '3d 14h',
    created: '2026-03-15',
  },
  {
    id: 'c1e5f8b3a4d7c2e9',
    shortId: 'c1e5f8b3',
    name: 'redis-cache',
    image: 'redis:7-alpine',
    status: 'running',
    ports: ['6379:6379'],
    cpu: 2,
    memory: '48 MB',
    uptime: '3d 14h',
    created: '2026-03-15',
  },
  {
    id: 'd9a2b1c4f8e3a7d5',
    shortId: 'd9a2b1c4',
    name: 'api-server',
    image: 'node:20-slim',
    status: 'paused',
    ports: ['3000:3000'],
    cpu: 0,
    memory: '96 MB',
    uptime: '5h 22m',
    created: '2026-03-18',
  },
  {
    id: 'e4f7c8d5b9a1e2f6',
    shortId: 'e4f7c8d5',
    name: 'worker-queue',
    image: 'python:3.11',
    status: 'stopped',
    ports: [],
    cpu: 0,
    memory: '0 MB',
    uptime: '2d ago',
    created: '2026-03-16',
  },
];

export const useContainerStore = create<ContainerState>((set) => ({
  containers: [],
  selectedId: null,
  filter: 'all',
  sortKey: 'name',
  sortDir: 'asc',
  groupKey: 'none',
  setContainers: (containers) => set({ containers }),
  selectContainer: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSortKey: (key) => set({ sortKey: key }),
  setSortDir: (dir) => set({ sortDir: dir }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc',
    })),
  setGroupKey: (key) => set({ groupKey: key }),
  updateContainerStatus: (id, status) =>
    set((state) => ({
      containers: state.containers.map((c) =>
        c.id === id ? { ...c, status } : c
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
