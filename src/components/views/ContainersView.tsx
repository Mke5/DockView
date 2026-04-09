import {
  ArrowDown,
  ArrowUp,
  Download,
  Grid,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  ContainerGroupKey,
  ContainerSortKey,
  useContainerStore,
} from "../../store/containerStore";
import { Dropdown, DropdownCheckItem, DropdownHeader } from "../DropDown";
import { useEffect, useRef, useState } from "react";
import { Container, ContainerStatus, useAppStore } from "../../store";
import { ContainerRow } from "../ContainerViewComponents/ContainerRow";
import { RunNewModal } from "../ContainerViewComponents/RunNewModal";
import { PullModal } from "../ContainerViewComponents/PullModal";

type FilterTab = "all" | ContainerStatus;

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "stopped", label: "Stopped" },
  { id: "paused", label: "Paused" },
  { id: "exited", label: "Exited" },
];

const SORT_OPTIONS: { key: ContainerSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "cpu", label: "CPU" },
  { key: "memory", label: "Memory" },
  { key: "created", label: "Created" },
  { key: "uptime", label: "Uptime" },
];

const GROUP_OPTIONS: { key: ContainerGroupKey; label: string; desc: string }[] =
  [
    {
      key: "none",
      label: "No grouping",
      desc: "Show all containers in a flat list",
    },
    {
      key: "status",
      label: "By status",
      desc: "Group by running, paused, stopped…",
    },
    {
      key: "image",
      label: "By image",
      desc: "Group containers sharing the same image",
    },
    { key: "created", label: "By date", desc: "Group by creation date" },
  ];

