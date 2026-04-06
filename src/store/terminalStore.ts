// stores/terminalStore.ts
import { create } from "zustand";
import { TerminalTab, TerminalHistoryLine } from "./types";

interface TerminalState {
  tabs: TerminalTab[];
  activeTabId: string;
  fontSize: number;
  addTab: (tab: Omit<TerminalTab, "id" | "history">) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  pushLine: (tabId: string, line: Omit<TerminalHistoryLine, "id">) => void;
  clearTab: (id: string) => void;
  setFontSize: (size: number) => void;
  setCwd: (tabId: string, cwd: string) => void;
}

function makeHistory(
  lines: Omit<TerminalHistoryLine, "id">[],
): TerminalHistoryLine[] {
  return lines.map((l, i) => ({ ...l, id: `h${i}` }));
}

const MOCK_TABS: TerminalTab[] = [
  // ... copy from original (including makeHistory calls)
];

export const useTerminalStore = create<TerminalState>((set, get) => ({
  tabs: MOCK_TABS,
  activeTabId: "term-host",
  fontSize: 12,
  addTab: (tab) =>
    set((state) => {
      const id = `term-${Date.now()}`;
      return {
        tabs: [
          ...state.tabs,
          {
            ...tab,
            id,
            history: [
              {
                id: "h0",
                type: "system",
                content: `Connected to ${tab.targetName} [${tab.shell}]`,
              },
              {
                id: "h1",
                type: "prompt",
                content: `${tab.user}@${tab.targetName}:${tab.cwd}$ `,
              },
            ],
          },
        ],
        activeTabId: id,
      };
    }),
  closeTab: (id) =>
    set((state) => {
      const tabs = state.tabs.filter((t) => t.id !== id);
      const activeTabId =
        state.activeTabId === id
          ? (tabs[tabs.length - 1]?.id ?? "")
          : state.activeTabId;
      return { tabs, activeTabId };
    }),
  setActiveTab: (id) => set({ activeTabId: id }),
  pushLine: (tabId, line) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId
          ? {
              ...t,
              history: [...t.history, { ...line, id: `h${t.history.length}` }],
            }
          : t,
      ),
    })),
  clearTab: (id) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, history: [] } : t)),
    })),
  setFontSize: (size) => set({ fontSize: size }),
  setCwd: (tabId, cwd) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, cwd } : t)),
    })),
}));
