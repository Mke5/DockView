import React, { useCallback, useEffect, useMemo } from 'react';

import Titlebar from './components/layout/Titlebar';
import Sidebar from './components/layout/Sidebar';
import StatusBar from './components/layout/StatusBar';
import ContainersView from './components/views/ContainersView';
import ImagesView from './components/views/ImagesView';
import ComposeView from './components/views/ComposeView';
import RegistryView from './components/views/RegistryView';
import SettingsView from './components/views/SettingsView';
import {
  VolumesView,
  NetworksView,
  BuildsView,
  LogsView,
} from './components/views/OtherViews';
import TerminalView from './components/views/TerminalView';
import { useAppStore } from './store';
import { isTauri } from './backend/utils';
import { initDockerBridge } from './backend/bridge';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

const VIEW_ORDER = [
  'containers',
  'images',
  'volumes',
  'networks',
  'compose',
  'builds',
  'registry',
  'logs',
  'terminal',
  'settings',
] as const;

export default function App() {
  const { activeView, setEngineRunning, setActiveView } = useAppStore();

  useEffect(() => {
    if (!isTauri()) return;
    initDockerBridge()
      .then(() => setEngineRunning(true))
      .catch(() => setEngineRunning(false));
  }, []);

  const shortcuts = useMemo(() => [
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        const el = document.querySelector<HTMLInputElement>('[data-search]');
        el?.focus();
      },
    },
    {
      key: '/',
      ctrl: true,
      handler: () => {
        const idx = VIEW_ORDER.indexOf(activeView as typeof VIEW_ORDER[number]);
        const next = VIEW_ORDER[(idx + 1) % VIEW_ORDER.length];
        setActiveView(next);
      },
    },
  ], [activeView, setActiveView]);

  useKeyboardShortcuts(shortcuts);

  const renderView = useCallback(() => {
    const views: Record<string, React.ReactNode> = {
      containers: <ContainersView />,
      images: <ImagesView />,
      volumes: <VolumesView />,
      networks: <NetworksView />,
      compose: <ComposeView />,
      builds: <BuildsView />,
      registry: <RegistryView />,
      logs: <LogsView />,
      terminal: <TerminalView />,
      settings: <SettingsView />,
    };
    return views[activeView] ?? null;
  }, [activeView]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Titlebar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: 'var(--bg1)',
          }}
        >
          <ErrorBoundary name={activeView} key={activeView}>
            {renderView()}
          </ErrorBoundary>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
