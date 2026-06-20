import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useContainerStore, useTerminalStore } from '../../store';
import { TerminalTab } from '../../store/types';
import { ViewHeader } from '../shared/ui';
import {
  execSessionStart,
  execSessionWrite,
  execSessionStop,
  onExecOutput,
} from '../../backend/docker';
import { isTauri } from '../../backend/utils';

const TAB_COLORS = [
  'var(--blue)',
  'var(--green)',
  'var(--purple)',
  'var(--amber)',
  'var(--red)',
  'var(--cyan)',
  'var(--pink)',
];

const STORAGE_KEY = 'dock:terminal-history';

function loadPersisted(): TerminalTab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TerminalTab[];
  } catch {
    return [];
  }
}

function savePersisted(tabs: TerminalTab[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch {}
}

export default function TerminalView() {
  const terminalContainer = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionMapRef = useRef<Map<string, string>>(new Map());
  const unlistenRef = useRef<(() => void) | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [containerId, setContainerId] = useState('');
  const [shell, setShell] = useState('/bin/sh');
  const [persistedTabs, setPersistedTabs] = useState<TerminalTab[]>(() => loadPersisted());
  const [showHistory, setShowHistory] = useState(false);

  const { containers } = useContainerStore();
  const {
    tabs,
    activeTabId,
    addTab,
    restoreTab,
    closeTab,
    setActiveTab,
    pushLine,
    fontSize,
    setFontSize,
  } = useTerminalStore();

  const running = useMemo(
    () => containers.filter((c) => c.status === 'running'),
    [containers]
  );

  // Persist tabs on change
  useEffect(() => {
    savePersisted(tabs.filter((t) => t.history.length > 0));
  }, [tabs]);

  const activeSessionId = activeTabId ? sessionMapRef.current.get(activeTabId) ?? null : null;

  // Initialize xterm.js once
  useEffect(() => {
    if (!terminalContainer.current || termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize,
      fontFamily: 'IBM Plex Mono, monospace',
      theme: {
        background: '#0e0e10',
        foreground: '#f2f2f4',
        cursor: '#4d9eff',
        selectionBackground: '#4d9eff33',
        black: '#1c1c1f',
        red: '#f25f5c',
        green: '#3dd68c',
        yellow: '#f5a623',
        blue: '#4d9eff',
        magenta: '#a78bfa',
        cyan: '#4d9eff',
        white: '#a8a8b3',
        brightBlack: '#2e2e34',
        brightRed: '#f25f5c',
        brightGreen: '#3dd68c',
        brightYellow: '#f5a623',
        brightBlue: '#4d9eff',
        brightMagenta: '#a78bfa',
        brightCyan: '#4d9eff',
        brightWhite: '#f2f2f4',
      },
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalContainer.current);
    fit.fit();

    term.onData((data) => {
      const sid = activeSessionId;
      if (sid) execSessionWrite(sid, data).catch(() => {});
    });

    termRef.current = term;
    fitAddonRef.current = fit;

    return () => {
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  // Update xterm font size when changed
  useEffect(() => {
    if (termRef.current) {
      termRef.current.options.fontSize = fontSize;
    }
    fitAddonRef.current?.fit();
  }, [fontSize]);

  // Replay history when switching tabs
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;
    term.clear();
    for (const line of tab.history) {
      const prefix =
        line.type === 'input'
          ? '\r\n\x1b[32m$\x1b[0m '
          : line.type === 'error'
            ? '\r\n\x1b[31m'
            : line.type === 'system'
              ? '\r\n\x1b[33m'
              : '\r\n';
      const suffix = line.type === 'error' || line.type === 'system' ? '\x1b[0m' : '';
      term.writeln(prefix + line.content + suffix);
    }
  }, [activeTabId, tabs]);

  async function handleConnect() {
    if (!containerId || !isTauri() || connecting) return;
    setConnecting(true);

    try {
      const sid = await execSessionStart(containerId, shell);
      const container = running.find((c) => c.id === containerId);
      const label = container?.name ?? containerId.slice(0, 12);

      addTab({
        label,
        target: 'container',
        targetId: containerId,
        targetName: label,
        shell,
        cwd: '/',
        user: 'root',
        connected: true,
      });

      // Get the newly created tab id
      const state = useTerminalStore.getState();
      const tab = state.tabs[state.tabs.length - 1];
      sessionMapRef.current.set(tab.id, sid);

      // Listen for output
      const unsub = await onExecOutput((chunk) => {
        if (chunk.sessionId === sid) {
          termRef.current?.write(chunk.data.replace(/\n/g, '\r\n'));
          state.pushLine(tab.id, { type: 'output', content: chunk.data });
        }
      });
      unlistenRef.current = unsub;

      pushLine(tab.id, { type: 'system', content: `Connected via ${shell}` });
      termRef.current?.writeln('\r\n\x1b[32mConnected\x1b[0m via ' + shell);
    } catch (e: any) {
      termRef.current?.writeln('\r\n\x1b[31mError:\x1b[0m ' + (e?.message || String(e)));
    } finally {
      setConnecting(false);
    }
  }

  const handleDisconnect = useCallback(async () => {
    if (!activeTabId) return;
    const sid = sessionMapRef.current.get(activeTabId);
    if (sid) {
      sessionMapRef.current.delete(activeTabId);
      try {
        await execSessionStop(sid);
      } catch {}
    }
    pushLine(activeTabId, { type: 'system', content: 'Disconnected' });
    termRef.current?.writeln('\r\n\x1b[33mDisconnected\x1b[0m');
    unlistenRef.current?.();
    unlistenRef.current = null;
  }, [activeTabId, pushLine]);

  function handleCloseTab(id: string) {
    const sid = sessionMapRef.current.get(id);
    if (sid) {
      sessionMapRef.current.delete(id);
      execSessionStop(sid).catch(() => {});
    }
    closeTab(id);
  }

  function handleReplay(tab: TerminalTab) {
    setPersistedTabs((prev) => prev.filter((t) => t.id !== tab.id));
    restoreTab(tab);
    setShowHistory(false);
  }

  function handleDeletePersisted(id: string) {
    setPersistedTabs((prev) => prev.filter((t) => t.id !== id));
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unlistenRef.current?.();
    };
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <ViewHeader title="Terminal" subtitle="Execute commands inside containers" />

      {/* Tab bar */}
      {tabs.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            padding: '4px 8px 0',
            background: 'var(--bg2)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              className={`nav-item ${tab.id === activeTabId ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '0 0 auto',
                padding: '4px 10px',
                fontSize: 11,
                gap: 6,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                borderLeft: '1px solid transparent',
                borderRight: '1px solid transparent',
                borderTop: `2px solid ${TAB_COLORS[i % TAB_COLORS.length]}`,
              }}
            >
              <span style={{ flex: 1 }}>{tab.label}</span>
              {tab.connected && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
              )}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(tab.id);
                }}
                style={{ color: 'var(--text-2)', fontSize: 13, lineHeight: 1 }}
              >
                ×
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar" style={{ flexShrink: 0 }}>
        <select
          className="select"
          style={{ width: 220 }}
          value={containerId}
          onChange={(e) => setContainerId(e.target.value)}
          disabled={connecting}
        >
          <option value="">Select a running container…</option>
          {running.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.image?.split('/').pop()?.split(':')[0] ?? c.id.slice(0, 12)})
            </option>
          ))}
        </select>
        <input
          className="input mono"
          style={{ width: 110 }}
          value={shell}
          onChange={(e) => setShell(e.target.value)}
          placeholder="/bin/sh"
          disabled={connecting}
        />
        <select
          className="select mono"
          style={{ width: 60 }}
          value={fontSize}
          onChange={(e) => setFontSize(Number(e.target.value))}
        >
          {[10, 11, 12, 13, 14, 15, 16, 18, 20].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {!isTauri() && (
          <span style={{ color: 'var(--amber)', fontSize: 11, marginLeft: 8 }}>
            Terminal requires native app
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {persistedTabs.length > 0 && (
            <button className="btn" onClick={() => setShowHistory(!showHistory)}>
              History ({persistedTabs.length})
            </button>
          )}
          {activeSessionId ? (
            <button className="btn btn-danger" onClick={handleDisconnect}>
              Disconnect
            </button>
          ) : activeTab && !activeTab.connected ? (
            <button className="btn" onClick={() => addTab({ ...activeTab, connected: true })}>
              Reconnect
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={!containerId || connecting || !isTauri()}
            >
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* Terminal output area */}
      <div
        ref={terminalContainer}
        style={{ flex: 1, overflow: 'hidden', padding: '4px 0' }}
      />

      {/* History drawer */}
      {showHistory && persistedTabs.length > 0 && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--bg2)',
            maxHeight: 200,
            overflowY: 'auto',
            flexShrink: 0,
          }}
        >
          <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase' }}>
            Previous Sessions
          </div>
          {persistedTabs.map((tab) => (
            <div
              key={tab.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                fontSize: 12,
              }}
            >
              <span style={{ flex: 1 }}>
                {tab.label} — {tab.history.length} lines
              </span>
              <button className="btn" style={{ fontSize: 10 }} onClick={() => handleReplay(tab)}>
                Replay
              </button>
              <button className="btn" style={{ fontSize: 10 }} onClick={() => handleDeletePersisted(tab.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
