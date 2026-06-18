import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  ComposeService,
  ComposeStack,
  ComposeStackStatus,
  useAppStore,
  useComposeStore,
} from '../../store';
import { useResizeXRight } from '../shared/useResize';
import {
  Modal,
  Field,
  ViewHeader,
  StatusBadge,
  KVRow,
  Spinner,
} from '../shared/ui';
import { isTauri } from '../../backend/utils';
import { invoke } from '@tauri-apps/api/core';
import { ComposeFilter } from '../../store/composeStore';

const FILTERS: { id: ComposeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'running', label: 'Running' },
  { id: 'partial', label: 'Partial' },
  { id: 'stopped', label: 'Stopped' },
];

const STACK_TEMPLATE = `version: "3.9"
services:
  app:
    image: node:20-slim
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
`;

export default function ComposeView() {
  const {
    stacks,
    selectedId,
    filter,
    expandedIds,
    selectStack,
    setFilter,
    toggleExpanded,
    addStack,
    removeStack,
    updateStackStatus,
    updateServiceStatus,
    restartStack,
    pullLatest,
  } = useComposeStore();
  const { searchQuery } = useAppStore();

  const [showNewModal, setShowNewModal] = useState(false);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [pullModal, setPullModal] = useState<ComposeStack | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>(
    {}
  );

  const detail = useResizeXRight(340, 260, 580);
  const selected = stacks.find((s) => s.id === selectedId) ?? null;
  const running = stacks.filter((s) => s.status === 'running').length;
  const partial = stacks.filter((s) => s.status === 'partial').length;

  const filtered = stacks.filter((s) => {
    const matchFilter = filter === 'all' || s.status === filter;
    const matchSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.configPath.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  async function doStart(stack: ComposeStack) {
    setActionLoading((p) => ({ ...p, [stack.id]: 'start' }));
    try {
      if (isTauri())
        await invoke('compose_up', {
          projectDir: stack.configPath
            .replace('/docker-compose.yml', '')
            .replace('~/', ''),
        });
      updateStackStatus(stack.id, 'running');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading((p) => {
        const n = { ...p };
        delete n[stack.id];
        return n;
      });
    }
  }

  async function doStop(stack: ComposeStack) {
    setActionLoading((p) => ({ ...p, [stack.id]: 'stop' }));
    try {
      if (isTauri())
        await invoke('compose_down', {
          projectDir: stack.configPath
            .replace('/docker-compose.yml', '')
            .replace('~/', ''),
        });
      updateStackStatus(stack.id, 'stopped');
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading((p) => {
        const n = { ...p };
        delete n[stack.id];
        return n;
      });
    }
  }

  async function doRestart(stack: ComposeStack) {
    setActionLoading((p) => ({ ...p, [stack.id]: 'restart' }));
    try {
      restartStack(stack.id);
    } finally {
      setActionLoading((p) => {
        const n = { ...p };
        delete n[stack.id];
        return n;
      });
    }
  }

  const STATUS_COLOR: Record<ComposeStackStatus, string> = {
    running: 'var(--green)',
    partial: 'var(--amber)',
    stopped: 'var(--text-2)',
    degraded: 'var(--red)',
  };

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
        title="Compose"
        subtitle={`${stacks.length} stacks · ${running} running${partial > 0 ? ' · ' + partial + ' partial' : ''}`}
      />

      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={() => setShowNewModal(true)}
        >
          <Plus size={13} /> New stack
        </button>
        <button className="btn" onClick={() => setShowOpenModal(true)}>
          <FolderOpen size={13} /> Open file
        </button>
        <div className="toolbar-sep" />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={'filter-tab ' + (filter === f.id ? 'active' : '')}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '10px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {filtered.length === 0 ? (
            <div className="empty-state">
              <Layers size={32} style={{ opacity: 0.3 }} />
              <div>No stacks match the filter.</div>
              <button
                className="btn btn-primary"
                onClick={() => setShowNewModal(true)}
              >
                <Plus size={13} /> New stack
              </button>
            </div>
          ) : (
            filtered.map((stack) => {
              const expanded = expandedIds.includes(stack.id);
              const isSelected = selectedId === stack.id;
              const loading = actionLoading[stack.id];
              return (
                <div
                  key={stack.id}
                  style={{
                    borderRadius: 6,
                    border:
                      '1px solid ' +
                      (isSelected ? 'rgba(77,158,255,0.3)' : 'var(--border)'),
                    background: isSelected ? 'var(--blue-dim)' : 'var(--bg2)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      cursor: 'pointer',
                    }}
                    onClick={() => selectStack(isSelected ? null : stack.id)}
                  >
                    <button
                      className="btn-icon"
                      style={{ width: 20, height: 20 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(stack.id);
                      }}
                    >
                      {expanded ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </button>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: 'var(--bg4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Layers
                        size={15}
                        style={{ color: STATUS_COLOR[stack.status] }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          className="mono"
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--text-0)',
                          }}
                        >
                          {stack.name}
                        </span>
                        <StatusBadge status={stack.status} />
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: 'var(--text-2)',
                          marginTop: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {stack.configPath}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginRight: 10,
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div
                          className="mono"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--green)',
                          }}
                        >
                          {
                            stack.services.filter((s) => s.status === 'running')
                              .length
                          }
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: 9, color: 'var(--text-2)' }}
                        >
                          running
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div
                          className="mono"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--text-1)',
                          }}
                        >
                          {stack.services.length}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: 9, color: 'var(--text-2)' }}
                        >
                          total
                        </div>
                      </div>
                    </div>
                    <div
                      style={{ display: 'flex', gap: 4, flexShrink: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {stack.status === 'running' ||
                      stack.status === 'partial' ? (
                        <button
                          className="btn btn-danger"
                          style={{
                            padding: '3px 8px',
                            height: 24,
                            fontSize: 11,
                          }}
                          onClick={() => doStop(stack)}
                          disabled={!!loading}
                        >
                          {loading === 'stop' ? (
                            <Spinner size={12} />
                          ) : (
                            <>
                              <Square size={12} /> Stop
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          style={{
                            padding: '3px 8px',
                            height: 24,
                            fontSize: 11,
                          }}
                          onClick={() => doStart(stack)}
                          disabled={!!loading}
                        >
                          {loading === 'start' ? (
                            <Spinner size={12} />
                          ) : (
                            <>
                              <Play size={12} /> Start
                            </>
                          )}
                        </button>
                      )}
                      <button
                        className="btn"
                        style={{ padding: '3px 8px', height: 24, fontSize: 11 }}
                        onClick={() => setPullModal(stack)}
                      >
                        <UploadCloud size={12} /> Pull
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => {
                          if (confirm('Remove stack "' + stack.name + '"?')) {
                            removeStack(stack.id);
                            if (isSelected) selectStack(null);
                          }
                        }}
                      >
                        <Trash2 size={13} style={{ color: 'var(--red)' }} />
                      </button>
                    </div>
                  </div>
                  {expanded && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 120px 90px 70px 120px',
                        }}
                      >
                        {['Service', 'Image', 'Status', 'CPU', 'Ports'].map(
                          (h) => (
                            <div
                              key={h}
                              className="mono"
                              style={{
                                fontSize: 9.5,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: 'var(--text-2)',
                                padding: '5px 12px',
                                borderBottom: '1px solid var(--border)',
                                background: 'var(--bg1)',
                              }}
                            >
                              {h}
                            </div>
                          )
                        )}
                        {stack.services.map((svc) => (
                          <React.Fragment key={svc.name}>
                            <div
                              style={{
                                padding: '7px 12px',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <div
                                  style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    background:
                                      svc.status === 'running'
                                        ? 'var(--green)'
                                        : 'var(--text-2)',
                                    flexShrink: 0,
                                  }}
                                />
                                <span
                                  className="mono"
                                  style={{
                                    fontSize: 12,
                                    color: 'var(--text-0)',
                                    fontWeight: 500,
                                  }}
                                >
                                  {svc.name}
                                </span>
                              </div>
                            </div>
                            <div
                              style={{
                                padding: '7px 12px',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <span
                                className="mono"
                                style={{
                                  fontSize: 10.5,
                                  color: 'var(--text-2)',
                                }}
                              >
                                {svc.image.split(':')[0]}
                              </span>
                            </div>
                            <div
                              style={{
                                padding: '7px 12px',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <StatusBadge
                                status={
                                  svc.status === 'running'
                                    ? 'running'
                                    : 'stopped'
                                }
                              />
                            </div>
                            <div
                              style={{
                                padding: '7px 12px',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <span className="mono" style={{ fontSize: 11 }}>
                                {svc.cpu}%
                              </span>
                            </div>
                            <div
                              style={{
                                padding: '7px 12px',
                                borderBottom: '1px solid var(--border)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: 3,
                                }}
                              >
                                {svc.ports.slice(0, 1).map((p) => (
                                  <span key={p} className="port-tag">
                                    {p}
                                  </span>
                                ))}
                                {svc.ports.length > 1 && (
                                  <span className="tag">
                                    +{svc.ports.length - 1}
                                  </span>
                                )}
                                {svc.ports.length === 0 && (
                                  <span
                                    style={{
                                      color: 'var(--text-2)',
                                      fontSize: 11,
                                    }}
                                  >
                                    —
                                  </span>
                                )}
                              </div>
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {selected && (
          <>
            <div
              ref={detail.handleRef}
              className="resize-handle"
              onMouseDown={detail.onMouseDown}
            />
            <div className="detail-panel" style={{ width: detail.width }}>
              <div className="detail-panel-head">
                <div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text-0)',
                    }}
                  >
                    {selected.name}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--text-2)',
                      marginTop: 2,
                    }}
                  >
                    {selected.project}
                  </div>
                </div>
                <button className="btn-icon" onClick={() => selectStack(null)}>
                  ✕
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                <StatusBadge status={selected.status} />
                <div style={{ marginTop: 14 }}>
                  <div
                    className="mono"
                    style={{
                      fontSize: 9.5,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: 'var(--text-2)',
                      marginBottom: 8,
                    }}
                  >
                    Info
                  </div>
                  <div className="detail-kv" style={{ rowGap: 8 }}>
                    <KVRow label="Config" value={selected.configPath} />
                    <KVRow label="Created" value={selected.created} />
                    <KVRow label="Last started" value={selected.lastStarted} />
                    <KVRow
                      label="Networks"
                      value={selected.networks.join(', ') || '—'}
                    />
                    <KVRow
                      label="Volumes"
                      value={selected.volumes.join(', ') || '—'}
                    />
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <div
                    className="mono"
                    style={{
                      fontSize: 9.5,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: 'var(--text-2)',
                      marginBottom: 8,
                    }}
                  >
                    Services
                  </div>
                  {selected.services.map((svc) => (
                    <div
                      key={svc.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 0',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background:
                            svc.status === 'running'
                              ? 'var(--green)'
                              : 'var(--text-2)',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="mono"
                          style={{
                            fontSize: 11.5,
                            color: 'var(--text-0)',
                            fontWeight: 500,
                          }}
                        >
                          {svc.name}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: 10, color: 'var(--text-2)' }}
                        >
                          {svc.image}
                        </div>
                      </div>
                      <button
                        className="btn-icon"
                        onClick={() =>
                          updateServiceStatus(
                            selected.id,
                            svc.name,
                            svc.status === 'running' ? 'stopped' : 'running'
                          )
                        }
                      >
                        {svc.status === 'running' ? (
                          <Square size={12} />
                        ) : (
                          <Play size={12} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  {selected.status === 'running' ||
                  selected.status === 'partial' ? (
                    <button
                      className="btn btn-danger"
                      style={{ justifyContent: 'center' }}
                      onClick={() => doStop(selected)}
                    >
                      <Square size={13} /> Stop stack
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      style={{ justifyContent: 'center' }}
                      onClick={() => doStart(selected)}
                    >
                      <Play size={13} /> Start stack
                    </button>
                  )}
                  <button
                    className="btn"
                    style={{ justifyContent: 'center' }}
                    onClick={() => doRestart(selected)}
                  >
                    <RefreshCw size={13} /> Restart
                  </button>
                  <button
                    className="btn"
                    style={{ justifyContent: 'center' }}
                    onClick={() => setPullModal(selected)}
                  >
                    <UploadCloud size={13} /> Pull latest
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ justifyContent: 'center' }}
                    onClick={() => {
                      if (confirm('Remove "' + selected.name + '"?')) {
                        removeStack(selected.id);
                        selectStack(null);
                      }
                    }}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showNewModal && (
        <NewStackModal
          onClose={() => setShowNewModal(false)}
          onAdd={(s) => {
            addStack(s);
            setShowNewModal(false);
          }}
        />
      )}
      {showOpenModal && (
        <OpenFileModal
          onClose={() => setShowOpenModal(false)}
          onAdd={(s) => {
            addStack(s);
            setShowOpenModal(false);
          }}
        />
      )}
      {pullModal && (
        <PullLatestModal
          stack={pullModal}
          onClose={() => setPullModal(null)}
          onPull={() => {
            pullLatest(pullModal.id);
            setPullModal(null);
          }}
        />
      )}
    </div>
  );
}

function parseServices(y: string): ComposeService[] {
  const matches = [...y.matchAll(/^  ([a-zA-Z0-9_-]+):\s*$/gm)].map(
    (m) => m[1]
  );
  return matches.map((svcName) => {
    const imageMatch = y.match(
      new RegExp(svcName + ':[\\s\\S]*?image:\\s*([^\\n]+)')
    );
    const portsMatch = [
      ...y.matchAll(new RegExp(svcName + ':[\\s\\S]*?- "(\\d+:\\d+)"', 'g')),
    ].map((m) => m[1]);
    return {
      name: svcName,
      image: imageMatch?.[1]?.trim() ?? 'unknown',
      status: 'stopped' as const,
      replicas: 1,
      running: 0,
      ports: portsMatch,
      cpu: 0,
      memory: '0 MB',
      containerId: crypto.randomUUID().slice(0, 8),
    };
  });
}

function NewStackModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (s: ComposeStack) => void;
}) {
  const [name, setName] = useState('');
  const [configPath, setConfigPath] = useState('');
  const [yaml, setYaml] = useState(STACK_TEMPLATE);
  const [tab, setTab] = useState<'editor' | 'options'>('editor');
  const [error, setError] = useState('');

  function handleCreate() {
    if (!name.trim()) {
      setError('Stack name is required.');
      return;
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name.trim())) {
      setError('Name: letters, numbers, _ or - only');
      return;
    }
    const services = parseServices(yaml);
    onAdd({
      id: 'stack-' + name.trim() + '-' + Date.now(),
      name: name.trim(),
      project: name.trim(),
      configPath:
        configPath.trim() || '~/' + name.trim() + '/docker-compose.yml',
      status: 'stopped',
      services:
        services.length > 0
          ? services
          : [
              {
                name: 'app',
                image: 'unknown',
                status: 'stopped',
                replicas: 1,
                running: 0,
                ports: [],
                cpu: 0,
                memory: '0 MB',
                containerId: crypto.randomUUID().slice(0, 8),
              },
            ],
      created: new Date().toISOString().slice(0, 10),
      lastStarted: 'never',
      networks: [],
      volumes: [],
    });
  }

  return (
    <Modal
      title="New Compose stack"
      onClose={onClose}
      width={600}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleCreate}>
            <Plus size={13} /> Create stack
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <Field label="Stack name *" error={error}>
            <input
              className={'input mono' + (error ? ' error' : '')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="my-stack"
              autoFocus
            />
          </Field>
          <Field label="Config path" hint="Leave blank to use default location">
            <input
              className="input mono"
              value={configPath}
              onChange={(e) => setConfigPath(e.target.value)}
              placeholder="~/project/docker-compose.yml"
            />
          </Field>
        </div>
        <div
          style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}
        >
          {(['editor', 'options'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontFamily: 'IBM Plex Mono, monospace',
                color: tab === t ? 'var(--blue)' : 'var(--text-2)',
                background: 'none',
                border: 'none',
                borderBottom:
                  '2px solid ' + (tab === t ? 'var(--blue)' : 'transparent'),
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === 'editor' && (
          <div>
            <div
              className="mono"
              style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 6 }}
            >
              docker-compose.yml — services parsed automatically
            </div>
            <textarea
              className="yaml-editor"
              value={yaml}
              onChange={(e) => setYaml(e.target.value)}
              rows={16}
              spellCheck={false}
            />
          </div>
        )}
        {tab === 'options' && (
          <div
            style={{
              color: 'var(--text-2)',
              fontSize: 12.5,
              padding: '8px 0',
              lineHeight: 1.6,
            }}
          >
            Stack will be created in{' '}
            <strong style={{ color: 'var(--text-1)' }}>stopped state</strong>.
            Start it from the main view.
          </div>
        )}
      </div>
    </Modal>
  );
}

function OpenFileModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (s: ComposeStack) => void;
}) {
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const recents = [
    '~/Documents/Mke5/dockview/docker-compose.yml',
    '~/infra/monitoring/docker-compose.yml',
    '~/projects/worker/docker-compose.yml',
    '~/infra/traefik/docker-compose.yml',
  ];

  async function handleBrowse() {
    if (isTauri()) {
      console.log('isTauri:', isTauri());
      try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const sel = await open({
          filters: [{ name: 'Compose files', extensions: ['yml', 'yaml'] }],
        });
        console.log('selected:', sel);
        if (sel && typeof sel === 'string') {
          setPath(sel);
          setError('');
        }
      } catch (err) {
        console.error('Browse failed:', err);
      }
    }
  }

  function handleOpen() {
    if (!path.trim()) {
      setError('File path is required.');
      return;
    }
    const n = name.trim() || path.split('/').slice(-2, -1)[0] || 'new-stack';
    onAdd({
      id: 'stack-' + n + '-' + Date.now(),
      name: n,
      project: n,
      configPath: path.trim(),
      status: 'stopped',
      services: [
        {
          name: 'app',
          image: 'unknown',
          status: 'stopped',
          replicas: 1,
          running: 0,
          ports: [],
          cpu: 0,
          memory: '0 MB',
          containerId: crypto.randomUUID().slice(0, 8),
        },
      ],
      created: new Date().toISOString().slice(0, 10),
      lastStarted: 'never',
      networks: [],
      volumes: [],
    });
  }

  return (
    <Modal
      title="Open compose file"
      onClose={onClose}
      width={500}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleOpen}>
            <FolderOpen size={13} /> Open
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field
          label="File path"
          error={error}
          hint="Full path to your docker-compose.yml"
        >
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              className={'input mono' + (error ? ' error' : '')}
              style={{ flex: 1 }}
              value={path}
              onChange={(e) => {
                setPath(e.target.value);
                setError('');
              }}
              placeholder="~/project/docker-compose.yml"
              autoFocus
            />
            <button className="btn" onClick={handleBrowse}>
              <FolderOpen size={13} /> Browse
            </button>
          </div>
        </Field>
        <Field label="Stack name" hint="Optional — inferred from path if blank">
          <input
            className="input mono"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-stack"
          />
        </Field>
        <div>
          <div
            className="mono"
            style={{
              fontSize: 9.5,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: 'var(--text-2)',
              marginBottom: 8,
            }}
          >
            Recent files
          </div>
          {recents.map((f) => (
            <button
              key={f}
              onClick={() => {
                setPath(f);
                setName(f.split('/').slice(-2, -1)[0] || '');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                borderRadius: 4,
                border:
                  '1px solid ' +
                  (path === f ? 'rgba(77,158,255,0.3)' : 'var(--border)'),
                background: path === f ? 'var(--blue-dim)' : 'var(--bg3)',
                textAlign: 'left',
                cursor: 'pointer',
                width: '100%',
                marginBottom: 4,
              }}
            >
              <FolderOpen
                size={12}
                style={{
                  color: path === f ? 'var(--blue)' : 'var(--text-2)',
                  flexShrink: 0,
                }}
              />
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  color: path === f ? 'var(--blue)' : 'var(--text-1)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {f}
              </span>
              {path === f && <span style={{ color: 'var(--blue)' }}>✓</span>}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function PullLatestModal({
  stack,
  onClose,
  onPull,
}: {
  stack: ComposeStack;
  onClose: () => void;
  onPull: () => void;
}) {
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  function handlePull() {
    setPulling(true);
    const init: Record<string, number> = {};
    stack.services.forEach((s) => {
      init[s.name] = 0;
    });
    setProgress(init);
    let completed = 0;
    stack.services.forEach((svc) => {
      const speed = Math.random() * 12 + 5;
      const iv = setInterval(() => {
        setProgress((prev) => {
          const next = {
            ...prev,
            [svc.name]: Math.min((prev[svc.name] ?? 0) + speed, 100),
          };
          if (next[svc.name] >= 100) {
            clearInterval(iv);
            completed++;
            if (completed === stack.services.length)
              setTimeout(() => {
                setDone(true);
                setPulling(false);
              }, 300);
          }
          return next;
        });
      }, 160);
    });
  }

  return (
    <Modal
      title={'Pull latest — ' + stack.name}
      onClose={onClose}
      width={460}
      footer={
        done ? (
          <>
            <button className="btn" onClick={onClose}>
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onPull();
                onClose();
              }}
            >
              <RefreshCw size={13} /> Restart with new images
            </button>
          </>
        ) : (
          <>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePull}
              disabled={pulling}
            >
              {pulling ? (
                <>
                  <Spinner size={13} /> Pulling…
                </>
              ) : (
                'Pull all images'
              )}
            </button>
          </>
        )
      }
    >
      {done ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--green-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <span style={{ color: 'var(--green)', fontSize: 20 }}>✓</span>
          </div>
          <div
            style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}
          >
            All images up to date
          </div>
          <div
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}
          >
            {stack.services.length} images pulled for {stack.name}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p
            style={{ fontSize: 12.5, color: 'var(--text-1)', lineHeight: 1.6 }}
          >
            Pull the latest version of all {stack.services.length} service
            images.
          </p>
          {stack.services.map((svc) => {
            const pct = progress[svc.name] ?? 0;
            return (
              <div
                key={svc.name}
                style={{
                  background: 'var(--bg3)',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: pulling ? 6 : 0,
                  }}
                >
                  <div>
                    <span
                      className="mono"
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: 'var(--text-0)',
                      }}
                    >
                      {svc.name}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: 'var(--text-2)',
                        marginLeft: 8,
                      }}
                    >
                      {svc.image}
                    </span>
                  </div>
                  {pulling && (
                    <span
                      className="mono"
                      style={{
                        fontSize: 11,
                        color: pct >= 100 ? 'var(--green)' : 'var(--blue)',
                      }}
                    >
                      {pct >= 100 ? '✓ Done' : Math.round(pct) + '%'}
                    </span>
                  )}
                </div>
                {pulling && (
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: pct + '%',
                        background: pct >= 100 ? 'var(--green)' : 'var(--blue)',
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
