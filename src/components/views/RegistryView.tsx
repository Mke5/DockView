import React, { useRef, useState } from 'react';
import {
  Archive,
  Check,
  Plus,
  RefreshCw,
  Trash2,
  UploadCloud,
  DownloadCloud,
  X,
} from 'lucide-react';
import {
  RegistryAccount,
  RegistryRepo,
  RegistryTag,
  useAppStore,
  useRegistryStore,
} from '../../store';
import { Modal, Field, ViewHeader, StatusBadge, Spinner } from '../shared/ui';
import { useResizeXRight } from '../shared/useResize';
import { isTauri } from '../../backend/utils';
import { invoke } from '@tauri-apps/api/core';

export default function RegistryView() {
  const {
    accounts,
    selectedAccountId,
    selectedRepoId,
    searchQuery,
    selectAccount,
    selectRepo,
    setSearchQuery,
    disconnectAccount,
    connectAccount,
    addAccount,
    addRepo,
    addTag,
    deleteRepo,
  } = useRegistryStore();
  const { searchQuery: globalSearch } = useAppStore();

  const [showAddRegistry, setShowAddRegistry] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [pullModal, setPullModal] = useState<{
    repo: RegistryRepo;
    account: RegistryAccount;
  } | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const detail = useResizeXRight(300, 240, 520);
  const effectiveSearch = searchQuery || globalSearch;
  const activeAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;
  const selectedRepo =
    activeAccount?.repos.find((r) => r.id === selectedRepoId) ?? null;

  const filteredRepos = (activeAccount?.repos ?? []).filter(
    (r) =>
      !effectiveSearch ||
      r.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(effectiveSearch.toLowerCase())
  );

  async function handleConnect(id: string) {
    setConnectingId(id);
    try {
      if (isTauri()) {
        const account = accounts.find((a) => a.id === id);
        if (account)
          await invoke('registry_login', {
            registry: account.namespace,
            username: account.username || '',
            password: '',
          });
      }
      setTimeout(() => {
        connectAccount(id);
        setConnectingId(null);
      }, 1000);
    } catch {
      setConnectingId(null);
    }
  }

  const REGISTRY_ICONS: Record<string, string> = {
    'docker.io': '🐳',
    'ghcr.io': '🐙',
    'gcr.io': '☁️',
    ecr: '🟧',
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
        title="Registry"
        subtitle={`${accounts.length} registries · ${accounts.filter((a) => a.status === 'connected').length} connected · ${accounts.reduce((a, r) => a + r.repos.length, 0)} repositories`}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Registry list — left panel */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '8px 8px 4px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <button
              className="btn btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: 11.5,
              }}
              onClick={() => setShowAddRegistry(true)}
            >
              <Plus size={13} /> Add registry
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 6 }}>
            {accounts.map((acc) => (
              <button
                key={acc.id}
                className={
                  'nav-item' + (selectedAccountId === acc.id ? ' active' : '')
                }
                onClick={() => selectAccount(acc.id)}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>
                  {REGISTRY_ICONS[acc.namespace] ?? '📦'}
                </span>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: 'var(--text-0)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {acc.name}
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 9.5, color: 'var(--text-2)' }}
                  >
                    {acc.namespace}
                  </div>
                </div>
                <span
                  className={'badge badge-' + acc.status}
                  style={{ fontSize: 9, padding: '1px 5px' }}
                >
                  {acc.status === 'connected' ? '●' : '○'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Repo list — middle panel */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div className="toolbar">
            {activeAccount ? (
              <>
                <input
                  className="input mono"
                  style={{ flex: 1, maxWidth: 260 }}
                  placeholder={'Search ' + activeAccount.namespace + '…'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {activeAccount.status === 'connected' && (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowPushModal(true)}
                    >
                      <UploadCloud size={13} /> Push
                    </button>
                    <button className="btn">
                      <Plus size={13} /> New repo
                    </button>
                  </>
                )}
                <button className="btn">
                  <RefreshCw size={13} />
                </button>
              </>
            ) : (
              <span
                className="mono"
                style={{ fontSize: 12, color: 'var(--text-2)' }}
              >
                Select a registry
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'auto' }}>
            {!activeAccount ? (
              <div className="empty-state">
                <Archive size={28} style={{ opacity: 0.3 }} />
                <span>Select a registry to view repositories</span>
              </div>
            ) : activeAccount.status !== 'connected' ? (
              <div className="empty-state">
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'var(--amber-dim)',
                    border: '1px solid rgba(245,166,35,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ color: 'var(--amber)', fontSize: 20 }}>⚠</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-1)' }}>
                  Registry disconnected
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleConnect(activeAccount.id)}
                >
                  {connectingId === activeAccount.id ? (
                    <>
                      <Spinner size={13} /> Connecting…
                    </>
                  ) : (
                    'Connect'
                  )}
                </button>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="empty-state">
                <span>No repositories found</span>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead className="tbl-head">
                  <tr>
                    <th>Repository</th>
                    <th>Tags</th>
                    <th>Last pushed</th>
                    <th>Visibility</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepos.map((repo) => (
                    <tr
                      key={repo.id}
                      className={
                        'tbl-row' +
                        (selectedRepoId === repo.id ? ' selected' : '')
                      }
                      onClick={() =>
                        selectRepo(selectedRepoId === repo.id ? null : repo.id)
                      }
                    >
                      <td>
                        <div
                          className="mono"
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--text-0)',
                          }}
                        >
                          {repo.name}
                        </div>
                        {repo.description && (
                          <div
                            style={{
                              fontSize: 11,
                              color: 'var(--text-2)',
                              marginTop: 2,
                            }}
                          >
                            {repo.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="tag mono">
                          {repo.tags.length} tags
                        </span>
                      </td>
                      <td>
                        <span
                          className="mono"
                          style={{ fontSize: 11, color: 'var(--text-2)' }}
                        >
                          {repo.lastPushed}
                        </span>
                      </td>
                      <td>
                        <span
                          className={
                            'badge badge-' +
                            (repo.isPrivate ? 'stopped' : 'info')
                          }
                        >
                          {repo.isPrivate ? 'private' : 'public'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 3 }}>
                          <button
                            className="btn-icon"
                            title="Pull"
                            onClick={() =>
                              setPullModal({ repo, account: activeAccount })
                            }
                          >
                            <DownloadCloud size={12} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Push"
                            onClick={() => setShowPushModal(true)}
                          >
                            <UploadCloud size={12} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Delete"
                            style={{ color: 'var(--red)' }}
                            onClick={() => {
                              if (confirm('Delete repo ' + repo.name + '?'))
                                deleteRepo(activeAccount.id, repo.id);
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {activeAccount?.status === 'connected' && (
            <div
              style={{
                padding: '6px 14px',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg1)',
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 10, color: 'var(--text-2)' }}
              >
                {filteredRepos.length} repositories · synced{' '}
                {activeAccount.lastSync}
              </span>
            </div>
          )}
        </div>

        {/* Repo detail panel */}
        {selectedRepo && activeAccount && (
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
                    {selectedRepo.name}
                  </div>
                  <div
                    className="mono"
                    style={{
                      fontSize: 10,
                      color: 'var(--text-2)',
                      marginTop: 2,
                    }}
                  >
                    {activeAccount.namespace}/{selectedRepo.name}
                  </div>
                </div>
                <button className="btn-icon" onClick={() => selectRepo(null)}>
                  ✕
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 6,
                    marginBottom: 14,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    className={
                      'badge badge-' +
                      (selectedRepo.isPrivate ? 'stopped' : 'info')
                    }
                  >
                    {selectedRepo.isPrivate ? 'private' : 'public'}
                  </span>
                  {selectedRepo.description && (
                    <span style={{ fontSize: 12, color: 'var(--text-1)' }}>
                      {selectedRepo.description}
                    </span>
                  )}
                </div>
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
                  Tags
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  {selectedRepo.tags.map((tag) => (
                    <div
                      key={tag.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
                        borderRadius: 4,
                        border: '1px solid var(--border)',
                        background: 'var(--bg3)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="mono"
                          style={{
                            fontSize: 12,
                            color: 'var(--text-0)',
                            fontWeight: 500,
                          }}
                        >
                          {tag.name}
                        </div>
                        <div
                          className="mono"
                          style={{ fontSize: 10, color: 'var(--text-2)' }}
                        >
                          {tag.size} · {tag.pushed}
                        </div>
                      </div>
                      <button
                        className="btn-icon"
                        title="Pull this tag"
                        onClick={() =>
                          setPullModal({
                            repo: selectedRepo,
                            account: activeAccount,
                          })
                        }
                      >
                        <DownloadCloud size={12} />
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
                  <button
                    className="btn btn-primary"
                    style={{ justifyContent: 'center' }}
                    onClick={() =>
                      setPullModal({
                        repo: selectedRepo,
                        account: activeAccount,
                      })
                    }
                  >
                    <DownloadCloud size={13} /> Pull latest
                  </button>
                  <button
                    className="btn"
                    style={{ justifyContent: 'center' }}
                    onClick={() => setShowPushModal(true)}
                  >
                    <UploadCloud size={13} /> Push image
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ justifyContent: 'center' }}
                    onClick={() => {
                      if (confirm('Delete ' + selectedRepo.name + '?')) {
                        deleteRepo(activeAccount.id, selectedRepo.id);
                        selectRepo(null);
                      }
                    }}
                  >
                    <Trash2 size={13} /> Delete repo
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showAddRegistry && (
        <AddRegistryModal
          onClose={() => setShowAddRegistry(false)}
          onAdd={addAccount}
        />
      )}
      {showPushModal && (
        <PushImageModal
          onClose={() => setShowPushModal(false)}
          accounts={accounts.filter((a) => a.status === 'connected')}
          onPushed={(accountId, repo) => addRepo(accountId, repo)}
        />
      )}
      {pullModal && (
        <PullRepoModal
          repo={pullModal.repo}
          account={pullModal.account}
          onClose={() => setPullModal(null)}
        />
      )}
    </div>
  );
}

function AddRegistryModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (a: RegistryAccount) => void;
}) {
  const [type, setType] = useState<'dockerhub' | 'ghcr' | 'custom'>(
    'dockerhub'
  );
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    if (!username.trim()) {
      setError('Username is required.');
      return;
    }
    setConnecting(true);
    try {
      const namespace =
        type === 'dockerhub'
          ? 'docker.io'
          : type === 'ghcr'
            ? 'ghcr.io'
            : url.trim();
      if (isTauri())
        await invoke('registry_login', {
          registry: namespace,
          username: username.trim(),
          password: password,
        });
      onAdd({
        id: 'reg-' + type + '-' + Date.now(),
        name:
          type === 'dockerhub'
            ? 'Docker Hub'
            : type === 'ghcr'
              ? 'GitHub Container Registry'
              : url.trim(),
        namespace,
        username: username.trim(),
        status: 'connected',
        lastSync: 'just now',
        repos: [],
        isDefault: false,
      });
      onClose();
    } catch (e: any) {
      setError(e?.message || String(e));
      setConnecting(false);
    }
  }

  return (
    <Modal
      title="Add registry"
      onClose={onClose}
      width={440}
      footer={
        <>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConnect}
            disabled={connecting}
          >
            {connecting ? (
              <>
                <Spinner size={13} /> Connecting…
              </>
            ) : (
              'Connect'
            )}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Field label="Registry type">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['dockerhub', 'ghcr', 'custom'] as const).map((t) => (
              <button
                key={t}
                className={'filter-tab' + (type === t ? ' active' : '')}
                onClick={() => setType(t)}
              >
                {t === 'dockerhub'
                  ? 'Docker Hub'
                  : t === 'ghcr'
                    ? 'GitHub'
                    : 'Custom'}
              </button>
            ))}
          </div>
        </Field>
        {type === 'custom' && (
          <Field label="Registry URL" hint="e.g. registry.example.com">
            <input
              className="input mono"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="registry.example.com"
            />
          </Field>
        )}
        <Field label="Username">
          <input
            className={'input' + (error ? ' error' : '')}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            placeholder="your-username"
            autoFocus
          />
        </Field>
        <Field
          label="Password / Access Token"
          hint="Token is stored securely in system keychain"
        >
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        {error && (
          <div style={{ color: 'var(--red)', fontSize: 12 }}>{error}</div>
        )}
      </div>
    </Modal>
  );
}

