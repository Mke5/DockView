import React, { useState } from 'react';
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
  Network,
  Volume,
} from '../../store';
import { ViewHeader, StatusBadge, Modal, Field, Spinner } from '../shared/ui';
import { useResizeXRight } from '../shared/useResize';
import { isTauri } from '../../backend/utils';
import { invoke } from '@tauri-apps/api/core';

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
      if (isTauri()) await invoke('volume_remove', { name: v.name });
    } catch {}
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
                        onClick={() => handleRemove(v)}
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
      if (isTauri())
        await invoke('volume_create', { name: name.trim(), driver });
      onCreated({
        id: 'vol-' + Date.now(),
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
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || String(e));
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
          <button className="btn btn-primary" onClick={handleCreate}>
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
      if (isTauri()) await invoke('network_remove', { name: n.name });
    } catch {}
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
                        onClick={() => handleRemove(n)}
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
                      onClick={() => handleRemove(selected)}
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
      if (isTauri())
        await invoke('network_create', {
          name: name.trim(),
          driver,
          subnet: subnet.trim() || null,
          internal,
        });
      onCreated({
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
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || String(e));
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
          <button className="btn btn-primary" onClick={handleCreate}>
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
  onAdd: (b: any) => void;
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
      if (isTauri())
        await invoke('image_build', { tag: image.trim(), dockerfile, context });
      onAdd({
        id: 'build-' + Date.now(),
        image: image.trim(),
        dockerfile,
        context,
        status: 'building',
        durationMs: 0,
        sizeBytes: 0,
        size: '—',
        startedAt: new Date().toLocaleString(),
        logs: ['Starting build…'],
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || String(e));
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
            onClick={handleBuild}
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

// ─── Logs (placeholder) ───────────────────────────────────────────────────────

const SAMPLE_LOGS = [
  {
    time: '14:32:01',
    level: 'INFO',
    src: 'nginx-proxy',
    msg: 'GET /api/health 200 OK (3ms)',
  },
  {
    time: '14:32:02',
    level: 'INFO',
    src: 'postgres-db',
    msg: 'checkpoint starting: time',
  },
  {
    time: '14:32:03',
    level: 'WARN',
    src: 'redis-cache',
    msg: 'Slow log: 142ms',
  },
  {
    time: '14:32:04',
    level: 'INFO',
    src: 'app',
    msg: 'Connected to postgres at 172.18.0.3:5432',
  },
  {
    time: '14:32:05',
    level: 'ERROR',
    src: 'worker',
    msg: 'Job failed: connection refused',
  },
  {
    time: '14:32:06',
    level: 'INFO',
    src: 'nginx-proxy',
    msg: 'POST /api/login 200 OK (12ms)',
  },
  {
    time: '14:32:07',
    level: 'DEBUG',
    src: 'app',
    msg: 'Cache hit for key user:42',
  },
  {
    time: '14:32:08',
    level: 'INFO',
    src: 'postgres-db',
    msg: 'checkpoint complete: wrote 14 buffers',
  },
];
const LEVEL_COLOR: Record<string, string> = {
  INFO: 'var(--blue)',
  WARN: 'var(--amber)',
  ERROR: 'var(--red)',
  DEBUG: 'var(--text-2)',
};

export function LogsView() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const logs = SAMPLE_LOGS.filter(
    (l) =>
      (filter === 'all' || l.level === filter) &&
      (!search || l.msg.includes(search) || l.src.includes(search))
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
      <ViewHeader title="Logs" subtitle="Aggregated container output" />
      <div className="toolbar">
        <input
          className="input mono"
          style={{ width: 200 }}
          placeholder="Search logs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-sep" />
        {['all', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map((f) => (
          <button
            key={f}
            className={'filter-tab' + (filter === f ? ' active' : '')}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
        <button className="btn" style={{ marginLeft: 'auto' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: 'var(--bg0)',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 11.5,
        }}
      >
        {logs.map((l, i) => (
          <div
            key={i}
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
                color: LEVEL_COLOR[l.level],
                flexShrink: 0,
                width: 44,
                fontWeight: 600,
              }}
            >
              {l.level}
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


