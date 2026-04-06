// stores/appStore.ts
import { create } from "zustand";
import { ViewSection, SystemResources } from "./types";

interface AppState {
  activeView: ViewSection;
  searchQuery: string;
  engineRunning: boolean;
  sidebarCollapsed: boolean;
  resources: SystemResources;
  setActiveView: (view: ViewSection) => void;
  setSearchQuery: (q: string) => void;
  setEngineRunning: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setResources: (r: Partial<SystemResources>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: "containers",
  searchQuery: "",
  engineRunning: true,
  sidebarCollapsed: false,
  resources: { cpu: 34, memUsed: 3.7, memTotal: 6.4, disk: 12.4 },
  setActiveView: (view) => set({ activeView: view }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setEngineRunning: (v) => set({ engineRunning: v }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setResources: (r) =>
    set((state) => ({ resources: { ...state.resources, ...r } })),
}));
