import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Save, RotateCcw } from 'lucide-react';
import { useAppStore, useSettingsStore } from '../../store';
import {
  SettingsSection,
  ThemeOption,
  UpdateChannel,
  LoggingDriver,
} from '../../store/types';
import { Toggle, Field } from '../shared/ui';
import {
  dockerPing,
  dockerSystemInfo,
  setDockerHost,
  SystemInfo,
} from '../../backend/docker';
import { isTauri } from '../../backend/utils';
import {
  checkForUpdates,
  installUpdate,
  UpdateInfo,
} from '../../backend/updater';

const SECTIONS: { id: SettingsSection; label: string; hint: string }[] = [
  { id: 'general', label: 'General', hint: 'Theme, startup, updates' },
  { id: 'engine', label: 'Engine', hint: 'Host and runtime defaults' },
  { id: 'resources', label: 'Resources', hint: 'Host CPU and memory' },
  { id: 'network', label: 'Network', hint: 'DNS for new containers' },
  { id: 'keybindings', label: 'Keybindings', hint: 'Keyboard shortcuts' },
  { id: 'about', label: 'About', hint: 'Build info and release channel' },
];

export default function SettingsView() {
  const {
    activeSection,
    settings,
    dirty,
    keybindings,
    setSection,
    updateSetting,
    resetSection,
    save,
  } = useSettingsStore();
  const { setEngineRunning } = useAppStore();
  const appliedHostRef = useRef(settings.dockerHost);
  const [applyingHost, setApplyingHost] = useState(false);
  const [hostError, setHostError] = useState('');

  async function handleSave() {
    save();
    if (!isTauri() || settings.dockerHost === appliedHostRef.current) return;
    setApplyingHost(true);
    setHostError('');
    try {
      await setDockerHost(settings.dockerHost);
      appliedHostRef.current = settings.dockerHost;
      setEngineRunning(await dockerPing());
    } catch (e) {
      setHostError(e instanceof Error ? e.message : String(e));
    } finally {
      setApplyingHost(false);
    }
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 8px',
          overflow: 'hidden',
          background: 'var(--bg1)',
        }}
      >
        <div style={{ padding: '2px 8px 12px' }}>
          <div
            style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)' }}
          >
            Settings
          </div>
          <div
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 2 }}
          >
            Configure runtime behavior
          </div>
        </div>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className={'nav-item' + (activeSection === s.id ? ' active' : '')}
            onClick={() => setSection(s.id)}
          >
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{s.label}</div>
              <div
                className="mono"
                style={{ fontSize: 9.5, color: 'var(--text-2)', marginTop: 1 }}
              >
                {s.hint}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Toolbar */}
        <div className="toolbar">
          <span className={'badge badge-' + (dirty ? 'partial' : 'success')}>
            {dirty ? 'Unsaved changes' : 'Saved'}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              className="btn"
              onClick={() => resetSection(activeSection)}
              disabled={
                activeSection === 'about' || activeSection === 'keybindings'
              }
            >
              <RotateCcw size={13} /> Reset section
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void handleSave()}
              disabled={!dirty || applyingHost}
            >
              <Save size={13} /> {applyingHost ? 'Applying…' : 'Save changes'}
            </button>
          </div>
        </div>
        {hostError && (
          <div
            style={{
              padding: '8px 24px',
              fontSize: 11,
              color: 'var(--red)',
              background: 'var(--red-dim)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            Failed to connect to Docker host: {hostError}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {activeSection === 'general' && (
            <SettingsCard
              title="General"
              subtitle="Appearance, startup and update preferences"
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <Field label="Theme">
                  <select
                    className="select"
                    value={settings.theme}
                    onChange={(e) =>
                      updateSetting('theme', e.target.value as ThemeOption)
                    }
                  >
                    {['dark', 'darker', 'light', 'system'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Update channel">
                  <select
                    className="select"
                    value={settings.updateChannel}
                    onChange={(e) =>
                      updateSetting(
                        'updateChannel',
                        e.target.value as UpdateChannel
                      )
                    }
                  >
                    {['stable', 'beta', 'nightly'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Language">
                  <input
                    className="input"
                    value={settings.language}
                    onChange={(e) => updateSetting('language', e.target.value)}
                  />
                </Field>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                <Toggle
                  label="Start on login"
                  value={settings.startOnLogin}
                  onChange={(v) => updateSetting('startOnLogin', v)}
                />
                <Toggle
                  label="Minimize to tray"
                  value={settings.minimizeToTray}
                  onChange={(v) => updateSetting('minimizeToTray', v)}
                />
                <Toggle
                  label="Show system tray icon"
                  value={settings.showSystemTray}
                  onChange={(v) => updateSetting('showSystemTray', v)}
                />
                <Toggle
                  label="Auto-check updates"
                  value={settings.checkUpdatesAuto}
                  onChange={(v) => updateSetting('checkUpdatesAuto', v)}
                />
                <Toggle
                  label="Telemetry"
                  value={settings.telemetry}
                  onChange={(v) => updateSetting('telemetry', v)}
                />
                <Toggle
                  label="Crash reports"
                  value={settings.crashReports}
                  onChange={(v) => updateSetting('crashReports', v)}
                />
              </div>
            </SettingsCard>
          )}

          {activeSection === 'engine' && (
            <SettingsCard
              title="Engine"
              subtitle="Docker socket, TLS and logging configuration"
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <Field
                  label="Docker host"
                  hint="Applies on save — unix:// or tcp://"
                >
                  <input
                    className="input mono"
                    value={settings.dockerHost}
                    onChange={(e) =>
                      updateSetting('dockerHost', e.target.value)
                    }
                  />
                </Field>
                <Field label="Context name">
                  <input
                    className="input mono"
                    value={settings.contextName}
                    onChange={(e) =>
                      updateSetting('contextName', e.target.value)
                    }
                  />
                </Field>
                <Field label="Logging driver">
                  <select
                    className="select"
                    value={settings.loggingDriver}
                    onChange={(e) =>
                      updateSetting(
                        'loggingDriver',
                        e.target.value as LoggingDriver
                      )
                    }
                  >
                    {['json-file', 'local', 'syslog', 'none'].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Log max size">
                  <input
                    className="input mono"
                    value={settings.logMaxSize}
                    onChange={(e) =>
                      updateSetting('logMaxSize', e.target.value)
                    }
                  />
                </Field>
                <Field label="Log max files">
                  <input
                    className="input"
                    type="number"
                    value={settings.logMaxFiles}
                    onChange={(e) =>
                      updateSetting('logMaxFiles', +e.target.value)
                    }
                  />
                </Field>
              </div>
            </SettingsCard>
          )}

          {activeSection === 'resources' && (
            <SettingsCard
              title="Resources"
              subtitle="Live resources reported by the Docker daemon"
            >
              <HostResources />
            </SettingsCard>
          )}

          {activeSection === 'network' && (
            <SettingsCard
              title="Network"
              subtitle="DNS server used when running new containers"
            >
              <Field
                label="DNS server"
                hint="Applied to containers run from this app"
              >
                <input
                  className="input mono"
                  value={settings.dnsServer}
                  onChange={(e) => updateSetting('dnsServer', e.target.value)}
                />
              </Field>
            </SettingsCard>
          )}

          {activeSection === 'keybindings' && (
            <SettingsCard
              title="Keybindings"
              subtitle="Keyboard shortcut configuration"
            >
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr',
                    padding: '6px 12px',
                    background: 'var(--bg0)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {['Action', 'Category', 'Shortcut'].map((h) => (
                    <span
                      key={h}
                      className="mono"
                      style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--text-2)',
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
                {keybindings.map((kb) => (
                  <div
                    key={kb.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border)',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: 'var(--text-0)' }}>
                      {kb.action}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                      {kb.category}
                    </span>
                    <span className="tag mono">{kb.shortcut}</span>
                  </div>
                ))}
              </div>
            </SettingsCard>
          )}

          {activeSection === 'about' && (
            <SettingsCard
              title="About Dock"
              subtitle="Build information and release channel"
            >
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-1)',
                  lineHeight: 1.7,
                  marginBottom: 16,
                }}
              >
                Dock is a local-first Docker control surface built with Tauri
                and React. It provides a clear, fast interface for managing
                containers, images, volumes, networks, and Compose stacks.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {[
                  ['Version', '0.1.0'],
                  ['Update channel', settings.updateChannel],
                  ['Theme', settings.theme],
                  ['Runtime context', settings.contextName],
                  ['Docker host', settings.dockerHost],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 4,
                      border: '1px solid var(--border)',
                      background: 'var(--bg2)',
                    }}
                  >
                    <div
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: 'var(--text-2)',
                        marginBottom: 3,
                      }}
                    >
                      {k}
                    </div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 12.5,
                        color: 'var(--text-0)',
                        fontWeight: 500,
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <UpdateSection />
            </SettingsCard>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes >= 1 << 30) return `${(bytes / (1 << 30)).toFixed(1)} GB`;
  if (bytes >= 1 << 20) return `${(bytes / (1 << 20)).toFixed(0)} MB`;
  return `${bytes} B`;
}

function HostResources() {
  const [info, setInfo] = useState<SystemInfo | null>(null);

  useEffect(() => {
    if (!isTauri()) return;
    dockerSystemInfo()
      .then(setInfo)
      .catch(() => {});
  }, []);

  if (!isTauri()) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
        Live host resources are available in the native app.
      </div>
    );
  }
  if (!info) {
    return (
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
        Fetching host resources…
      </div>
    );
  }

  const rows: [string, string][] = [
    ['CPU cores', String(info.cpuCount)],
    ['Total memory', formatBytes(info.totalMemory)],
    ['Containers running', String(info.containersRunning)],
    ['Containers stopped', String(info.containersStopped)],
    ['Containers paused', String(info.containersPaused)],
    ['Images', String(info.imagesCount)],
    ['Kernel', info.kernelVersion],
    ['Storage driver', info.storageDriver],
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}
    >
      {rows.map(([k, v]) => (
        <div
          key={k}
          style={{
            padding: '10px 12px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'var(--bg3)',
          }}
        >
          <div
            className="mono"
            style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 3 }}
          >
            {k}
          </div>
          <div
            className="mono"
            style={{ fontSize: 12.5, color: 'var(--text-0)', fontWeight: 500 }}
          >
            {v || '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

function UpdateSection() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checking, setChecking] = useState(false);

  const handleCheck = useCallback(async () => {
    setChecking(true);
    const info = await checkForUpdates();
    setUpdateInfo(info);
    setChecking(false);
  }, []);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <button
          className="btn"
          onClick={() => void handleCheck()}
          disabled={checking}
        >
          <RefreshCw
            size={12}
            style={{
              marginRight: 4,
              ...(checking ? { animation: 'spin 1s linear infinite' } : {}),
            }}
          />
          {checking ? 'Checking…' : 'Check for Updates'}
        </button>
        {updateInfo?.available && (
          <button
            className="btn btn-primary"
            onClick={() => void installUpdate()}
          >
            Update to v{updateInfo.version}
          </button>
        )}
      </div>
      {updateInfo && (
        <div
          style={{
            fontSize: 12,
            color: updateInfo.available ? 'var(--green)' : 'var(--text-2)',
          }}
        >
          {updateInfo.available
            ? `Update v${updateInfo.version} available`
            : 'You are on the latest version'}
        </div>
      )}
    </div>
  );
}

function SettingsCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-0)' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
            {subtitle}
          </div>
        )}
      </div>
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '16px',
          background: 'var(--bg2)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
