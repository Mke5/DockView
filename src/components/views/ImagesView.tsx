import { useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  DownloadCloud,
  RefreshCw,
  Scissors,
  UploadCloud,
} from 'lucide-react';
import { DockerImage, useAppStore, useImageStore } from '../../store';
import { ImageSortKey } from '../../store/imageStore';
import { useResizeXRight } from '../shared/useResize';
import {
  Modal,
  Field,
  ViewHeader,
  DropdownMenu,
  DropdownHeader,
  DropdownItem,
  KVRow,
  Spinner,
} from '../shared/ui';
import {
  removeImage,
  pruneImages,
  pullImageStream,
} from '../../backend/docker';
import { isTauri } from '../../backend/utils';

type ImageFilter = 'all' | 'in-use' | 'unused';
const FILTERS: { id: ImageFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in-use', label: 'In use' },
  { id: 'unused', label: 'Unused' },
];
const SORTS: { key: ImageSortKey; label: string }[] = [
  { key: 'repository', label: 'Repository' },
  { key: 'tag', label: 'Tag' },
  { key: 'size', label: 'Size' },
  { key: 'created', label: 'Created' },
];

function totalSizeGB(images: DockerImage[]) {
  const b = images.reduce((a, i) => a + i.sizeBytes, 0);
  return b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(0)} MB`;
}

const REPO_COLORS: Record<string, string> = {
  nginx: '#009900',
  node: '#68a063',
  postgres: '#336791',
  redis: '#d82c20',
  python: '#3776ab',
  ubuntu: '#e95420',
  alpine: '#0d597f',
  mysql: '#00758f',
  mongo: '#13aa52',
};

function repoColor(name: string) {
  return (
    REPO_COLORS[name.split('/').pop()?.split(':')[0] || ''] || 'var(--blue)'
  );
}

export default function ImagesView() {
  const {
    images,
    selectedId,
    filter,
    sortKey,
    sortDir,
    selectImage,
    setFilter,
    setSort,
    removeImage: removeFromStore,
    pruneUnused,
  } = useImageStore();
  const { searchQuery } = useAppStore();

  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState<DockerImage | null>(null);
  const [confirmPrune, setConfirmPrune] = useState(false);
  const [pruning, setPruning] = useState(false);
  const [refreshing] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const detail = useResizeXRight(300, 240, 520);

  const filtered = images.filter((img) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'in-use' && img.inUse) ||
      (filter === 'unused' && !img.inUse);
    const matchSearch =
      !searchQuery ||
      img.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tag.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'repository':
        cmp = a.repository.localeCompare(b.repository);
        break;
      case 'tag':
        cmp = a.tag.localeCompare(b.tag);
        break;
      case 'size':
        cmp = a.sizeBytes - b.sizeBytes;
        break;
      case 'created':
        cmp = a.created.localeCompare(b.created);
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const selected = images.find((i) => i.id === selectedId) ?? null;
  const unused = images.filter((i) => !i.inUse);

  async function handlePrune() {
    setPruning(true);
    try {
      if (isTauri()) {
        await pruneImages();
        unused.forEach((img) => removeFromStore(img.id));
      } else {
        pruneUnused();
      }
    } finally {
      setPruning(false);
      setConfirmPrune(false);
    }
  }

  async function handleRemove(img: DockerImage) {
    if (!confirm(`Remove image ${img.repository}:${img.tag}?`)) return;
    try {
      if (isTauri()) await removeImage(img.id, true);
      removeFromStore(img.id);
      if (selectedId === img.id) selectImage(null);
    } catch (e: any) {
      alert(e?.message || String(e));
    }
  }

  const COLS = [
    { label: 'Repository', key: 'repository' as ImageSortKey, w: '30%' },
    { label: 'Tag', key: 'tag' as ImageSortKey, w: '12%' },
    { label: 'Size', key: 'size' as ImageSortKey, w: '10%' },
    { label: 'Created', key: 'created' as ImageSortKey, w: '12%' },
    { label: 'Status', key: null as ImageSortKey | null, w: '10%' },
    { label: 'ID', key: null as ImageSortKey | null, w: '12%' },
    { label: '', key: null as ImageSortKey | null, w: '80px' },
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
        title="Images"
        subtitle={`${images.length} images · ${totalSizeGB(images)} total`}
      />

      <div className="toolbar">
        <button
          className="btn btn-primary"
          onClick={() => setShowPullModal(true)}
        >
          <DownloadCloud size={13} /> Pull
        </button>
        {selected && (
          <button className="btn" onClick={() => setShowPushModal(selected)}>
            <UploadCloud size={13} /> Push
          </button>
        )}
        <button
          className="btn"
          onClick={() => setConfirmPrune(true)}
          disabled={unused.length === 0}
        >
          <Scissors size={13} /> Prune unused ({unused.length})
        </button>
        <button className="btn" disabled={refreshing}>
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
          <div ref={sortRef} style={{ position: 'relative' }}>
            <button className="btn" onClick={() => setShowSortMenu((v) => !v)}>
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
                    onClick={() => {
                      setSort(s.key);
                      setShowSortMenu(false);
                    }}
                  >
                    {s.label}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
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
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((img) => (
                <tr
                  key={img.id}
                  className={`tbl-row ${selectedId === img.id ? 'selected' : ''}`}
                  onClick={() =>
                    selectImage(selectedId === img.id ? null : img.id)
                  }
                >
                  <td>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 5,
                          background: 'var(--bg4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          border: `1px solid ${repoColor(img.repository)}33`,
                        }}
                      >
                        <span
                          className="mono"
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: repoColor(img.repository),
                          }}
                        >
                          {img.repository.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <span
                        className="mono"
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: 'var(--text-0)',
                        }}
                      >
                        {img.repository}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="tag mono" style={{ fontSize: 10.5 }}>
                      {img.tag}
                    </span>
                  </td>
                  <td>
                    <span className="mono" style={{ fontSize: 11 }}>
                      {img.size}
                    </span>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: 11, color: 'var(--text-2)' }}
                    >
                      {img.created}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-${img.inUse ? 'running' : 'stopped'}`}
                    >
                      {img.inUse ? 'in use' : 'unused'}
                    </span>
                  </td>
                  <td>
                    <span
                      className="mono"
                      style={{ fontSize: 10, color: 'var(--text-2)' }}
                    >
                      {img.shortId}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 3 }}>
                      <button
                        className="btn-icon"
                        title="Push"
                        onClick={() => setShowPushModal(img)}
                      >
                        <UploadCloud size={12} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Remove"
                        style={{ color: 'var(--red)' }}
                        onClick={() => handleRemove(img)}
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={COLS.length}>
                    <div className="empty-state">
                      No images match the filter.
                    </div>
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
                <div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text-0)',
                    }}
                  >
                    {selected.repository}:{selected.tag}
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
                <button className="btn-icon" onClick={() => selectImage(null)}>
                  ✕
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                <span
                  className={`badge badge-${selected.inUse ? 'running' : 'stopped'}`}
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
                      letterSpacing: '0.08em',
                      color: 'var(--text-2)',
                      marginBottom: 8,
                    }}
                  >
                    Details
                  </div>
                  <div className="detail-kv" style={{ rowGap: 8 }}>
                    <KVRow label="Repository" value={selected.repository} />
                    <KVRow label="Tag" value={selected.tag} />
                    <KVRow label="Size" value={selected.size} />
                    <KVRow label="Created" value={selected.created} />
                    <KVRow label="Architecture" value={selected.architecture} />
                    <KVRow label="OS" value={selected.os} />
                    <KVRow
                      label="Digest"
                      value={selected.digest?.slice(0, 20) + '…'}
                    />
                  </div>
                </div>
                {selected.containers.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div
                      className="mono"
                      style={{
                        fontSize: 9.5,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--text-2)',
                        marginBottom: 6,
                      }}
                    >
                      Used by
                    </div>
                    {selected.containers.map((name) => (
                      <div
                        key={name}
                        className="tag"
                        style={{ marginBottom: 4 }}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <button
                    className="btn"
                    style={{ justifyContent: 'center' }}
                    onClick={() => setShowPushModal(selected)}
                  >
                    <UploadCloud size={13} /> Push
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleRemove(selected)}
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showPullModal && (
        <PullModal
          onClose={() => setShowPullModal(false)}
        />
      )}
      {showPushModal && (
        <PushModal
          image={showPushModal}
          onClose={() => setShowPushModal(null)}
        />
      )}
      {confirmPrune && (
        <Modal
          title="Prune unused images"
          onClose={() => setConfirmPrune(false)}
          width={400}
          footer={
            <>
              <button className="btn" onClick={() => setConfirmPrune(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handlePrune}
                disabled={pruning}
              >
                {pruning ? (
                  <>
                    <Spinner size={13} /> Pruning…
                  </>
                ) : (
                  <>
                    <Scissors size={13} /> Prune {unused.length} images
                  </>
                )}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6 }}>
            This will remove{' '}
            <strong style={{ color: 'var(--text-0)' }}>
              {unused.length} unused images
            </strong>
            , freeing up{' '}
            <strong style={{ color: 'var(--text-0)' }}>
              {totalSizeGB(unused)}
            </strong>{' '}
            of disk space.
          </p>
        </Modal>
      )}
    </div>
  );
}

