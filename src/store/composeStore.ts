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