function PushImageModal({
  onClose,
  accounts,
  onPushed,
}: {
  onClose: () => void;
  accounts: RegistryAccount[];
  onPushed: (accountId: string, repo: RegistryRepo) => void;
}) {
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [localImage, setLocalImage] = useState('');
  const [tag, setTag] = useState('latest');
  const [repoName, setRepoName] = useState('');
  const [pushing, setPushing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handlePush() {
    if (!localImage.trim() || !repoName.trim()) {
      setError('Image and repository name are required.');
      return;
    }
    setPushing(true);
    setProgress(0);
    setError('');
    const account = accounts.find((a) => a.id === accountId);
    const dest =
      (account?.namespace ?? 'docker.io') +
      '/' +
      repoName.trim() +
      ':' +
      (tag.trim() || 'latest');
    try {
      if (isTauri())
        await invoke('image_push', {
          image: localImage.trim(),
          destination: dest,
        });
      let p = 0;
      const iv = setInterval(() => {
        p += Math.random() * 12 + 4;
        setProgress(Math.min(p, 100));
        if (p >= 100) {
          clearInterval(iv);
          setDone(true);
          setPushing(false);
        }
      }, 180);
    } catch (e: any) {
      setError(e?.message || String(e));
      setPushing(false);
    }
  }

  return (
    <Modal
      title="Push image"
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
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Registry">
            <select
              className="select"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.namespace})
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Local image"
            hint="Image name and tag from your local images"
          >
            <input
              className="input mono"
              value={localImage}
              onChange={(e) => {
                setLocalImage(e.target.value);
                setError('');
              }}
              placeholder="nginx:alpine"
              autoFocus
            />
          </Field>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}
          >
            <Field label="Repository name">
              <input
                className="input mono"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="my-app"
              />
            </Field>
            <Field label="Tag">
              <input
                className="input mono"
                style={{ width: 80 }}
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="latest"
              />
            </Field>
          </div>
          {repoName && (
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
                {accounts.find((a) => a.id === accountId)?.namespace ??
                  'docker.io'}
                /{repoName}:{tag || 'latest'}
              </div>
            </div>
          )}
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
                  style={{ width: progress + '%' }}
                />
              </div>
            </div>
          )}
          {error && (
            <div style={{ color: 'var(--red)', fontSize: 12 }}>{error}</div>
          )}
        </div>
      )}
    </Modal>
  );
}

