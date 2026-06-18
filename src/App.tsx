import React, { useEffect } from 'react';

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

export default function App() {
  const { activeView, setEngineRunning } = useAppStore();

  useEffect(() => {
    if (!isTauri()) return;
    initDockerBridge()
      .then(() => setEngineRunning(true))
      .catch(() => setEngineRunning(false));
  }, []);

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
          {activeView === 'containers' && <ContainersView />}
          {activeView === 'images' && <ImagesView />}
          {activeView === 'volumes' && <VolumesView />}
          {activeView === 'networks' && <NetworksView />}
          {activeView === 'compose' && <ComposeView />}
          {activeView === 'builds' && <BuildsView />}
          {activeView === 'registry' && <RegistryView />}
          {activeView === 'logs' && <LogsView />}
          {activeView === 'terminal' && <TerminalView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
