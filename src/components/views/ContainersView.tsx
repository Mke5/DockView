import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  DownloadCloud,
  FileText,
  Grid,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Square,
  Terminal,
  Trash2,
} from 'lucide-react';
import {
  Container,
  ContainerStatus,
  useAppStore,
  useContainerStore,
} from '../../store';
import {
  ContainerGroupKey,
  ContainerSortKey,
} from '../../store/containerStore';
import { useResizeXRight } from '../shared/useResize';
import {
  Modal,
  Field,
  ViewHeader,
  StatusBadge,
  DropdownMenu,
  DropdownHeader,
  DropdownItem,
  KVRow,
  Spinner,
} from '../shared/ui';
import {
  startContainer,
  stopContainer,
  restartContainer,
  pauseContainer,
  unpauseContainer,
  removeContainer,
  runContainer,
  pullImageStream,
  listContainers,
} from '../../backend/docker';
import { isTauri } from '../../backend/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type FilterTab = 'all' | ContainerStatus;
const FILTERS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'running', label: 'Running' },
  { id: 'stopped', label: 'Stopped' },
  { id: 'paused', label: 'Paused' },
  { id: 'exited', label: 'Exited' },
];
const SORTS: { key: ContainerSortKey; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'cpu', label: 'CPU' },
  { key: 'memory', label: 'Memory' },
  { key: 'created', label: 'Created' },
  { key: 'uptime', label: 'Uptime' },
];
const GROUPS: { key: ContainerGroupKey; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'status', label: 'By status' },
  { key: 'image', label: 'By image' },
  { key: 'created', label: 'By date' },
];
const STATUS_ORDER: Record<ContainerStatus, number> = {
  running: 0,
  paused: 1,
  stopped: 2,
  exited: 3,
};

