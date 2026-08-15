import React, { useEffect, useRef, useState } from 'react';
import {
  Hammer,
  FileText,
  Trash2,
  Plus,
  RefreshCw,
  Square,
} from 'lucide-react';
import {
  useAppStore,
  useVolumeStore,
  useNetworkStore,
  useBuildStore,
  useContainerStore,
  Network,
  Volume,
  BuildRecord,
} from '../../store';
import { ViewHeader, StatusBadge, Modal, Field, Spinner } from '../shared/ui';
import { useResizeXRight } from '../shared/useResize';
import { isTauri } from '../../backend/utils';
import { toStoreVolume } from '../../backend/bridge';
import {
  buildImage,
  createVolume,
  createNetwork,
  removeVolume as removeVolumeBackend,
  removeNetwork as removeNetworkBackend,
  getContainerLogs,
  streamContainerLogs,
} from '../../backend';

// ─── Volumes ─────────────────────────────────────────────────────────────────

export function VolumesView() {
  const {
    volumes,
    selectedId,
    filter,
    selectVolume,
    setFilter,
    removeVolume,
    pruneUnused,
    addVolume,
  } = useVolumeStore();
  const { searchQuery } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const [showBrowse, setShowBrowse] = useState<Volume | null>(null);
  const [confirmPrune, setConfirmPrune] = useState(false);
  const detail = useResizeXRight(280, 220, 480);

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'in-use', label: 'In use' },
    { id: 'unused', label: 'Unused' },
  ] as const;

  const filtered = volumes.filter((v) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'in-use' && v.inUse) ||
      (filter === 'unused' && !v.inUse);
    const matchSearch =
      !searchQuery || v.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });
  const selected = volumes.find((v) => v.id === selectedId) ?? null;
  const unused = volumes.filter((v) => !v.inUse);

  async function handleRemove(v: Volume) {
    if (!confirm('Remove volume ' + v.name + '?')) return;
    try {
      if (isTauri()) await removeVolumeBackend(v.name);
    } catch {
      /* backend error — local removal still proceeds */
    }
    removeVolume(v.id);
    if (selectedId === v.id) selectVolume(null);
  }

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
        title="Volumes"
        subtitle={volumes.length + ' volumes · ' + unused.length + ' unused'}
      />
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={13} /> Create
        </button>
        <button
          className="btn"
          onClick={() => setConfirmPrune(true)}
          disabled={unused.length === 0}
        >
          <Trash2 size={13} /> Prune ({unused.length})
        </button>
        <div className="toolbar-sep" />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={'filter-tab' + (filter === f.id ? ' active' : '')}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="tbl-head">
              <tr>
                <th>Name</th>
                <th>Driver</th>
                <th>Mountpoint</th>
                <th>Size</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className={
                    'tbl-row' + (selectedId === v.id ? ' selected' : '')
                  }
                  onClick={() =>
                    selectVolume(selectedId === v.id ? null : v.id)
                  }
                >
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: 12, fontWeight: 500 }}
                    >
                      {v.name}
                    </span>
                  </td>
                  <td>
                    <span className="tag mono">{v.driver}</span>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: 10.5, color: 'var(--text-2)' }}
                    >
                      {v.mountpoint}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11 }}>
                      {v.size}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        'badge badge-' + (v.inUse ? 'running' : 'stopped')
                      }
                    >
                      {v.inUse ? 'in use' : 'unused'}
                    </span>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: 'var(--text-2)' }}
                    >
                      {v.created}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button
                        className="btn-icon"
                        title="Browse"
                        onClick={() => setShowBrowse(v)}
                      >
                        <FileText size={12} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Remove"
                        style={{ color: 'var(--red)' }}
                        onClick={() => void handleRemove(v)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">No volumes found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <button className="btn-icon" onClick={() => selectVolume(null)}>
                  ✕
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                <span
                  className={
                    'badge badge-' + (selected.inUse ? 'running' : 'stopped')
                  }
                >
                  {selected.inUse ? 'in use' : 'unused'}
                </span>
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
                    Details
                  </div>
                  <div className="detail-kv" style={{ rowGap: 8 }}>
                    {[
                      ['Driver', selected.driver],
                      ['Mount', selected.mountpoint],
                      ['Size', selected.size],
                      ['Created', selected.created],
                    ].map(([k, v]) => (
                      <React.Fragment key={k}>
                        <span className="detail-k">{k}</span>
                        <span className="detail-v">{v}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <button
                    className="btn"
                    style={{ justifyContent: 'center' }}
                    onClick={() => setShowBrowse(selected)}
                  >
                    <FileText size={13} /> Browse
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ justifyContent: 'center' }}
                    onClick={() => void handleRemove(selected)}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {showCreate && (
        <CreateVolumeModal
          onClose={() => setShowCreate(false)}
          onCreated={addVolume}
        />
      )}
      {confirmPrune && (
        <Modal
          title="Prune unused volumes"
          onClose={() => setConfirmPrune(false)}
          width={380}
          footer={
            <>
              <button className="btn" onClick={() => setConfirmPrune(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  pruneUnused();
                  setConfirmPrune(false);
                }}
              >
                <Trash2 size={13} /> Prune {unused.length}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6 }}>
            Remove{' '}
            <strong style={{ color: 'var(--text-0)' }}>
              {unused.length} unused volumes
            </strong>
            . This cannot be undone.
          </p>
        </Modal>
      )}
      {showBrowse && (
        <Modal
          title={'Browse — ' + showBrowse.name}
          onClose={() => setShowBrowse(null)}
          width={520}
        >
          <div
            style={{
              background: 'var(--bg0)',
              borderRadius: 4,
              padding: '12px 14px',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 11.5,
              color: 'var(--text-1)',
              lineHeight: 1.8,
            }}
          >
            <div style={{ color: 'var(--blue)' }}>drwxr-xr-x data/</div>
            <div style={{ color: 'var(--text-2)' }}>
              -rw-r--r-- config.json · 2.4 KB
            </div>
            <div style={{ color: 'var(--text-2)' }}>
              -rw-r--r-- schema.sql · 48 KB
            </div>
            <div style={{ marginTop: 8, color: 'var(--text-2)', fontSize: 10 }}>
              Mountpoint: {showBrowse.mountpoint}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CreateVolumeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (v: Volume) => void;
}) {
  const [name, setName] = useState('');
  const [driver, setDriver] = useState('local');
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    try {
      let volume: Volume;
      if (isTauri()) {
        volume = toStoreVolume(await createVolume(name.trim(), driver));
      } else {
        volume = {
          id: 'vol-' + name.trim(),
          name: name.trim(),
          driver,
          mountpoint: '/var/lib/docker/volumes/' + name.trim(),
          size: '0 B',
          sizeBytes: 0,
          created: new Date().toISOString().slice(0, 10),
          inUse: false,
          containers: [],
          scope: 'local',
          labels: {},
        };
      }
      onCreated(volume);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Modal
      title="Create volume"
      onClose={onClose}
      width={400}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => void handleCreate()}
          >
            <Plus size={13} /> Create
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Volume name" error={error}>
          <input
            className={'input mono' + (error ? ' error' : '')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="my-volume"
            autoFocus
          />
        </Field>
        <Field label="Driver">
          <select
            className="select"
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
          >
            {['local', 'nfs', 'tmpfs'].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

// ─── Networks ─────────────────────────────────────────────────────────────────

export function NetworksView() {
  const {
    networks,
    selectedId,
    filter,
    selectNetwork,
    setFilter,
    removeNetwork,
    addNetwork,
  } = useNetworkStore();
  const { searchQuery } = useAppStore();
  const [showCreate, setShowCreate] = useState(false);
  const detail = useResizeXRight(280, 220, 480);

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'custom', label: 'Custom' },
    { id: 'default', label: 'Default' },
  ] as const;
  const filtered = networks.filter((n) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'custom' && !n.isDefault) ||
      (filter === 'default' && n.isDefault);
    const matchSearch =
      !searchQuery || n.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });
  const selected = networks.find((n) => n.id === selectedId) ?? null;

  async function handleRemove(n: Network) {
    if (n.isDefault) {
      alert('Cannot remove default networks.');
      return;
    }
    if (!confirm('Remove network ' + n.name + '?')) return;
    try {
      if (isTauri()) await removeNetworkBackend(n.id);
    } catch {
      /* backend error — local removal still proceeds */
    }
    removeNetwork(n.id);
    if (selectedId === n.id) selectNetwork(null);
  }

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
        title="Networks"
        subtitle={
          networks.length +
          ' networks · ' +
          networks.filter((n) => !n.isDefault).length +
          ' custom'
        }
      />
      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={13} /> Create
        </button>
        <div className="toolbar-sep" />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={'filter-tab' + (filter === f.id ? ' active' : '')}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="tbl-head">
              <tr>
                <th>Name</th>
                <th>Driver</th>
                <th>Subnet</th>
                <th>Containers</th>
                <th>Created</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((n) => (
                <tr
                  key={n.id}
                  className={
                    'tbl-row' + (selectedId === n.id ? ' selected' : '')
                  }
                  onClick={() =>
                    selectNetwork(selectedId === n.id ? null : n.id)
                  }
                >
                  <td>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <span
                        className="mono"
                        style={{ fontSize: 12, fontWeight: 500 }}
                      >
                        {n.name}
                      </span>
                      {n.isDefault && (
                        <span
                          className="badge badge-info"
                          style={{ fontSize: 9 }}
                        >
                          default
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="tag mono">{n.driver}</span>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: 10.5, color: 'var(--text-2)' }}
                    >
                      {n.subnet || '—'}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11 }}>
                      {n.containers.length}
                    </span>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: 'var(--text-2)' }}
                    >
                      {n.created}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {!n.isDefault && (
                      <button
                        className="btn-icon"
                        style={{ color: 'var(--red)' }}
                        onClick={() => void handleRemove(n)}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">No networks found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <button
                  className="btn-icon"
                  onClick={() => selectNetwork(null)}
                >
                  ✕
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                <div className="detail-kv" style={{ rowGap: 8 }}>
                  {[
                    ['Driver', selected.driver],
                    ['ID', selected.id.slice(0, 12)],
                    ['Subnet', selected.subnet || '—'],
                    ['Gateway', selected.gateway || '—'],
                    ['Created', selected.created],
                    ['Internal', selected.internal ? 'Yes' : 'No'],
                    ['IPv6', selected.enableIPv6 ? 'Enabled' : 'Disabled'],
                  ].map(([k, v]) => (
                    <React.Fragment key={k}>
                      <span className="detail-k">{k}</span>
                      <span className="detail-v">{v}</span>
                    </React.Fragment>
                  ))}
                </div>
                {selected.containers.length > 0 && (
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
                      Connected containers
                    </div>
                    {selected.containers.map((c, i) => {
                      const name = typeof c === 'string' ? c : c.name;
                      return (
                        <div
                          key={i}
                          className="tag"
                          style={{ marginBottom: 4 }}
                        >
                          {name}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!selected.isDefault && (
                  <div style={{ marginTop: 14 }}>
                    <button
                      className="btn btn-danger"
                      style={{ width: '100%', justifyContent: 'center' }}
                      onClick={() => void handleRemove(selected)}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      {showCreate && (
        <CreateNetworkModal
          onClose={() => setShowCreate(false)}
          onCreated={addNetwork}
        />
      )}
    </div>
  );
}

function CreateNetworkModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (n: Network) => void;
}) {
  const [name, setName] = useState('');
  const [driver, setDriver] = useState('bridge');
  const [subnet, setSubnet] = useState('');
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    try {
      let network: Network;
      if (isTauri()) {
        const id = await createNetwork({
          name: name.trim(),
          driver,
          subnet: subnet.trim() || undefined,
          internal,
          attachable: true,
          labels: {},
        });
        network = {
          id,
          name: name.trim(),
          driver,
          subnet: subnet.trim() || undefined,
          gateway: undefined,
          created: new Date().toISOString().slice(0, 10),
          containers: [],
          isDefault: false,
          internal,
          enableIPv6: false,
          scope: 'local',
        };
      } else {
        network = {
          id: 'net-' + Date.now(),
          name: name.trim(),
          driver,
          subnet: subnet.trim() || undefined,
          gateway: undefined,
          created: new Date().toISOString().slice(0, 10),
          containers: [],
          isDefault: false,
          internal,
          enableIPv6: false,
          scope: 'local',
        };
      }
      onCreated(network);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Modal
      title="Create network"
      onClose={onClose}
      width={420}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => void handleCreate()}
          >
            <Plus size={13} /> Create
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Network name" error={error}>
          <input
            className={'input mono' + (error ? ' error' : '')}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="my-network"
            autoFocus
          />
        </Field>
        <Field label="Driver">
          <select
            className="select"
            value={driver}
            onChange={(e) => setDriver(e.target.value)}
          >
            {['bridge', 'overlay', 'host', 'macvlan', 'none'].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subnet (optional)" hint="e.g. 172.20.0.0/16">
          <input
            className="input mono"
            value={subnet}
            onChange={(e) => setSubnet(e.target.value)}
            placeholder="172.20.0.0/16"
          />
        </Field>
        <div className="toggle-wrap" onClick={() => setInternal(!internal)}>
          <div>
            <div style={{ fontSize: 12.5, color: 'var(--text-0)' }}>
              Internal network
            </div>
            <div className="field-hint">Restrict external access</div>
          </div>
          <div className={'toggle' + (internal ? ' on' : '')} />
        </div>
      </div>
    </Modal>
  );
}

// ─── Builds ───────────────────────────────────────────────────────────────────

export function BuildsView() {
  const {
    builds,
    selectedId,
    filter,
    selectBuild,
    setFilter,
    clearBuild,
    clearAll,
    addBuild,
    rebuildBuild,
    cancelBuild,
  } = useBuildStore();
  const { searchQuery } = useAppStore();
  const [showNewBuild, setShowNewBuild] = useState(false);
  const detail = useResizeXRight(300, 240, 520);

  const FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'success', label: 'Success' },
    { id: 'failed', label: 'Failed' },
    { id: 'building', label: 'Building' },
  ] as const;
  const filtered = builds.filter((b) => {
    const matchFilter = filter === 'all' || b.status === filter;
    const matchSearch =
      !searchQuery || b.image.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });
  const selected = builds.find((b) => b.id === selectedId) ?? null;

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
        title="Builds"
        subtitle={
          builds.length +
          ' builds · ' +
          builds.filter((b) => b.status === 'building').length +
          ' in progress'
        }
      />
      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={() => setShowNewBuild(true)}
        >
          <Hammer size={13} /> New build
        </button>
        <button
          className="btn btn-danger"
          onClick={() => {
            if (confirm('Clear all build records?')) clearAll();
          }}
          disabled={builds.length === 0}
        >
          <Trash2 size={13} /> Clear all
        </button>
        <div className="toolbar-sep" />
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={'filter-tab' + (filter === f.id ? ' active' : '')}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead className="tbl-head">
              <tr>
                <th>Image</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Size</th>
                <th>Started</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  className={
                    'tbl-row' + (selectedId === b.id ? ' selected' : '')
                  }
                  onClick={() => selectBuild(selectedId === b.id ? null : b.id)}
                >
                  <td>
                    <div>
                      <div
                        className="mono"
                        style={{ fontSize: 12, fontWeight: 500 }}
                      >
                        {b.image}
                      </div>
                      {b.dockerfile && (
                        <div
                          className="mono"
                          style={{ fontSize: 10, color: 'var(--text-2)' }}
                        >
                          {b.dockerfile}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={b.status} />
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11 }}>
                      {b.status === 'building'
                        ? '…'
                        : (b.durationMs / 1000).toFixed(1) + 's'}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11 }}>
                      {b.size}
                    </span>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: 'var(--text-2)' }}
                    >
                      {b.startedAt}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {b.status === 'building' ? (
                        <button
                          className="btn-icon"
                          title="Cancel"
                          style={{ color: 'var(--red)' }}
                          onClick={() => cancelBuild(b.id)}
                        >
                          <Square size={12} />
                        </button>
                      ) : (
                        <button
                          className="btn-icon"
                          title="Rebuild"
                          onClick={() => rebuildBuild(b.id)}
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}
                      <button
                        className="btn-icon"
                        title="Clear"
                        onClick={() => clearBuild(b.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">No builds found.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                <div
                  className="mono"
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--text-0)',
                  }}
                >
                  {selected.image}
                </div>
                <button className="btn-icon" onClick={() => selectBuild(null)}>
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
                    Details
                  </div>
                  <div className="detail-kv" style={{ rowGap: 8 }}>
                    {[
                      ['Dockerfile', selected.dockerfile || '—'],
                      ['Context', selected.context || '—'],
                      [
                        'Duration',
                        (selected.durationMs / 1000).toFixed(1) + 's',
                      ],
                      ['Size', selected.size],
                      ['Started', selected.startedAt],
                      ['Layers', selected.layers?.toString() ?? '—'],
                    ].map(([k, v]) => (
                      <React.Fragment key={k}>
                        <span className="detail-k">{k}</span>
                        <span className="detail-v">{v}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                {selected.logs && selected.logs.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div
                      className="mono"
                      style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        color: 'var(--text-2)',
                        marginBottom: 6,
                      }}
                    >
                      Logs
                    </div>
                    <div
                      style={{
                        background: 'var(--bg0)',
                        border: '1px solid var(--border)',
                        borderRadius: 4,
                        padding: '8px 10px',
                        maxHeight: 200,
                        overflow: 'auto',
                      }}
                    >
                      {selected.logs.slice(-20).map((line, i) => (
                        <div
                          key={i}
                          className="mono"
                          style={{
                            fontSize: 10.5,
                            color: line.startsWith('ERROR')
                              ? 'var(--red)'
                              : 'var(--text-1)',
                            marginBottom: 2,
                          }}
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <button
                    className="btn"
                    style={{ justifyContent: 'center' }}
                    onClick={() => rebuildBuild(selected.id)}
                  >
                    <RefreshCw size={13} /> Rebuild
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ justifyContent: 'center' }}
                    onClick={() => {
                      clearBuild(selected.id);
                      selectBuild(null);
                    }}
                  >
                    <Trash2 size={13} /> Clear
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {showNewBuild && (
        <NewBuildModal
          onClose={() => setShowNewBuild(false)}
          onAdd={addBuild}
        />
      )}
    </div>
  );
}

function NewBuildModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (b: BuildRecord) => void;
}) {
  const [image, setImage] = useState('');
  const [dockerfile, setDockerfile] = useState('./Dockerfile');
  const [context, setContext] = useState('.');
  const [buildArgs, setBuildArgs] = useState('');
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState('');

  async function handleBuild() {
    if (!image.trim()) {
      setError('Image name is required.');
      return;
    }
    setBuilding(true);
    try {
      if (isTauri()) await buildImage(image.trim(), dockerfile, context);
      const id = 'build-' + Date.now();
      onAdd({
        id,
        shortId: id,
        image: image.trim(),
        dockerfile,
        context,
        status: 'building',
        trigger: 'manual',
        duration: '0s',
        durationMs: 0,
        startedAt: new Date().toLocaleString(),
        finishedAt: '',
        size: '—',
        sizeBytes: 0,
        platform: 'linux/amd64',
        cacheUsed: false,
        steps: [],
        tags: [image.trim()],
        logs: ['Starting build…'],
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setBuilding(false);
    }
  }

  return (
    <Modal
      title="New build"
      onClose={onClose}
      width={480}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => void handleBuild()}
            disabled={building}
          >
            {building ? (
              <>
                <Spinner size={13} /> Building…
              </>
            ) : (
              <>
                <Hammer size={13} /> Build
              </>
            )}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Image name & tag *" error={error}>
          <input
            className={'input mono' + (error ? ' error' : '')}
            value={image}
            onChange={(e) => {
              setImage(e.target.value);
              setError('');
            }}
            placeholder="my-app:latest"
            autoFocus
          />
        </Field>
        <Field label="Dockerfile" hint="Path relative to build context">
          <input
            className="input mono"
            value={dockerfile}
            onChange={(e) => setDockerfile(e.target.value)}
          />
        </Field>
        <Field label="Build context">
          <input
            className="input mono"
            value={context}
            onChange={(e) => setContext(e.target.value)}
          />
        </Field>
        <Field label="Build args" hint="KEY=VALUE, one per line">
          <textarea
            className="textarea"
            value={buildArgs}
            onChange={(e) => setBuildArgs(e.target.value)}
            rows={3}
            placeholder={'NODE_ENV=production\nVERSION=1.0.0'}
          />
        </Field>
      </div>
    </Modal>
  );
}

// ─── Logs ────────────────────────────────────────────────────────────────────

interface LogRow {
  id: string;
  time: string;
  stream: 'stdout' | 'stderr';
  src: string;
  msg: string;
}

const STREAM_COLOR: Record<string, string> = {
  stdout: 'var(--green)',
  stderr: 'var(--red)',
};

function formatLogTime(ts: string): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleTimeString(undefined, { hour12: false });
}

