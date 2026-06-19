// stores/buildStore.ts
import { create } from 'zustand';
import { BuildRecord } from './types';

export type BuildFilter = 'all' | 'success' | 'failed' | 'building';
export type BuildSortKey = 'image' | 'status' | 'duration' | 'started' | 'size';

interface BuildState {
  builds: BuildRecord[];
  selectedId: string | null;
  filter: BuildFilter;
  activeLog: string | null;
  sortKey: BuildSortKey;
  sortDir: 'asc' | 'desc';
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
  {
    id: 'build-001',
    shortId: 'bld-001',
    image: 'nginx:alpine',
    status: 'success',
    trigger: 'compose',
    duration: '0m 42s',
    durationMs: 42000,
    startedAt: '2026-03-18 14:32:01',
    finishedAt: '2026-03-18 14:32:43',
    size: '23.5 MB',
    sizeBytes: 23500000,
    dockerfile: './nginx/Dockerfile',
    context: '~/Documents/Mke5/dockview',
    platform: 'linux/amd64',
    cacheUsed: true,
    tags: ['nginx:alpine', 'nginx:latest'],
    steps: [
      {
        id: 's1',
        name: 'FROM alpine:3.19',
        status: 'cached',
        duration: '0.0s',
        log: 'CACHED',
      },
      {
        id: 's2',
        name: 'RUN apk add --no-cache nginx',
        status: 'done',
        duration: '18.2s',
        log: 'fetch https://dl-cdn.alpinelinux.org/...\nOK: 8 MiB in 22 packages',
      },
      {
        id: 's3',
        name: 'COPY nginx.conf /etc/nginx/',
        status: 'done',
        duration: '0.1s',
        log: 'Copying config files...',
      },
      {
        id: 's4',
        name: 'EXPOSE 80 443',
        status: 'done',
        duration: '0.0s',
        log: '',
      },
      {
        id: 's5',
        name: 'CMD ["nginx", "-g", "daemon off;"]',
        status: 'done',
        duration: '0.0s',
        log: '',
      },
    ],
  },
  {
    id: 'build-002',
    shortId: 'bld-002',
    image: 'api-server:dev',
    status: 'building',
    trigger: 'manual',
    duration: '1m 12s',
    durationMs: 72000,
    startedAt: '2026-03-18 15:01:10',
    finishedAt: '',
    size: '—',
    sizeBytes: 0,
    dockerfile: './Dockerfile',
    context: '~/Documents/Mke5/dockview/api',
    platform: 'linux/amd64',
    cacheUsed: false,
    tags: ['api-server:dev'],
    steps: [
      {
        id: 's1',
        name: 'FROM node:20-slim',
        status: 'cached',
        duration: '0.0s',
        log: 'CACHED',
      },
      {
        id: 's2',
        name: 'WORKDIR /app',
        status: 'done',
        duration: '0.1s',
        log: '',
      },
      {
        id: 's3',
        name: 'COPY package*.json ./',
        status: 'done',
        duration: '0.2s',
        log: '',
      },
      {
        id: 's4',
        name: 'RUN npm ci',
        status: 'running',
        duration: '45.1s',
        log: 'added 312 packages, and audited 313 packages in 44s\n\n12 packages are looking for funding...',
      },
      { id: 's5', name: 'COPY . .', status: 'pending', duration: '', log: '' },
      {
        id: 's6',
        name: 'RUN npm run build',
        status: 'pending',
        duration: '',
        log: '',
      },
      {
        id: 's7',
        name: 'CMD ["node", "dist/index.js"]',
        status: 'pending',
        duration: '',
        log: '',
      },
    ],
  },
  {
    id: 'build-003',
    shortId: 'bld-003',
    image: 'worker:prod',
    status: 'failed',
    trigger: 'cli',
    duration: '0m 28s',
    durationMs: 28000,
    startedAt: '2026-03-18 12:10:44',
    finishedAt: '2026-03-18 12:11:12',
    size: '—',
    sizeBytes: 0,
    dockerfile: './worker/Dockerfile',
    context: '~/projects/worker',
    platform: 'linux/amd64',
    cacheUsed: true,
    tags: ['worker:prod'],
    error:
      'ERROR [build 5/6] RUN pip install -r requirements.txt\nERROR: Could not find a version that satisfies the requirement torch==2.3.0',
    steps: [
      {
        id: 's1',
        name: 'FROM python:3.11',
        status: 'cached',
        duration: '0.0s',
        log: 'CACHED',
      },
      {
        id: 's2',
        name: 'WORKDIR /app',
        status: 'done',
        duration: '0.1s',
        log: '',
      },
      {
        id: 's3',
        name: 'COPY requirements.txt .',
        status: 'done',
        duration: '0.1s',
        log: '',
      },
      {
        id: 's4',
        name: 'RUN pip install -r requirements.txt',
        status: 'error',
        duration: '22.4s',
        log: 'Collecting torch==2.3.0\nERROR: Could not find a version that satisfies the requirement torch==2.3.0 (from versions: 1.13.0, 2.0.0, 2.1.0, 2.2.0)\nERROR: No matching distribution found for torch==2.3.0',
      },
      { id: 's5', name: 'COPY . .', status: 'pending', duration: '', log: '' },
      {
        id: 's6',
        name: 'CMD ["python", "main.py"]',
        status: 'pending',
        duration: '',
        log: '',
      },
    ],
  },
  {
    id: 'build-004',
    shortId: 'bld-004',
    image: 'postgres:15',
    status: 'success',
    trigger: 'compose',
    duration: '0m 08s',
    durationMs: 8000,
    startedAt: '2026-03-18 14:31:55',
    finishedAt: '2026-03-18 14:32:03',
    size: '379 MB',
    sizeBytes: 379000000,
    dockerfile: './postgres/Dockerfile',
    context: '~/Documents/Mke5/dockview',
    platform: 'linux/amd64',
    cacheUsed: true,
    tags: ['postgres:15'],
    steps: [
      {
        id: 's1',
        name: 'FROM postgres:15-alpine',
        status: 'cached',
        duration: '0.0s',
        log: 'CACHED',
      },
      {
        id: 's2',
        name: 'COPY init.sql /docker-entrypoint-initdb.d/',
        status: 'done',
        duration: '0.1s',
        log: '',
      },
      {
        id: 's3',
        name: 'EXPOSE 5432',
        status: 'done',
        duration: '0.0s',
        log: '',
      },
    ],
  },
  {
    id: 'build-005',
    shortId: 'bld-005',
    image: 'redis:7-alpine',
    status: 'cancelled',
    trigger: 'manual',
    duration: '0m 05s',
    durationMs: 5000,
    startedAt: '2026-03-17 09:20:10',
    finishedAt: '2026-03-17 09:20:15',
    size: '—',
    sizeBytes: 0,
    dockerfile: './redis/Dockerfile',
    context: '~/Documents/Mke5/dockview',
    platform: 'linux/amd64',
    cacheUsed: false,
    tags: ['redis:7-alpine'],
    steps: [
      {
        id: 's1',
        name: 'FROM redis:7-alpine',
        status: 'done',
        duration: '2.1s',
        log: '',
      },
      {
        id: 's2',
        name: 'COPY redis.conf /usr/local/etc/',
        status: 'pending',
        duration: '',
        log: '',
      },
    ],
  },
  {
    id: 'build-006',
    shortId: 'bld-006',
    image: 'traefik:v3.0',
    status: 'success',
    trigger: 'api',
    duration: '2m 14s',
    durationMs: 134000,
    startedAt: '2026-03-16 18:44:00',
    finishedAt: '2026-03-16 18:46:14',
    size: '154 MB',
    sizeBytes: 154000000,
    dockerfile: './traefik/Dockerfile',
    context: '~/infra/traefik',
    platform: 'linux/amd64',
    cacheUsed: false,
    tags: ['traefik:v3.0', 'traefik:latest'],
    steps: [
      {
        id: 's1',
        name: 'FROM golang:1.21 AS builder',
        status: 'done',
        duration: '12.4s',
        log: '',
      },
      {
        id: 's2',
        name: 'WORKDIR /go/src/traefik',
        status: 'done',
        duration: '0.1s',
        log: '',
      },
      { id: 's3', name: 'COPY . .', status: 'done', duration: '1.2s', log: '' },
      {
        id: 's4',
        name: 'RUN make build',
        status: 'done',
        duration: '98.3s',
        log: 'Building traefik...\nDone.',
      },
      {
        id: 's5',
        name: 'FROM alpine:3.19',
        status: 'done',
        duration: '0.0s',
        log: 'CACHED',
      },
      {
        id: 's6',
        name: 'COPY --from=builder /go/src/traefik/dist/ .',
        status: 'done',
        duration: '0.4s',
        log: '',
      },
      {
        id: 's7',
        name: 'ENTRYPOINT ["/traefik"]',
        status: 'done',
        duration: '0.0s',
        log: '',
      },
    ],
  },
];

