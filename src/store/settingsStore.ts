import { create } from 'zustand';
import { SettingsSection, DockviewSettings, KeyBinding } from './types';

const DEFAULT_SETTINGS: DockviewSettings = {
  theme: 'dark',
  language: 'en-US',
  startOnLogin: false,
  minimizeToTray: true,
  showSystemTray: true,
  checkUpdatesAuto: true,
  updateChannel: 'stable',
  telemetry: true,
  crashReports: true,
  dockerHost: 'unix:///var/run/docker.sock',
  contextName: 'default',
  tlsVerify: false,
  certPath: '',
  loggingDriver: 'json-file',
  logMaxSize: '10m',
  logMaxFiles: 3,
  cpuLimit: 4,
  memoryLimit: 6,
  swapLimit: 1,
  diskImageSize: 60,
  enableVirtioFS: true,
  dnsServer: '8.8.8.8',
  proxyHttp: '',
  proxyHttps: '',
  noProxy: 'localhost,127.0.0.1',
  enableIPv6: false,
};

const DEFAULT_KEYBINDINGS: KeyBinding[] = [
  {
    id: 'kb-1',
    action: 'Open command palette',
    shortcut: '⌘K',
    category: 'Global',
  },
  {
    id: 'kb-2',
    action: 'Switch to Containers',
    shortcut: '⌘1',
    category: 'Navigation',
  },
  {
    id: 'kb-3',
    action: 'Switch to Images',
    shortcut: '⌘2',
    category: 'Navigation',
  },
  {
    id: 'kb-4',
    action: 'Switch to Volumes',
    shortcut: '⌘3',
    category: 'Navigation',
  },
  {
    id: 'kb-5',
    action: 'Switch to Networks',
    shortcut: '⌘4',
    category: 'Navigation',
  },
  {
    id: 'kb-6',
    action: 'Switch to Compose',
    shortcut: '⌘5',
    category: 'Navigation',
  },
  {
    id: 'kb-7',
    action: 'Switch to Builds',
    shortcut: '⌘6',
    category: 'Navigation',
  },
  {
    id: 'kb-8',
    action: 'Switch to Registry',
    shortcut: '⌘7',
    category: 'Navigation',
  },
  {
    id: 'kb-9',
    action: 'Switch to Settings',
    shortcut: '⌘,',
    category: 'Navigation',
  },
  { id: 'kb-10', action: 'Refresh view', shortcut: '⌘R', category: 'Actions' },
  {
    id: 'kb-11',
    action: 'Start container',
    shortcut: '⌘↩',
    category: 'Containers',
  },
  {
    id: 'kb-12',
    action: 'Stop container',
    shortcut: '⌘⌫',
    category: 'Containers',
  },
  {
    id: 'kb-13',
    action: 'Run new container',
    shortcut: '⌘N',
    category: 'Containers',
  },
  { id: 'kb-14', action: 'Pull image', shortcut: '⌘P', category: 'Images' },
  { id: 'kb-15', action: 'Push image', shortcut: '⌘⇧P', category: 'Images' },
  {
    id: 'kb-16',
    action: 'New Compose stack',
    shortcut: '⌘⇧N',
    category: 'Compose',
  },
  { id: 'kb-17', action: 'Focus search', shortcut: '/', category: 'Global' },
  {
    id: 'kb-18',
    action: 'Close panel / modal',
    shortcut: 'Esc',
    category: 'Global',
  },
];

interface SettingsState {
  activeSection: SettingsSection;
  settings: DockviewSettings;
  dirty: boolean;
  keybindings: KeyBinding[];
  setSection: (section: SettingsSection) => void;
  updateSetting: <K extends keyof DockviewSettings>(
    key: K,
    value: DockviewSettings[K]
  ) => void;
  resetSection: (section: SettingsSection) => void;
  updateKeybinding: (id: string, shortcut: string) => void;
  save: () => void;
}

const SECTION_KEYS: Record<SettingsSection, (keyof DockviewSettings)[]> = {
  general: [
    'theme',
    'language',
    'startOnLogin',
    'minimizeToTray',
    'showSystemTray',
    'checkUpdatesAuto',
    'updateChannel',
    'telemetry',
    'crashReports',
  ],
  engine: [
    'dockerHost',
    'contextName',
    'tlsVerify',
    'certPath',
    'loggingDriver',
    'logMaxSize',
    'logMaxFiles',
  ],
  resources: [
    'cpuLimit',
    'memoryLimit',
    'swapLimit',
    'diskImageSize',
    'enableVirtioFS',
  ],
  network: ['dnsServer', 'proxyHttp', 'proxyHttps', 'noProxy', 'enableIPv6'],
  keybindings: [],
  about: [],
};

export const useSettingsStore = create<SettingsState>((set) => ({
  activeSection: 'general',
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
      const keys = SECTION_KEYS[section];
      if (!keys || keys.length === 0) return state;
      const patch: Partial<DockviewSettings> = {};
      keys.forEach((k) => {
        (patch as any)[k] = (DEFAULT_SETTINGS as any)[k];
      });
      return { settings: { ...state.settings, ...patch }, dirty: true };
    }),
  updateKeybinding: (id, shortcut) =>
    set((state) => ({
      keybindings: state.keybindings.map((kb) =>
        kb.id === id ? { ...kb, shortcut } : kb
      ),
      dirty: true,
    })),
  save: () => set({ dirty: false }),
}));
