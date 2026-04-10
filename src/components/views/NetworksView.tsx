import { useEffect, useRef, useState } from "react";
import { Network, useAppStore, useNetworkStore } from "../../store";
import { NetworkFilter, NetworkSortKey } from "../../store/networkStore";
import { Dropdown, DropdownCheckItem, DropdownHeader } from "../DropDown";
import {
  ArrowDown,
  ArrowUp,
  Network as NetworkIcon,
  Plus,
  RefreshCcw,
  Table,
} from "lucide-react";
import { NetworkRow, ViewToggle } from "../NetworksViewComponents/NetworkRow";
import {
  ConnectContainerModal,
  CreateNetworkModal,
  DetailPanel,
  TopologyView,
} from "../NetworksViewComponents/Modal";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const SORT_OPTIONS: { key: NetworkSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "driver", label: "Driver" },
  { key: "created", label: "Created" },
  { key: "containers", label: "Containers" },
];

const FILTER_TABS: { id: NetworkFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "custom", label: "Custom" },
  { id: "default", label: "Default" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function sortNetworks(
  list: Network[],
  key: NetworkSortKey,
  dir: "asc" | "desc",
) {
  return [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "driver":
        cmp = a.driver.localeCompare(b.driver);
        break;
      case "created":
        cmp = a.created.localeCompare(b.created);
        break;
      case "containers":
        cmp = a.containers.length - b.containers.length;
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

export default function NetworksView() {
  const {
    networks,
    selectedId,
    filter,
    sortKey,
    sortDir,
    selectNetwork,
    setFilter,
    setSort,
    removeNetwork,
    addNetwork,
    connectContainer,
    disconnectContainer,
  } = useNetworkStore();
  const { searchQuery } = useAppStore();

  const [view, setView] = useState<"table" | "topology">("table");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState<Network | null>(
    null,
  );
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSortMenu(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = networks.filter((n) => {
    const matchFilter =
      filter === "all" ||
      (filter === "custom" && !n.isDefault) ||
      (filter === "default" && n.isDefault);
    const matchSearch =
      !searchQuery ||
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.driver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subnet.includes(searchQuery);
    return matchFilter && matchSearch;
  });

  const sorted = sortNetworks(filtered, sortKey, sortDir);
  const selected = networks.find((n) => n.id === selectedId) ?? null;
  const customCount = networks.filter((n) => !n.isDefault).length;
  const totalContainers = networks.reduce((a, n) => a + n.containers.length, 0);
  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? "";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Networks
        </h1>
        <p
          className="text-xs font-mono mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {networks.length} networks · {customCount} custom · {totalContainers}{" "}
          container endpoints
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-2 shrink-0">
        <button
          className="toolbar-btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" /> Create network
        </button>
        <button className="toolbar-btn">
          <RefreshCcw className="w-4 h-4" /> Refresh
        </button>

        <div
          className="w-px h-5 mx-1"
          style={{ background: "var(--border)" }}
        />

        <div className="flex gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`filter-tab ${filter === tab.id ? "active" : ""}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Sort dropdown — only in table view */}
          {view === "table" && (
            <div ref={sortRef} className="relative">
              <button
                className="toolbar-btn flex items-center gap-1.5"
                style={
                  sortKey !== "name"
                    ? {
                        color: "var(--accent)",
                        borderColor: "rgba(0,212,255,0.3)",
                        background: "var(--accent-dim)",
                      }
                    : {}
                }
                onClick={() => setShowSortMenu((v) => !v)}
              >
                {sortDir === "asc" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}{" "}
                Sort
                {sortKey !== "name" && (
                  <span
                    className="text-[9px] px-1 py-px rounded font-mono"
                    style={{
                      background: "rgba(0,212,255,0.2)",
                      color: "var(--accent)",
                    }}
                  >
                    {activeSortLabel}
                  </span>
                )}
              </button>
              {showSortMenu && (
                <Dropdown right>
                  <DropdownHeader>Sort by</DropdownHeader>
                  {SORT_OPTIONS.map((opt) => (
                    <DropdownCheckItem
                      key={opt.key}
                      label={opt.label}
                      checked={sortKey === opt.key}
                      suffix={
                        sortKey === opt.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="w-3 h-3 inline" />
                          ) : (
                            <ArrowDown className="w-3 h-3 inline" />
                          )
                        ) : undefined
                      }
                      onClick={() => setSort(opt.key)}
                    />
                  ))}
                </Dropdown>
              )}
            </div>
          )}

          {/* View toggle */}
          <div
            className="flex rounded overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <ViewToggle
              active={view === "table"}
              onClick={() => setView("table")}
            >
              <span className="flex items-center gap-1">
                <Table className="w-4 h-4" />
                Table
              </span>
            </ViewToggle>

            <ViewToggle
              active={view === "topology"}
              onClick={() => setView("topology")}
              last
            >
              <span className="flex items-center gap-1">
                <NetworkIcon className="w-4 h-4" />
                Topology
              </span>
            </ViewToggle>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {view === "table" ? (
          <>
            {/* Table */}
            <div
              className={`flex flex-col overflow-hidden transition-all duration-200 ${selected ? "flex-[1.5]" : "flex-1"}`}
            >
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                <table
                  className="w-full"
                  style={{ borderCollapse: "separate", borderSpacing: "0 3px" }}
                >
                  <thead>
                    <tr>
                      {[
                        {
                          label: "Name",
                          key: "name" as NetworkSortKey,
                          w: "20%",
                        },
                        {
                          label: "Driver",
                          key: "driver" as NetworkSortKey,
                          w: "9%",
                        },
                        { label: "Subnet", key: null, w: "14%" },
                        { label: "Gateway", key: null, w: "13%" },
                        { label: "Scope", key: null, w: "8%" },
                        { label: "Flags", key: null, w: "14%" },
                        {
                          label: "Containers",
                          key: "containers" as NetworkSortKey,
                          w: "12%",
                        },
                        { label: "", key: null, w: "8%" },
                      ].map((h, i) => (
                        <th
                          key={i}
                          style={{
                            width: h.w,
                            textAlign: "left",
                            fontSize: "10px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            fontFamily: "monospace",
                            padding: "6px 12px",
                            position: "sticky",
                            top: 0,
                            zIndex: 10,
                            color:
                              sortKey === h.key
                                ? "var(--accent)"
                                : "var(--text-muted)",
                            background: "var(--bg0)",
                            borderBottom: "1px solid var(--border)",
                            cursor: h.key ? "pointer" : "default",
                            userSelect: "none",
                          }}
                          onClick={() => h.key && setSort(h.key)}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {h.label}
                            {h.key && sortKey === h.key && (
                              <span style={{ color: "var(--accent)" }}>
                                {sortDir === "asc" ? (
                                  <ArrowUp className="w-3 h-3 inline" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 inline" />
                                )}
                              </span>
                            )}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-12 text-sm font-mono"
                          style={{ color: "var(--text-muted)" }}
                        >
                          No networks match the current filter.
                        </td>
                      </tr>
                    ) : (
                      sorted.map((net) => (
                        <NetworkRow
                          key={net.id}
                          network={net}
                          selected={selectedId === net.id}
                          onSelect={() =>
                            selectNetwork(selectedId === net.id ? null : net.id)
                          }
                          onRemove={() => removeNetwork(net.id)}
                          onConnect={() => setShowConnectModal(net)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detail panel */}
            {selected && (
              <DetailPanel
                network={selected}
                onClose={() => selectNetwork(null)}
                onRemove={() => {
                  removeNetwork(selected.id);
                  selectNetwork(null);
                }}
                onConnect={() => setShowConnectModal(selected)}
                onDisconnect={(containerName) =>
                  disconnectContainer(selected.id, containerName)
                }
              />
            )}
          </>
        ) : (
          <TopologyView
            networks={networks}
            selectedId={selectedId}
            onSelect={selectNetwork}
            onConnect={(net) => setShowConnectModal(net)}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateNetworkModal
          onClose={() => setShowCreateModal(false)}
          onCreate={addNetwork}
        />
      )}
      {showConnectModal && (
        <ConnectContainerModal
          network={showConnectModal}
          onClose={() => setShowConnectModal(null)}
          onConnect={(container) => {
            connectContainer(showConnectModal.id, container);
            setShowConnectModal(null);
          }}
        />
      )}
    </div>
  );
}