function PullModal({
  onClose,
}: {
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('latest');
  const [selected, setSelected] = useState('');
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const imageName = selected || query;
  const POPULAR = [
    { name: 'nginx', tag: 'alpine', desc: 'Web server' },
    { name: 'postgres', tag: '15', desc: 'Database' },
    { name: 'redis', tag: '7-alpine', desc: 'Cache' },
    { name: 'node', tag: '20-slim', desc: 'Node.js' },
    { name: 'python', tag: '3.11', desc: 'Python' },
    { name: 'alpine', tag: 'latest', desc: 'Minimal Linux' },
    { name: 'ubuntu', tag: '22.04', desc: 'Ubuntu' },
    { name: 'mysql', tag: '8.0', desc: 'MySQL' },
  ];
  const filtered = POPULAR.filter(
    (p) => !query || p.name.startsWith(query.toLowerCase())
  );

  async function handlePull() {
    if (!imageName.trim()) return;
    setPulling(true);
    setProgress(0);
    setError('');
    const t = tag.trim() || 'latest';

    if (isTauri()) {
      try {
        let p = 0;
        const stop = await pullImageStream(imageName.trim(), t, (chunk) => {
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
        });
      } catch (e: any) {
        setError(e?.message || String(e));
        setPulling(false);
      }
    } else {
      const steps = [
        'Resolving…',
        'Downloading layers…',
        'Verifying…',
        'Extracting…',
        'Done',
      ];
      let p = 0;
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
              placeholder="Image name…"
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
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
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
                  padding: '7px 10px',
                  borderRadius: 4,
                  border: `1px solid ${selected === img.name ? 'rgba(77,158,255,0.3)' : 'var(--border)'}`,
                  background:
                    selected === img.name ? 'var(--blue-dim)' : 'var(--bg3)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    color:
                      selected === img.name ? 'var(--blue)' : 'var(--text-0)',
                    flex: 1,
                  }}
                >
                  {img.name}
                  <span style={{ color: 'var(--text-2)' }}>:{img.tag}</span>
                </span>
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

function PushModal({
  image,
  onClose,
}: {
  image: DockerImage;
  onClose: () => void;
}) {
  const [registry, setRegistry] = useState('docker.io');
  const [tag, setTag] = useState(image.tag);
  const [pushing, setPushing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  async function handlePush() {
    setPushing(true);
    // Simulate push progress (real push would use a streaming invoke)
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 10 + 5;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(iv);
        setDone(true);
        setPushing(false);
      }
    }, 180);
  }

  return (
    <Modal
      title={`Push ${image.repository}:${image.tag}`}
      onClose={onClose}
      width={440}
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
              onClick={handlePush}
              disabled={pushing}
            >
              {pushing ? (
                <>
                  <Spinner size={13} /> Pushing…
                </>
              ) : (
                <>
                  <UploadCloud size={13} /> Push
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
            Push complete
          </div>
          <div
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}
          >
            {registry}/{image.repository}:{tag}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Registry">
            <select
              className="select"
              value={registry}
              onChange={(e) => setRegistry(e.target.value)}
            >
              <option value="docker.io">Docker Hub (docker.io)</option>
              <option value="ghcr.io">
                GitHub Container Registry (ghcr.io)
              </option>
              <option value="custom">Custom…</option>
            </select>
          </Field>
          <Field label="Tag">
            <input
              className="input mono"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            />
          </Field>
          <div
            style={{
              background: 'var(--bg0)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '8px 12px',
            }}
          >
            <div
              className="mono"
              style={{
                fontSize: 9.5,
                color: 'var(--text-2)',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              Destination
            </div>
            <div
              className="mono"
              style={{ fontSize: 12, color: 'var(--text-0)' }}
            >
              {registry}/{image.repository}:{tag}
            </div>
          </div>
          {pushing && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 5,
                }}
              >
                <span
                  className="mono"
                  style={{ fontSize: 11, color: 'var(--text-1)' }}
                >
                  Pushing layers…
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
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
