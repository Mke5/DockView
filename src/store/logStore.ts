// stores/logStore.ts
import { create } from 'zustand';
import { LogStream, LogFilter, LogLevel, LogEntry } from './types';

interface LogState {
  streams: LogStream[];
  activeStreamIds: string[];
  filter: LogFilter;
  searchQuery: string;
  follow: boolean;
  wrapLines: boolean;
  showTimestamps: boolean;
  showSource: boolean;
  toggleStream: (id: string) => void;
  setActiveStreams: (ids: string[]) => void;
  setFilter: (filter: LogFilter) => void;
  setSearchQuery: (q: string) => void;
  setFollow: (v: boolean) => void;
  setWrapLines: (v: boolean) => void;
  setShowTimestamps: (v: boolean) => void;
  setShowSource: (v: boolean) => void;
  clearStream: (id: string) => void;
}

// Helper function (keep internal)
function makeEntries(
  sourceId: string,
  source: string,
  lines: { t: string; l: LogLevel; m: string; s?: 'stdout' | 'stderr' }[]
): LogEntry[] {
  return lines.map((line, i) => ({
    id: `${sourceId}-${i}`,
    timestamp: line.t,
    level: line.l,
    source,
    sourceId,
    message: line.m,
    stream: line.s ?? 'stdout',
  }));
}

const MOCK_STREAMS: LogStream[] = [
  // ... copy from original (including the makeEntries calls)
];

export const useLogStore = create<LogState>((set) => ({
  streams: MOCK_STREAMS,
  activeStreamIds: ['log-nginx', 'log-postgres', 'log-redis'],
  filter: 'all',
  searchQuery: '',
  follow: true,
  wrapLines: false,
  showTimestamps: true,
  showSource: true,
  toggleStream: (id) =>
    set((state) => ({
      activeStreamIds: state.activeStreamIds.includes(id)
        ? state.activeStreamIds.filter((s) => s !== id)
        : [...state.activeStreamIds, id],
    })),
  setActiveStreams: (ids) => set({ activeStreamIds: ids }),
  setFilter: (filter) => set({ filter }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setFollow: (v) => set({ follow: v }),
  setWrapLines: (v) => set({ wrapLines: v }),
  setShowTimestamps: (v) => set({ showTimestamps: v }),
  setShowSource: (v) => set({ showSource: v }),
  clearStream: (id) =>
    set((state) => ({
      streams: state.streams.map((s) =>
        s.id === id ? { ...s, entries: [] } : s
      ),
    })),
}));