function PullRepoModal({
  repo,
  account,
  onClose,
}: {
  repo: RegistryRepo;
  account: RegistryAccount;
  onClose: () => void;
}) {
  const [tag, setTag] = useState(repo.tags[0]?.name ?? 'latest');
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handlePull() {
    setPulling(true);
    setProgress(0);
    const fullImage = account.namespace + '/' + repo.name + ':' + tag;
    try {
      if (isTauri()) {
        const { pullImageStream } = await import('../../backend/docker');
        const stop = await pullImageStream(fullImage, tag, (chunk) => {
          if (chunk.done) {
            setProgress(100);
            setDone(true);
            setPulling(false);
            stop();
            return;
          }
          setProgress((p) => Math.min(p + 5, 90));
        });
      } else {
        let p = 0;
        const iv = setInterval(() => {
          p += Math.random() * 14 + 4;
          setProgress(Math.min(p, 100));
          if (p >= 100) {
            clearInterval(iv);
            setDone(true);
            setPulling(false);
          }
        }, 140);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
      setPulling(false);
    }
  }

  return (
    <Modal
      title={'Pull ' + repo.name}
      onClose={onClose}
      width={420}
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
              disabled={pulling}
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
            Pull complete
          </div>
          <div
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}
          >
            {account.namespace}/{repo.name}:{tag}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: 'var(--bg3)',
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
                marginBottom: 4,
              }}
            >
              Image
            </div>
            <div
              className="mono"
              style={{ fontSize: 13, color: 'var(--text-0)', fontWeight: 500 }}
            >
              {account.namespace}/{repo.name}
            </div>
          </div>
          <Field label="Tag">
            <select
              className="select"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
            >
              {repo.tags.length > 0 ? (
                repo.tags.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.size})
                  </option>
                ))
              ) : (
                <option value="latest">latest</option>
              )}
            </select>
          </Field>
          {(pulling || progress > 0) && (
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
                  Downloading…
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
                  style={{ width: progress + '%' }}
                />
              </div>
            </div>
          )}
          {error && (
            <div style={{ color: 'var(--red)', fontSize: 12 }}>{error}</div>
          )}
        </div>
      )}
    </Modal>
  );
}
