import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useContainerStore } from '../../store';
import { ViewHeader } from '../shared/ui';
import {
  execSessionStart,
  execSessionWrite,
  execSessionStop,
  onExecOutput,
} from '../../backend/docker';
import { isTauri } from '../../backend/utils';

export default function TerminalView() {
  const terminalContainer = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [containerId, setContainerId] = useState('');
  const [shell, setShell] = useState('/bin/sh');
  const [connecting, setConnecting] = useState(false);
  const { containers } = useContainerStore();
  const running = containers.filter((c) => c.status === 'running');

  // Initialize xterm.js once
  useEffect(() => {
    if (!terminalContainer.current || termRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 12,
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
      const sid = sessionIdRef.current;
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

  // Fit terminal on resize
  useEffect(() => {
    const onResize = () => fitAddonRef.current?.fit();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Connect to container
  async function handleConnect() {
    if (!containerId || !isTauri() || connecting) return;
    setConnecting(true);
    const term = termRef.current;
    if (!term) return;

    try {
      const sid = await execSessionStart(containerId, shell);
      sessionIdRef.current = sid;
      setSessionId(sid);

      term.clear();

      const unsub = await onExecOutput((chunk) => {
        if (chunk.sessionId === sid) {
          termRef.current?.write(chunk.data.replace(/\n/g, '\r\n'));
        }
      });
      unlistenRef.current = unsub;

      term.writeln('\r\n\x1b[32mConnected\x1b[0m to container via ' + shell);
    } catch (e: any) {
      term.writeln(
        '\r\n\x1b[31mError:\x1b[0m ' + (e?.message || String(e))
      );
    } finally {
      setConnecting(false);
    }
  }

  // Disconnect
  async function handleDisconnect() {
    const term = termRef.current;
    const sid = sessionIdRef.current;
    if (sid) {
      sessionIdRef.current = null;
      setSessionId(null);
      try {
        await execSessionStop(sid);
      } catch {}
      term?.writeln('\r\n\x1b[33mDisconnected\x1b[0m');
    }
    unlistenRef.current?.();
    unlistenRef.current = null;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <ViewHeader
        title="Terminal"
        subtitle="Execute commands inside containers"
      />
      <div className="toolbar">
        <select
          className="select"
          style={{ width: 220 }}
          value={containerId}
          onChange={(e) => setContainerId(e.target.value)}
          disabled={!!sessionId}
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
          disabled={!!sessionId}
        />
        {!isTauri() && (
          <span style={{ color: 'var(--amber)', fontSize: 11, marginLeft: 8 }}>
            Terminal requires native app
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {sessionId ? (
            <button className="btn btn-danger" onClick={handleDisconnect}>
              Disconnect
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleConnect}
              disabled={
                !containerId || connecting || !isTauri()
              }
            >
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          )}
        </div>
      </div>
      <div
        ref={terminalContainer}
        style={{ flex: 1, overflow: 'hidden', padding: '4px 0' }}
      />
    </div>
  );
}