function sortContainers(
  list: Container[],
  key: ContainerSortKey,
  dir: 'asc' | 'desc'
) {
  return [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'status':
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
      case 'cpu':
        cmp = a.cpu - b.cpu;
        break;
      case 'memory':
        cmp = parseInt(a.memory) - parseInt(b.memory);
        break;
      case 'created':
        cmp = a.created.localeCompare(b.created);
        break;
      case 'uptime':
        cmp = a.uptime.localeCompare(b.uptime);
        break;
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

function groupContainers(list: Container[], key: ContainerGroupKey) {
  if (key === 'none') return [{ label: '', items: list }];
  const map = new Map<string, Container[]>();
  list.forEach((c) => {
    const label =
      key === 'status'
        ? c.status.charAt(0).toUpperCase() + c.status.slice(1)
        : key === 'image'
          ? c.image.split(':')[0]
          : key === 'created'
            ? c.created
            : '';
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(c);
  });
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// ─── Main View ────────────────────────────────────────────────────────────────

export default function ContainersView() {
  const {
    containers,
    selectedId,
    filter,
    sortKey,
    sortDir,
    groupKey,
    selectContainer,
    setFilter,
    setSort,
    setGroupKey,
    removeContainer: removeFromStore,
    updateContainerStatus,
    addContainer,
    setContainers,
  } = useContainerStore();
  const { searchQuery } = useAppStore();

  const [showRunModal, setShowRunModal] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>(
    {}
  );
  const [refreshing, setRefreshing] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const detailPanel = useResizeXRight(320, 260, 560);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSortMenu(false);
      if (groupRef.current && !groupRef.current.contains(e.target as Node))
        setShowGroupMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  async function handleRefresh() {
    if (!isTauri()) return;
    setRefreshing(true);
    try {
      const raw = await listContainers(true);
      // bridge already in store via initDockerBridge, but allow manual refresh
    } finally {
      setRefreshing(false);
    }
  }

  async function handleToggle(c: Container) {
    if (!isTauri()) {
      updateContainerStatus(
        c.id,
        c.status === 'running' ? 'stopped' : 'running'
      );
      return;
    }
    setActionLoading((p) => ({ ...p, [c.id]: 'toggle' }));
    try {
      if (c.status === 'running') {
        await stopContainer(c.id);
        updateContainerStatus(c.id, 'stopped');
      } else if (c.status === 'paused') {
        await unpauseContainer(c.id);
        updateContainerStatus(c.id, 'running');
      } else {
        await startContainer(c.id);
        updateContainerStatus(c.id, 'running');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading((p) => {
        const n = { ...p };
        delete n[c.id];
        return n;
      });
    }
  }

  async function handlePause(c: Container) {
    if (!isTauri()) return;
    setActionLoading((p) => ({ ...p, [c.id]: 'pause' }));
    try {
      if (c.status === 'paused') {
        await unpauseContainer(c.id);
        updateContainerStatus(c.id, 'running');
      } else {
        await pauseContainer(c.id);
        updateContainerStatus(c.id, 'paused');
      }
    } finally {
      setActionLoading((p) => {
        const n = { ...p };
        delete n[c.id];
        return n;
      });
    }
  }

  async function handleRemove(c: Container) {
    if (!confirm(`Remove container "${c.name}"?`)) return;
    if (isTauri()) {
      try {
        await removeContainer(c.id, true);
      } catch (e) {
        console.error(e);
      }
    }
    removeFromStore(c.id);
    if (selectedId === c.id) selectContainer(null);
  }

  const filtered = containers.filter((c) => {
    const matchFilter = filter === 'all' || c.status === filter;
    const matchSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.image.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });
  const sorted = sortContainers(filtered, sortKey, sortDir);
  const groups = groupContainers(sorted, groupKey);
  const selected = containers.find((c) => c.id === selectedId) ?? null;
  const running = containers.filter((c) => c.status === 'running').length;

  const COLS = [
    { label: 'Name / Image', key: 'name' as ContainerSortKey, w: '30%' },
    { label: 'Status', key: 'status' as ContainerSortKey, w: '10%' },
    { label: 'Ports', key: null as ContainerSortKey | null, w: '14%' },
    { label: 'CPU', key: 'cpu' as ContainerSortKey, w: '10%' },
    { label: 'Memory', key: 'memory' as ContainerSortKey, w: '10%' },
    { label: 'Uptime', key: 'uptime' as ContainerSortKey, w: '10%' },
    { label: '', key: null as ContainerSortKey | null, w: '130px' },
  ];

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
        title="Containers"
        subtitle={`${containers.length} total · ${running} running`}
      />

      {/* Toolbar */}
      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={() => setShowRunModal(true)}
        >
          <Plus size={13} /> Run
        </button>
        <button className="btn" onClick={() => setShowPullModal(true)}>
          <DownloadCloud size={13} /> Pull image
        </button>
        <button className="btn" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={13} className={refreshing ? 'spin' : ''} /> Refresh
        </button>
        <div className="toolbar-sep" />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-tab ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {/* Group */}
          <div ref={groupRef} style={{ position: 'relative' }}>
            <button
              className="btn"
              style={
                groupKey !== 'none'
                  ? {
                      color: 'var(--blue)',
                      borderColor: 'rgba(77,158,255,0.3)',
                      background: 'var(--blue-dim)',
                    }
                  : {}
              }
              onClick={() => {
                setShowGroupMenu((v) => !v);
                setShowSortMenu(false);
              }}
            >
              <Grid size={13} /> Group
            </button>
            {showGroupMenu && (
              <DropdownMenu right>
                <DropdownHeader>Group by</DropdownHeader>
                {GROUPS.map((g) => (
                  <DropdownItem
                    key={g.key}
                    active={groupKey === g.key}
                    onClick={() => {
                      setGroupKey(g.key);
                      setShowGroupMenu(false);
                    }}
                  >
                    {g.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            )}
          </div>
          {/* Sort */}
          <div ref={sortRef} style={{ position: 'relative' }}>
            <button
              className="btn"
              style={
                sortKey !== 'name'
                  ? {
                      color: 'var(--blue)',
                      borderColor: 'rgba(77,158,255,0.3)',
                      background: 'var(--blue-dim)',
                    }
                  : {}
              }
              onClick={() => {
                setShowSortMenu((v) => !v);
                setShowGroupMenu(false);
              }}
            >
              {sortDir === 'asc' ? (
                <ArrowUp size={13} />
              ) : (
                <ArrowDown size={13} />
              )}{' '}
              Sort
            </button>
            {showSortMenu && (
              <DropdownMenu right>
                <DropdownHeader>Sort by</DropdownHeader>
                {SORTS.map((s) => (
                  <DropdownItem
                    key={s.key}
                    active={sortKey === s.key}
                    onClick={() => setSort(s.key)}
                    suffix={
                      sortKey === s.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp size={11} />
                        ) : (
                          <ArrowDown size={11} />
                        )
                      ) : undefined
                    }
                  >
                    {s.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="tbl-head">
              <tr>
                {COLS.map((col, i) => (
                  <th
                    key={i}
                    className={
                      col.key
                        ? 'sortable' + (sortKey === col.key ? ' sorted' : '')
                        : ''
                    }
                    style={{ width: col.w }}
                    onClick={() => col.key && setSort(col.key)}
                  >
                    {col.label}
                    {col.key && sortKey === col.key && (
                      <span style={{ marginLeft: 4 }}>
                        {sortDir === 'asc' ? (
                          <ArrowUp size={9} />
                        ) : (
                          <ArrowDown size={9} />
                        )}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group, gi) => (
                <React.Fragment key={gi}>
                  {groupKey !== 'none' && (
                    <tr>
                      <td
                        colSpan={COLS.length}
                        style={{
                          padding: '10px 12px 4px',
                          background: 'var(--bg0)',
                        }}
                      >
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
                              fontSize: 9.5,
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              color: 'var(--text-2)',
                            }}
                          >
                            {group.label}
                          </span>
                          <span className="tag">{group.items.length}</span>
                          <div
                            style={{
                              flex: 1,
                              height: 1,
                              background: 'var(--border)',
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  {group.items.map((c) => {
                    const isSelected = selectedId === c.id;
                    const loading = actionLoading[c.id];
                    return (
                      <tr
                        key={c.id}
                        className={`tbl-row ${isSelected ? 'selected' : ''}`}
                        onClick={() =>
                          selectContainer(isSelected ? null : c.id)
                        }
                      >
                        {/* Name/Image */}
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: 5,
                                background:
                                  c.status === 'running'
                                    ? 'var(--green-dim)'
                                    : c.status === 'paused'
                                      ? 'var(--amber-dim)'
                                      : 'var(--bg4)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {c.status === 'running' ? (
                                <Play size={11} color="var(--green)" />
                              ) : c.status === 'paused' ? (
                                <Pause size={11} color="var(--amber)" />
                              ) : (
                                <Square size={11} color="var(--text-2)" />
                              )}
                            </div>
                            <div>
                              <div
                                className="mono"
                                style={{
                                  fontSize: 12,
                                  fontWeight: 500,
                                  color: 'var(--text-0)',
                                }}
                              >
                                {c.name}
                              </div>
                              <div
                                className="mono"
                                style={{ fontSize: 10, color: 'var(--text-2)' }}
                              >
                                {c.image}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Status */}
                        <td>
                          <StatusBadge status={c.status} />
                        </td>
                        {/* Ports */}
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 3,
                            }}
                          >
                            {c.ports.length > 0 ? (
                              c.ports.slice(0, 2).map((p) => (
                                <span key={p} className="port-tag">
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span
                                style={{ color: 'var(--text-2)', fontSize: 11 }}
                              >
                                —
                              </span>
                            )}
                            {c.ports.length > 2 && (
                              <span className="tag">+{c.ports.length - 2}</span>
                            )}
                          </div>
                        </td>
                        {/* CPU */}
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <div
                              style={{
                                width: 36,
                                height: 3,
                                borderRadius: 2,
                                background: 'var(--bg4)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${c.cpu}%`,
                                  background:
                                    c.cpu > 60
                                      ? 'var(--red)'
                                      : c.cpu > 30
                                        ? 'var(--amber)'
                                        : 'var(--green)',
                                  borderRadius: 2,
                                }}
                              />
                            </div>
                            <span className="mono" style={{ fontSize: 11 }}>
                              {c.cpu}%
                            </span>
                          </div>
                        </td>
                        {/* Memory */}
                        <td>
                          <span className="mono" style={{ fontSize: 11 }}>
                            {c.memory}
                          </span>
                        </td>
                        {/* Uptime */}
                        <td>
                          <span
                            className="mono"
                            style={{ fontSize: 11, color: 'var(--text-2)' }}
                          >
                            {c.uptime}
                          </span>
                        </td>
                        {/* Actions */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                            }}
                          >
                            <button
                              className="btn-icon"
                              title="Logs"
                              onClick={() => {}}
                            >
                              <FileText size={13} />
                            </button>
                            <button
                              className="btn-icon"
                              title="Terminal"
                              onClick={() => {}}
                            >
                              <Terminal size={13} />
                            </button>
                            <button
                              className="btn-icon"
                              title={c.status === 'running' ? 'Stop' : 'Start'}
                              onClick={() => handleToggle(c)}
                              disabled={!!loading}
                            >
                              {loading === 'toggle' ? (
                                <Spinner size={13} />
                              ) : c.status === 'running' ? (
                                <Square size={13} />
                              ) : (
                                <Play size={13} />
                              )}
                            </button>
                            {c.status === 'running' && (
                              <button
                                className="btn-icon"
                                title="Pause"
                                onClick={() => handlePause(c)}
                              >
                                {loading === 'pause' ? (
                                  <Spinner size={13} />
                                ) : (
                                  <Pause size={13} />
                                )}
                              </button>
                            )}
                            <button
                              className="btn-icon"
                              title="Remove"
                              style={
                                { color: 'var(--red)' } as React.CSSProperties
                              }
                              onClick={() => handleRemove(c)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLS.length}>
                    <div className="empty-state">
                      No containers match the filter.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Resizable Detail Panel */}
        {selected && (
          <>
            <div
              ref={detailPanel.handleRef}
              className="resize-handle"
              onMouseDown={detailPanel.onMouseDown}
            />
            <div
              className="detail-panel"
              style={{ width: detailPanel.width, flexShrink: 0 }}
            >
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
                    {selected.shortId}
                  </div>
                </div>
                <button
                  className="btn-icon"
                  onClick={() => selectContainer(null)}
                >
                  <Square size={13} />
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
                      letterSpacing: '0.08em',
                      color: 'var(--text-2)',
                      marginBottom: 8,
                    }}
                  >
                    Details
                  </div>
                  <div className="detail-kv" style={{ rowGap: 8 }}>
                    <KVRow label="Image" value={selected.image} />
                    <KVRow label="ID" value={selected.shortId} />
                    <KVRow label="Created" value={selected.created} />
                    <KVRow label="Uptime" value={selected.uptime} />
                    <KVRow label="CPU" value={`${selected.cpu}%`} />
                    <KVRow label="Memory" value={selected.memory} />
                    <KVRow
                      label="Ports"
                      value={selected.ports.join(', ') || '—'}
                    />
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    className="mono"
                    style={{
                      fontSize: 9.5,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: 'var(--text-2)',
                      marginBottom: 4,
                    }}
                  >
                    Actions
                  </div>
                  <button
                    className="btn"
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleToggle(selected)}
                  >
                    {selected.status === 'running' ? (
                      <>
                        <Square size={13} /> Stop
                      </>
                    ) : (
                      <>
                        <Play size={13} /> Start
                      </>
                    )}
                  </button>
                  {selected.status === 'running' && (
                    <button
                      className="btn"
                      style={{ justifyContent: 'center' }}
                      onClick={() => handlePause(selected)}
                    >
                      <Pause size={13} /> Pause
                    </button>
                  )}
                  <button
                    className="btn btn-danger"
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleRemove(selected)}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {showRunModal && (
        <RunContainerModal
          onClose={() => setShowRunModal(false)}
          onRun={addContainer}
        />
      )}
      {showPullModal && (
        <PullImageModal onClose={() => setShowPullModal(false)} />
      )}
    </div>
  );
}

// ─── Run Container Modal ──────────────────────────────────────────────────────

function RunContainerModal({
  onClose,
  onRun,
}: {
  onClose: () => void;
  onRun: (c: Container) => void;
}) {
  const [image, setImage] = useState('');
  const [name, setName] = useState('');
  const [ports, setPorts] = useState('');
  const [envVars, setEnvVars] = useState('');
  const [cmd, setCmd] = useState('');
  const [detach, setDetach] = useState(true);
  const [autoRemove, setAutoRemove] = useState(false);
  const [restart, setRestart] = useState<
    'no' | 'always' | 'on-failure' | 'unless-stopped'
  >('no');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  async function handleRun() {
    if (!image.trim()) {
      setError('Image name is required.');
      return;
    }
    setRunning(true);
    try {
      if (isTauri()) {
        const portMappings = ports
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => {
            const [host, container] = p.split(':');
            return {
              hostPort: host,
              containerPort: container || host,
              protocol: 'tcp',
            };
          });
        const envList = envVars
          .split('\n')
          .map((e) => e.trim())
          .filter(Boolean);
        const id = await runContainer({
          image: image.trim(),
          name: name.trim() || undefined,
          ports: portMappings,
          env: envList,
          cmd: cmd.trim() ? cmd.trim().split(' ') : [],
          volumes: [],
          detach,
          autoRemove,
          restartPolicy: restart,
          labels: {},
        });
        onRun({
          id,
          shortId: id.slice(0, 12),
          name: name.trim() || image.split(':')[0].split('/').pop() || image,
          image: image.trim(),
          status: 'running',
          ports: ports
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean),
          cpu: 0,
          memory: '0 MB',
          uptime: 'just now',
          created: new Date().toISOString().slice(0, 10),
        });
      } else {
        onRun({
          id: crypto.randomUUID(),
          shortId: crypto.randomUUID().slice(0, 8),
          name:
            name.trim() ||
            `${image.split(':')[0].split('/').pop()}-${Math.floor(Math.random() * 1000)}`,
          image: image.trim(),
          status: 'running',
          ports: ports
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean),
          cpu: 0,
          memory: '0 MB',
          uptime: 'just now',
          created: new Date().toISOString().slice(0, 10),
        });
      }
      onClose();
    } catch (e: any) {
      setError(e?.message || String(e));
      setRunning(false);
    }
  }

  const preview = [
    'docker run',
    detach && '-d',
    autoRemove && '--rm',
    restart !== 'no' && `--restart ${restart}`,
    name.trim() && `--name ${name.trim()}`,
    ...ports
      .split(',')
      .filter(Boolean)
      .map((p) => `-p ${p.trim()}`),
    ...envVars
      .split('\n')
      .filter(Boolean)
      .map((e) => `-e ${e.trim()}`),
    image || '<image>',
    cmd,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Modal
      title="Run a new container"
      onClose={onClose}
      width={560}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={running}
          >
            {running ? (
              <>
                <Spinner size={13} /> Running…
              </>
            ) : (
              <>
                <Play size={13} /> Run container
              </>
            )}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
        >
          <Field label="Image *" hint="e.g. nginx:alpine" error={error}>
            <input
              className={`input ${error ? 'error' : ''}`}
              value={image}
              onChange={(e) => {
                setImage(e.target.value);
                setError('');
              }}
              placeholder="nginx:alpine"
              autoFocus
            />
          </Field>
          <Field
            label="Container name"
            hint="Optional — auto-generated if blank"
          >
            <input
              className="input mono"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-container"
            />
          </Field>
        </div>
        <Field
          label="Port mappings"
          hint="Comma-separated host:container (e.g. 8080:80, 5432:5432)"
        >
          <input
            className="input mono"
            value={ports}
            onChange={(e) => setPorts(e.target.value)}
            placeholder="8080:80, 443:443"
          />
        </Field>
        <Field label="Environment variables" hint="One per line: KEY=VALUE">
          <textarea
            className="textarea"
            value={envVars}
            onChange={(e) => setEnvVars(e.target.value)}
            placeholder={'NODE_ENV=production\nPORT=3000'}
            rows={3}
          />
        </Field>
        <Field label="Command override" hint="Overrides the image default CMD">
          <input
            className="input mono"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            placeholder="/bin/sh"
          />
        </Field>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
        >
          <div className="toggle-wrap" onClick={() => setDetach(!detach)}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-0)' }}>
                Run detached
              </div>
              <div className="field-hint">-d flag</div>
            </div>
            <div className={`toggle ${detach ? 'on' : ''}`} />
          </div>
          <div
            className="toggle-wrap"
            onClick={() => setAutoRemove(!autoRemove)}
          >
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-0)' }}>
                Auto-remove
              </div>
              <div className="field-hint">--rm flag</div>
            </div>
            <div className={`toggle ${autoRemove ? 'on' : ''}`} />
          </div>
        </div>

        <Field label="Restart policy">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['no', 'always', 'on-failure', 'unless-stopped'] as const).map(
              (r) => (
                <button
                  key={r}
                  className={`filter-tab ${restart === r ? 'active' : ''}`}
                  onClick={() => setRestart(r)}
                >
                  {r}
                </button>
              )
            )}
          </div>
        </Field>

        <div
          style={{
            background: 'var(--bg0)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            padding: '10px 12px',
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 9.5,
              color: 'var(--text-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 6,
            }}
          >
            Preview
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--text-1)',
              wordBreak: 'break-all',
              lineHeight: 1.6,
            }}
          >
            <span style={{ color: 'var(--blue)' }}>$ </span>
            {preview}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── Pull Image Modal ─────────────────────────────────────────────────────────

const POPULAR = [
  { name: 'nginx', tag: 'alpine', desc: 'Web server' },
  { name: 'postgres', tag: '15', desc: 'Relational database' },
  { name: 'redis', tag: '7-alpine', desc: 'In-memory store' },
  { name: 'node', tag: '20-slim', desc: 'Node.js runtime' },
  { name: 'python', tag: '3.11', desc: 'Python language' },
  { name: 'alpine', tag: 'latest', desc: 'Minimal Linux' },
  { name: 'ubuntu', tag: '22.04', desc: 'Ubuntu base' },
  { name: 'mysql', tag: '8.0', desc: 'MySQL database' },
];

function PullImageModal({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('latest');
  const [selected, setSelected] = useState('');
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const imageName = selected || query;
  const filtered = POPULAR.filter(
    (p) => !query || p.name.startsWith(query.toLowerCase())
  );

  async function handlePull() {
    if (!imageName.trim()) return;
    setPulling(true);
    setProgress(0);
    setError('');

    if (isTauri()) {
      try {
        let p = 0;
        const stop = await pullImageStream(
          imageName.trim(),
          tag.trim() || 'latest',
          (chunk) => {
            if (chunk.done) {
              setProgress(100);
              setDone(true);
              setPulling(false);
              stop();
              return;
            }
            if (chunk.total && chunk.current)
              p = (chunk.current / chunk.total) * 100;
            else p = Math.min(p + 4, 90);
            setProgress(p);
            setStep(chunk.status || 'Downloading…');
          }
        );
      } catch (e: any) {
        setError(e?.message || String(e));
        setPulling(false);
      }
    } else {
      // Simulate for dev
      let p = 0;
      const steps = [
        'Resolving reference…',
        'Downloading layers…',
        'Verifying checksums…',
        'Extracting…',
        'Finalising…',
      ];
      const iv = setInterval(() => {
        p += Math.random() * 14 + 3;
        setProgress(Math.min(p, 100));
        setStep(steps[Math.floor((Math.min(p, 99) / 100) * steps.length)]);
        if (p >= 100) {
          clearInterval(iv);
          setDone(true);
          setPulling(false);
        }
      }, 140);
    }
  }

  return (
    <Modal
      title="Pull image"
      onClose={onClose}
      width={480}
      footer={
        done ? (
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        ) : (
          <>
            <button className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handlePull}
              disabled={!imageName.trim() || pulling}
            >
              {pulling ? (
                <>
                  <Spinner size={13} /> Pulling…
                </>
              ) : (
                <>
                  <DownloadCloud size={13} /> Pull
                </>
              )}
            </button>
          </>
        )
      }
    >
      {done ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--green-dim)',
              border: '1px solid rgba(61,214,140,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <span style={{ color: 'var(--green)', fontSize: 20 }}>✓</span>
          </div>
          <div
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-0)' }}
          >
            Pull complete
          </div>
          <div
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}
          >
            {imageName}:{tag}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input mono"
              style={{ flex: 1 }}
              placeholder="Search or type image name…"
              value={query}
              autoFocus
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected('');
              }}
            />
            <input
              className="input mono"
              style={{ width: 80 }}
              placeholder="tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: 'var(--text-2)',
                marginBottom: 2,
              }}
            >
              {query ? 'Results' : 'Popular images'}
            </div>
            {filtered.map((img) => (
              <button
                key={img.name}
                onClick={() => {
                  setSelected(img.name);
                  setQuery(img.name);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 4,
                  border: `1px solid ${selected === img.name ? 'rgba(77,158,255,0.3)' : 'var(--border)'}`,
                  background:
                    selected === img.name ? 'var(--blue-dim)' : 'var(--bg3)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.1s',
                  width: '100%',
                }}
              >
                <div
                  className="mono"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color:
                      selected === img.name ? 'var(--blue)' : 'var(--text-0)',
                    flex: 1,
                  }}
                >
                  {img.name}
                  <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>
                    :{img.tag}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>
                  {img.desc}
                </span>
                {selected === img.name && (
                  <span style={{ color: 'var(--blue)' }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {(pulling || progress > 0) && (
            <div
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
                  marginBottom: 6,
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--text-1)' }}
                >
                  {step}
                </span>
                <span
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--blue)' }}
                >
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div
                className="mono"
                style={{ fontSize: 10, color: 'var(--text-2)', marginTop: 5 }}
              >
                {imageName}:{tag}
              </div>
            </div>
          )}
          {error && (
            <div style={{ color: 'var(--red)', fontSize: 11.5 }}>{error}</div>
          )}
        </div>
      )}
    </Modal>
  );
}
