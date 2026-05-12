import { useState } from "react";
import {
  RegistryAccount,
  RegistryRepo,
  useAppStore,
  useRegistryStore,
} from "../../store";

export default function RegistryView() {
  const {
    accounts,
    selectedAccountId,
    selectedRepoId,
    filter,
    searchQuery,
    selectAccount,
    selectRepo,
    setFilter,
    setSearchQuery,
    disconnectAccount,
    connectAccount,
    deleteRepo,
    addAccount,
    addRepo,
    addTag,
  } = useRegistryStore();
  const { searchQuery: globalSearch } = useAppStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [showPullModal, setShowPullModal] = useState<{
    repo: RegistryRepo;
    account: RegistryAccount;
  } | null>(null);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const effectiveSearch = searchQuery || globalSearch;
  const activeAccount =
    accounts.find((a) => a.id === selectedAccountId) ?? null;
  const selectedRepo =
    activeAccount?.repos.find((r) => r.id === selectedRepoId) ?? null;

  const filteredRepos = (activeAccount?.repos ?? []).filter((r) => {
    const matchFilter =
      filter === "all" ||
      (filter === "connected" && activeAccount?.status === "connected") ||
      (filter === "disconnected" && activeAccount?.status !== "connected");
    const matchSearch =
      !effectiveSearch ||
      r.name.toLowerCase().includes(effectiveSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(effectiveSearch.toLowerCase());
    return matchFilter && matchSearch;
  });

  function handleConnect(id: string) {
    setConnectingId(id);
    setTimeout(() => {
      connectAccount(id);
      setConnectingId(null);
    }, 1200);
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Registry
        </h1>
        <p
          className="text-xs font-mono mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {accounts.length} registries ·{" "}
          {accounts.filter((a) => a.status === "connected").length} connected ·{" "}
          {accounts.reduce((a, r) => a + r.repos.length, 0)} repositories
        </p>
      </div>

      {/* Body: 3-column layout */}
      <div className="flex flex-1 overflow-hidden mt-3">
        {/* ── Col 1: Account panel ── */}
        <AccountPanel
          accounts={accounts}
          selectedId={selectedAccountId}
          connectingId={connectingId}
          onSelect={selectAccount}
          onDisconnect={disconnectAccount}
          onConnect={handleConnect}
          onAdd={() => setShowAddModal(true)}
        />

        {/* ── Col 2: Repo list ── */}
        <div
          className={`flex flex-col overflow-hidden transition-all duration-200 ${selectedRepo ? "flex-[1.2]" : "flex-1"}`}
          style={{ borderLeft: "1px solid var(--border)" }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {activeAccount ? (
              <>
                <div
                  className="flex items-center gap-1.5 flex-1 px-2.5 h-7 rounded"
                  style={{
                    background: "var(--bg3)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ⌕
                  </span>
                  <input
                    type="text"
                    placeholder={`Search ${activeAccount.namespace}…`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-[11px] font-mono"
                    style={{ color: "var(--text-primary)" }}
                  />
                </div>
                {activeAccount.status === "connected" && (
                  <>
                    <button
                      className="toolbar-btn-primary text-[11px] px-2.5 py-1"
                      onClick={() => setShowPushModal(true)}
                    >
                      ⬆ Push
                    </button>
                    <button
                      className="toolbar-btn text-[11px] px-2.5 py-1"
                      onClick={() => setShowCreateRepo(true)}
                    >
                      ＋ Repo
                    </button>
                  </>
                )}
                <button className="toolbar-btn text-[11px] px-2.5 py-1">
                  ⟳
                </button>
              </>
            ) : (
              <span
                className="text-xs font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                Select a registry
              </span>
            )}
          </div>

          {/* Repo list */}
          <div className="flex-1 overflow-y-auto">
            {!activeAccount ? (
              <EmptyState
                icon="◎"
                message="Select a registry to view repositories"
              />
            ) : activeAccount.status !== "connected" ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-16">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                  style={{
                    background: "rgba(255,171,64,0.1)",
                    border: "1px solid rgba(255,171,64,0.2)",
                    color: "var(--amber)",
                  }}
                >
                  ⚠
                </div>
                <p
                  className="text-xs font-mono text-center px-6"
                  style={{ color: "var(--text-muted)" }}
                >
                  Registry disconnected
                </p>
                <button
                  className="px-4 py-2 rounded text-[11px] font-semibold cursor-pointer transition-all"
                  style={{
                    background: "var(--accent)",
                    color: "#000",
                    border: "1px solid var(--accent)",
                  }}
                  onClick={() => handleConnect(activeAccount.id)}
                >
                  {connectingId === activeAccount.id
                    ? "⟳ Connecting…"
                    : "⊕ Connect"}
                </button>
              </div>
            ) : filteredRepos.length === 0 ? (
              <EmptyState icon="◈" message="No repositories found" />
            ) : (
              <div className="flex flex-col gap-0">
                {filteredRepos.map((repo, i) => (
                  <RepoRow
                    key={repo.id}
                    repo={repo}
                    selected={selectedRepoId === repo.id}
                    last={i === filteredRepos.length - 1}
                    onSelect={() =>
                      selectRepo(selectedRepoId === repo.id ? null : repo.id)
                    }
                    onDelete={() => deleteRepo(activeAccount.id, repo.id)}
                    onPull={() =>
                      setShowPullModal({ repo, account: activeAccount })
                    }
                    onPush={() => setShowPushModal(true)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {activeAccount && activeAccount.status === "connected" && (
            <div
              className="shrink-0 flex items-center gap-3 px-4 py-2"
              style={{
                borderTop: "1px solid var(--border)",
                background: "var(--bg1)",
              }}
            >
              <span
                className="text-[10px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                {filteredRepos.length}{" "}
                {filteredRepos.length === 1 ? "repository" : "repositories"}
              </span>
              <span
                className="text-[10px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                · synced {activeAccount.lastSync}
              </span>
            </div>
          )}
        </div>

        {/* ── Col 3: Repo detail ── */}
        {selectedRepo && activeAccount && (
          <RepoDetailPanel
            repo={selectedRepo}
            account={activeAccount}
            onClose={() => selectRepo(null)}
            onDelete={() => {
              deleteRepo(activeAccount.id, selectedRepo.id);
              selectRepo(null);
            }}
            onPull={() =>
              setShowPullModal({ repo: selectedRepo, account: activeAccount })
            }
            onPush={() => setShowPushModal(true)}
            onTagAdded={(tag) => addTag(activeAccount.id, selectedRepo.id, tag)}
          />
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddRegistryModal
          onClose={() => setShowAddModal(false)}
          onAdd={addAccount}
        />
      )}
      {showPushModal && (
        <PushImageModal
          onClose={() => setShowPushModal(false)}
          accounts={accounts.filter((a) => a.status === "connected")}
          onPushed={(accountId, repo) => addRepo(accountId, repo)}
        />
      )}
      {showPullModal && (
        <PullImageModal
          onClose={() => setShowPullModal(null)}
          repo={showPullModal.repo}
          account={showPullModal.account}
        />
      )}
      {showCreateRepo && activeAccount && (
        <CreateRepoModal
          onClose={() => setShowCreateRepo(false)}
          account={activeAccount}
          onCreated={(repo) => {
            addRepo(activeAccount.id, repo);
            setShowCreateRepo(false);
          }}
        />
      )}
    </div>
  );
}