function sortContainers(
  list: Container[],
  key: ContainerSortKey,
  dir: "asc" | "desc",
) {
  const STATUS_ORDER: Record<ContainerStatus, number> = {
    running: 0,
    paused: 1,
    stopped: 2,
    exited: 3,
  };
  return [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "status":
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
      case "cpu":
        cmp = a.cpu - b.cpu;
        break;
      case "memory":
        cmp = parseInt(a.memory) - parseInt(b.memory);
        break;
      case "created":
        cmp = a.created.localeCompare(b.created);
        break;
      case "uptime":
        cmp = a.uptime.localeCompare(b.uptime);
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function groupContainers(list: Container[], key: ContainerGroupKey) {
  if (key === "none") return [{ label: "", items: list }];
  const map = new Map<string, Container[]>();
  list.forEach((c) => {
    const label =
      key === "status"
        ? c.status.charAt(0).toUpperCase() + c.status.slice(1)
        : key === "image"
          ? c.image.split(":")[0]
          : key === "created"
            ? c.created
            : "";
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(c);
  });
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

// ─── MAIN VIEW ────────────────────────────────────────────────────────────────

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
    removeContainer,
    updateContainerStatus,
    addContainer,
  } = useContainerStore();
  const { searchQuery } = useAppStore();

  const [showRunModal, setShowRunModal] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSortMenu(false);
      if (groupRef.current && !groupRef.current.contains(e.target as Node))
        setShowGroupMenu(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = containers.filter((c) => {
    const matchFilter = filter === "all" || c.status === filter;
    const matchSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.image.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const sorted = sortContainers(filtered, sortKey, sortDir);
  const groups = groupContainers(sorted, groupKey);
  const running = containers.filter((c) => c.status === "running").length;

  const activeSortLabel =
    SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? "";
  const activeGroupLabel =
    GROUP_OPTIONS.find((g) => g.key === groupKey)?.label ?? "";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Containers
        </h1>
        <p
          className="text-xs font-mono mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {containers.length} total · {running} running ·{" "}
          {containers.filter((c) => c.status === "paused").length} paused ·{" "}
          {containers.filter((c) => c.status === "stopped").length} stopped
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 shrink-0">
        <button
          className="toolbar-btn-primary shrink-0"
          onClick={() => setShowRunModal(true)}
        >
          <Plus className="w-4 h-4 mr-1.5 inline" /> Run new
        </button>
        <button
          className="toolbar-btn shrink-0"
          onClick={() => setShowPullModal(true)}
        >
          <Download className="w-4 h-4 mr-1.5 inline" /> Pull image
        </button>
        <button className="toolbar-btn shrink-0">
          <RefreshCw className="w-4 h-4 mr-1.5 inline" /> Refresh
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

        <div className="ml-auto flex gap-1.5 ">
          {/* ── Group dropdown ── */}
          <div ref={groupRef} className="relative">
            <button
              className="toolbar-btn flex items-center gap-1.5"
              style={
                groupKey !== "none"
                  ? {
                      color: "var(--accent)",
                      borderColor: "rgba(0,212,255,0.3)",
                      background: "var(--accent-dim)",
                    }
                  : {}
              }
              onClick={() => {
                setShowGroupMenu((v) => !v);
                setShowSortMenu(false);
              }}
            >
              <Grid className="w-4 h-4" /> Group
              {groupKey !== "none" && (
                <span
                  className="text-[9px] px-1 py-px rounded font-mono"
                  style={{
                    background: "rgba(0,212,255,0.2)",
                    color: "var(--accent)",
                  }}
                >
                  {activeGroupLabel}
                </span>
              )}
            </button>
            {showGroupMenu && (
              <Dropdown right>
                <DropdownHeader>Group by</DropdownHeader>
                {GROUP_OPTIONS.map((opt) => (
                  <DropdownCheckItem
                    key={opt.key}
                    label={opt.label}
                    sub={opt.desc}
                    checked={groupKey === opt.key}
                    onClick={() => {
                      setGroupKey(opt.key);
                      setShowGroupMenu(false);
                    }}
                  />
                ))}
              </Dropdown>
            )}
          </div>

          {/* ── Sort dropdown ── */}
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
              onClick={() => {
                setShowSortMenu((v) => !v);
                setShowGroupMenu(false);
              }}
            >
              <span style={{ color: "var(--accent)" }}>
                {sortDir === "asc" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
              </span>{" "}
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
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        <table
          className="w-full"
          style={{ borderCollapse: "separate", borderSpacing: "0 3px" }}
        >
          <thead>
            <tr>
              {[
                {
                  label: "Name / Image",
                  key: "name" as ContainerSortKey,
                  w: "28%",
                },
                {
                  label: "Status",
                  key: "status" as ContainerSortKey,
                  w: "10%",
                },
                { label: "Ports", key: null, w: "13%" },
                { label: "CPU", key: "cpu" as ContainerSortKey, w: "8%" },
                { label: "Memory", key: "memory" as ContainerSortKey, w: "9%" },
                { label: "ID", key: null, w: "10%" },
                {
                  label: "Uptime",
                  key: "uptime" as ContainerSortKey,
                  w: "10%",
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
                    fontFamily: "var(--font-mono, monospace)",
                    padding: "6px 12px",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                    color:
                      sortKey === h.key ? "var(--accent)" : "var(--text-muted)",
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
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group, gi) => (
              <>
                {/* Group header */}
                {groupKey !== "none" && (
                  <tr key={`grp-${gi}`}>
                    <td
                      colSpan={8}
                      style={{
                        padding: "12px 12px 4px",
                        background: "transparent",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 600,
                            fontFamily: "monospace",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: "var(--text-muted)",
                          }}
                        >
                          {group.label}
                        </span>
                        <span
                          style={{
                            fontSize: "9px",
                            fontFamily: "monospace",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: "var(--bg3)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {group.items.length}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: "1px",
                            background: "var(--border)",
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                )}
                {group.items.map((c) => (
                  <ContainerRow
                    key={c.id}
                    container={c}
                    selected={selectedId === c.id}
                    onSelect={() => selectContainer(c.id)}
                    onRemove={() => removeContainer(c.id)}
                    onToggle={() =>
                      updateContainerStatus(
                        c.id,
                        c.status === "running" ? "stopped" : "running",
                      )
                    }
                  />
                ))}
              </>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-12 text-sm font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  No containers match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showRunModal && (
        <RunNewModal
          onClose={() => setShowRunModal(false)}
          onRun={addContainer}
        />
      )}
      {showPullModal && <PullModal onClose={() => setShowPullModal(false)} />}
    </div>
  );
}