export const useBuildStore = create<BuildState>((set) => ({
  builds: [],
  selectedId: null,
  filter: 'all',
  activeLog: null,
  sortKey: 'started',
  sortDir: 'desc',
  setBuilds: (builds) => set({ builds }),
  selectBuild: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setActiveLog: (id) => set({ activeLog: id }),
  setSort: (key) =>
    set((state) => ({
      sortKey: key,
      sortDir:
        state.sortKey === key && state.sortDir === 'asc' ? 'desc' : 'asc',
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
        shortId: `bld-${String(state.builds.length + 1).padStart(3, '0')}`,
        status: 'building',
        startedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        finishedAt: '',
        duration: '',
        durationMs: 0,
        size: '—',
        sizeBytes: 0,
        steps: original.steps.map((s) => ({
          ...s,
          status: s.status === 'cached' ? 'cached' : 'pending',
          duration: s.status === 'cached' ? s.duration : '',
          log: s.status === 'cached' ? s.log : '',
        })),
        error: undefined,
      };
      return { builds: [newBuild, ...state.builds] };
    }),
  cancelBuild: (id) =>
    set((state) => ({
      builds: state.builds.map((b) =>
        b.id === id && b.status === 'building'
          ? {
              ...b,
              status: 'cancelled',
              finishedAt: new Date()
                .toISOString()
                .slice(0, 19)
                .replace('T', ' '),
            }
          : b
      ),
    })),
}));
