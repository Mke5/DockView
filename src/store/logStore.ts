// stores/logStore.ts
import { create } from 'zustand';
import { LogFilter, LogStream } from './types';

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

export const useLogStore = create<LogState>((set) => ({
  streams: [],
  activeStreamIds: [],
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
