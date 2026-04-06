// stores/settingsStore.ts
import { create } from "zustand";
import { SettingsSection, DockviewSettings, KeyBinding } from "./types";

const DEFAULT_SETTINGS: DockviewSettings = {
  theme: "dark",
  language: "en-US",
  startOnLogin: false,
  minimizeToTray: true,
  showSystemTray: true,
  checkUpdatesAuto: true,
  updateChannel: "stable",
  telemetry: true,
  crashReports: true,
  dockerHost: "unix:///var/run/docker.sock",
  contextName: "default",
  tlsVerify: false,
  certPath: "",
  loggingDriver: "json-file",
  logMaxSize: "10m",
  logMaxFiles: 3,
  cpuLimit: 4,
  memoryLimit: 6,
  swapLimit: 1,
  diskImageSize: 60,
  enableVirtioFS: true,
  dnsServer: "8.8.8.8",
  proxyHttp: "",
  proxyHttps: "",
  noProxy: "localhost,127.0.0.1",
  enableIPv6: false,
};

const DEFAULT_KEYBINDINGS: KeyBinding[] = [
  // ... copy from original
];

interface SettingsState {
  activeSection: SettingsSection;
  settings: DockviewSettings;
  dirty: boolean;
  keybindings: KeyBinding[];
  setSection: (section: SettingsSection) => void;
  updateSetting: <K extends keyof DockviewSettings>(
    key: K,
    value: DockviewSettings[K],
  ) => void;
  resetSection: (section: SettingsSection) => void;
  updateKeybinding: (id: string, shortcut: string) => void;
  save: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  activeSection: "general",
  settings: { ...DEFAULT_SETTINGS },
  dirty: false,
  keybindings: DEFAULT_KEYBINDINGS,
  setSection: (section) => set({ activeSection: section }),
  updateSetting: (key, value) =>
    set((state) => ({
      settings: { ...state.settings, [key]: value },
      dirty: true,
    })),
  resetSection: (section) =>
    set((state) => {
      const sectionKeys: Record<SettingsSection, (keyof DockviewSettings)[]> = {
        general: [
          "theme",
          "language",
          "startOnLogin",
          "minimizeToTray",
          "showSystemTray",
          "checkUpdatesAuto",
          "updateChannel",
          "telemetry",
          "crashReports",
        ],
        engine: [
          "dockerHost",
          "contextName",
          "tlsVerify",
          "certPath",
          "loggingDriver",
          "logMaxSize",
          "logMaxFiles",
        ],
        resources: [
          "cpuLimit",
          "memoryLimit",
          "swapLimit",
          "diskImageSize",
          "enableVirtioFS",
        ],
        network: [
          "dnsServer",
          "proxyHttp",
          "proxyHttps",
          "noProxy",
          "enableIPv6",
        ],
        "docker-hub": [],
        extensions: [],
        keybindings: [],
        about: [],
      };
      const keys = sectionKeys[section] ?? [];
      const reset = keys.reduce(
        (acc, k) => ({ ...acc, [k]: DEFAULT_SETTINGS[k] }),
        {},
      );
      return { settings: { ...state.settings, ...reset }, dirty: true };
    }),
  updateKeybinding: (id, shortcut) =>
    set((state) => ({
      keybindings: state.keybindings.map((kb) =>
        kb.id === id ? { ...kb, shortcut } : kb,
      ),
    })),
  save: () => set({ dirty: false }),
}));