export function LogsView() {
  const { containers } = useContainerStore();
  const logsTargetContainerId = useAppStore((s) => s.logsTargetContainerId);
  const setLogsTargetContainerId = useAppStore(
    (s) => s.setLogsTargetContainerId
  );

  const [containerId, setContainerId] = useState('');
  const [streamFilter, setStreamFilter] = useState<'all' | 'stdout' | 'stderr'>(
    'all'
  );
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<LogRow[]>([]);
  const [follow, setFollow] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const stopStreamRef = useRef<(() => void) | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Preselect a container when navigated from the Containers view
  useEffect(() => {
    if (logsTargetContainerId) {
      setContainerId(logsTargetContainerId);
      setLogsTargetContainerId(null);
    } else if (!containerId && containers.length > 0) {
      setContainerId(containers[0].id);
    }
  }, [
    logsTargetContainerId,
    setLogsTargetContainerId,
    containerId,
    containers,
  ]);

  // Load initial logs + start live streaming
  useEffect(() => {
    stopStreamRef.current?.();
    if (!containerId || !isTauri()) return;

    let cancelled = false;
    setError('');

    void (async () => {
      try {
        const initial = await getContainerLogs(containerId, 200);
        if (cancelled) return;
        const container = containers.find((c) => c.id === containerId);
        setRows(
          initial.map((l) => ({
            id: `${l.timestamp}-${l.message}`,
            time: formatLogTime(l.timestamp),
            stream: l.stream,
            src: container?.name ?? l.containerName ?? containerId.slice(0, 12),
            msg: l.message,
          }))
        );

        if (follow) {
          stopStreamRef.current = await streamContainerLogs(
            containerId,
            (chunk) => {
              if (cancelled) return;
              const containerName = container?.name ?? chunk.containerName;
              setRows((prev) => {
                const next = [
                  ...prev,
                  {
                    id: `${chunk.timestamp}-${chunk.message}-${Math.random()}`,
                    time: formatLogTime(chunk.timestamp),
                    stream: chunk.stream,
                    src: containerName ?? containerId.slice(0, 12),
                    msg: chunk.message,
                  },
                ];
                return next.length > 500 ? next.slice(-500) : next;
              });
            },
            { tail: 0, follow: true }
          );
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
          setRows([]);
        }
      }
    })();

    return () => {
      cancelled = true;
      stopStreamRef.current?.();
      stopStreamRef.current = null;
    };
  }, [containerId, follow, containers]);

  // Auto-scroll to bottom when following live output
  useEffect(() => {
    if (follow && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rows, follow]);

  async function handleRefresh() {
    if (!containerId) return;
    setRefreshing(true);
    try {
      const latest = await getContainerLogs(containerId, 200);
      const container = containers.find((c) => c.id === containerId);
      setRows(
        latest.map((l) => ({
          id: `${l.timestamp}-${l.message}`,
          time: formatLogTime(l.timestamp),
          stream: l.stream,
          src: container?.name ?? l.containerName ?? containerId.slice(0, 12),
          msg: l.message,
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setRefreshing(false);
    }
  }

  const visible = rows.filter(
    (r) =>
      (streamFilter === 'all' || r.stream === streamFilter) &&
      (!search || r.msg.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <ViewHeader title="Logs" subtitle="Live container output" />
      <div className="toolbar">
        <select
          className="select"
          style={{ width: 220 }}
          value={containerId}
          onChange={(e) => setContainerId(e.target.value)}
        >
          <option value="">Select a container…</option>
          {containers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.status})
            </option>
          ))}
        </select>
        <input
          className="input mono"
          style={{ width: 200 }}
          placeholder="Search logs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-sep" />
        {(['all', 'stdout', 'stderr'] as const).map((f) => (
          <button
            key={f}
            className={'filter-tab' + (streamFilter === f ? ' active' : '')}
            onClick={() => setStreamFilter(f)}
          >
            {f}
          </button>
        ))}
        <button
          className={'btn' + (follow ? ' btn-primary' : '')}
          onClick={() => setFollow((f) => !f)}
          disabled={!isTauri()}
        >
          {follow ? 'Following' : 'Follow'}
        </button>
        <button
          className="btn"
          style={{ marginLeft: 'auto' }}
          onClick={() => void handleRefresh()}
          disabled={refreshing || !containerId}
        >
          <RefreshCw size={13} className={refreshing ? 'spin' : ''} />
          Refresh
        </button>
      </div>
      {!isTauri() && (
        <div
          style={{
            padding: '6px 14px',
            fontSize: 11,
            color: 'var(--amber)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          Logs require the native app — Docker socket is unavailable in the
          browser.
        </div>
      )}
      {error && (
        <div
          style={{
            padding: '8px 14px',
            fontSize: 12,
            color: 'var(--red)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {error}
        </div>
      )}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--bg0)',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 11.5,
        }}
      >
        {visible.length === 0 && (
          <div style={{ padding: '12px 14px', color: 'var(--text-2)' }}>
            {containerId
              ? 'No matching log lines yet…'
              : 'Select a container to view its logs'}
          </div>
        )}
        {visible.map((l) => (
          <div
            key={l.id}
            style={{
              display: 'flex',
              gap: 12,
              padding: '4px 14px',
              borderBottom: '1px solid var(--border)',
              alignItems: 'baseline',
            }}
          >
            <span style={{ color: 'var(--text-2)', flexShrink: 0, width: 56 }}>
              {l.time}
            </span>
            <span
              style={{
                color: STREAM_COLOR[l.stream],
                flexShrink: 0,
                width: 48,
                fontWeight: 600,
              }}
            >
              {l.stream}
            </span>
            <span
              style={{
                color: 'var(--purple)',
                flexShrink: 0,
                width: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {l.src}
            </span>
            <span style={{ color: 'var(--text-1)', flex: 1 }}>{l.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
