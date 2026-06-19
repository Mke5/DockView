// stores/composeStore.ts
import { create } from 'zustand';
import {
  ComposeStack,
  ComposeStackStatus,
  ComposeServiceStatus,
} from './types';

export type ComposeFilter = 'all' | 'running' | 'stopped' | 'partial';
export type ComposeSortKey = 'name' | 'status' | 'services' | 'created';

interface ComposeState {
  stacks: ComposeStack[];
  selectedId: string | null;
  expandedIds: string[];
  filter: ComposeFilter;
  sortKey: ComposeSortKey;
  sortDir: 'asc' | 'desc';
  setStacks: (stacks: ComposeStack[]) => void;
  selectStack: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  setFilter: (filter: ComposeFilter) => void;
  setSort: (key: ComposeSortKey) => void;
  removeStack: (id: string) => void;
  addStack: (stack: ComposeStack) => void;
  updateStackStatus: (id: string, status: ComposeStackStatus) => void;
  updateServiceStatus: (
    stackId: string,
    serviceName: string,
    status: ComposeServiceStatus
  ) => void;
  restartStack: (id: string) => void;
  pullLatest: (id: string) => void;
}

const MOCK_STACKS: ComposeStack[] = [
  {
    id: 'stack-dockview',
    name: 'dockview',
    project: 'dockview',
    configPath: '~/Documents/Mke5/dockview/docker-compose.yml',
    status: 'running',
    created: '2026-03-15',
    lastStarted: '3d 14h ago',
    networks: ['app_network'],
    volumes: ['postgres_data', 'redis_data', 'nginx_certs'],
    services: [
      {
        name: 'nginx',
        image: 'nginx:alpine',
        status: 'running',
        replicas: 1,
        running: 1,
        ports: ['80:80', '443:443'],
        cpu: 12,
        memory: '128 MB',
        containerId: 'a3f8e2c1',
      },
      {
        name: 'postgres',
        image: 'postgres:15',
        status: 'running',
        replicas: 1,
        running: 1,
        ports: ['5432:5432'],
        cpu: 8,
        memory: '312 MB',
        containerId: 'b7c4d9a2',
      },
      {
        name: 'redis',
        image: 'redis:7-alpine',
        status: 'running',
        replicas: 1,
        running: 1,
        ports: ['6379:6379'],
        cpu: 2,
        memory: '48 MB',
        containerId: 'c1e5f8b3',
      },
      {
        name: 'api',
        image: 'node:20-slim',
        status: 'paused',
        replicas: 1,
        running: 0,
        ports: ['3000:3000'],
        cpu: 0,
        memory: '96 MB',
        containerId: 'd9a2b1c4',
      },
    ],
  },
  {
    id: 'stack-monitoring',
    name: 'monitoring',
    project: 'monitoring',
    configPath: '~/infra/monitoring/docker-compose.yml',
    status: 'partial',
    created: '2026-02-28',
    lastStarted: '18h ago',
    networks: ['monitoring'],
    volumes: ['grafana_storage'],
    services: [
      {
        name: 'grafana',
        image: 'grafana/grafana:latest',
        status: 'running',
        replicas: 1,
        running: 1,
        ports: ['3001:3000'],
        cpu: 6,
        memory: '220 MB',
        containerId: 'e4f7c8d5',
      },
      {
        name: 'prometheus',
        image: 'prom/prometheus:latest',
        status: 'exited',
        replicas: 1,
        running: 0,
        ports: ['9090:9090'],
        cpu: 0,
        memory: '0 MB',
        containerId: 'f5e8d9c0',
      },
      {
        name: 'alertmanager',
        image: 'prom/alertmanager',
        status: 'exited',
        replicas: 1,
        running: 0,
        ports: ['9093:9093'],
        cpu: 0,
        memory: '0 MB',
        containerId: 'g6f9e0d1',
      },
    ],
  },
  {
    id: 'stack-worker',
    name: 'worker',
    project: 'worker',
    configPath: '~/projects/worker/docker-compose.yml',
    status: 'stopped',
    created: '2026-03-16',
    lastStarted: '2d ago',
    networks: ['app_network'],
    volumes: [],
    services: [
      {
        name: 'worker',
        image: 'python:3.11',
        status: 'stopped',
        replicas: 3,
        running: 0,
        ports: [],
        cpu: 0,
        memory: '0 MB',
        containerId: 'h7g0f1e2',
      },
      {
        name: 'scheduler',
        image: 'python:3.11',
        status: 'stopped',
        replicas: 1,
        running: 0,
        ports: [],
        cpu: 0,
        memory: '0 MB',
        containerId: 'i8h1g2f3',
      },
    ],
  },
];

export const useComposeStore = create<ComposeState>((set) => ({
  stacks: [],
  selectedId: null,
  expandedIds: ['stack-dockview'],
  filter: 'all',
  sortKey: 'name',
  sortDir: 'asc',
  setStacks: (stacks) => set({ stacks }),
  selectStack: (id) => set({ selectedId: id }),
  toggleExpanded: (id) =>
    set((state) => ({
      expandedIds: state.expandedIds.includes(id)
        ? state.expandedIds.filter((e) => e !== id)
        : [...state.expandedIds, id],
    })),
  setFilter: (filter) => set({ filter }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc',
    })),
  removeStack: (id) =>
    set((state) => ({
      stacks: state.stacks.filter((s) => s.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      expandedIds: state.expandedIds.filter((e) => e !== id),
    })),
  addStack: (stack) => set((state) => ({ stacks: [stack, ...state.stacks] })),
  updateStackStatus: (id, status) =>
    set((state) => ({
      stacks: state.stacks.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status,
          services: s.services.map((svc) => ({
            ...svc,
            status:
              status === 'running'
                ? 'running'
                : status === 'stopped'
                  ? 'stopped'
                  : svc.status,
            running:
              status === 'running'
                ? svc.replicas
                : status === 'stopped'
                  ? 0
                  : svc.running,
          })),
          lastStarted: status === 'running' ? 'just now' : s.lastStarted,
        };
      }),
    })),
  updateServiceStatus: (stackId, serviceName, status) =>
    set((state) => ({
      stacks: state.stacks.map((s) => {
        if (s.id !== stackId) return s;
        const services = s.services.map((svc) =>
          svc.name === serviceName
            ? {
                ...svc,
                status,
                running: status === 'running' ? svc.replicas : 0,
              }
            : svc
        );
        const runningCount = services.filter(
          (svc) => svc.status === 'running'
        ).length;
        const newStatus: ComposeStackStatus =
          runningCount === services.length
            ? 'running'
            : runningCount === 0
              ? 'stopped'
              : 'partial';
        return { ...s, services, status: newStatus };
      }),
    })),
  restartStack: (id) =>
    set((state) => ({
      stacks: state.stacks.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'running',
              lastStarted: 'just now',
              services: s.services.map((svc) => ({
                ...svc,
                status: 'running',
                running: svc.replicas,
              })),
            }
          : s
      ),
    })),
  pullLatest: (id) =>
    set((state) => ({
      stacks: state.stacks.map((s) =>
        s.id === id ? { ...s, lastStarted: 'just now' } : s
      ),
    })),
}));
