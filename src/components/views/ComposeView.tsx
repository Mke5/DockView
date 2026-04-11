import { useEffect, useRef, useState } from "react";
import {
  ComposeStack,
  ComposeStackStatus,
  useAppStore,
  useComposeStore,
} from "../../store";
import { ComposeFilter, ComposeSortKey } from "../../store/composeStore";
import { Dropdown, DropdownCheckItem, DropdownHeader } from "../DropDown";
import {
  ArrowDown,
  ArrowUp,
  FolderOpen,
  Layers,
  Plus,
  RefreshCcw,
} from "lucide-react";
import { StackCard } from "../ComposeViewComponents/StackCard";
import { DetailPanel } from "../ComposeViewComponents/DetailPanel";
import {
  NewStackModal,
  OpenFileModal,
  PullLatestModal,
} from "../ComposeViewComponents/Modal";

// config

function sortStacks(
  list: ComposeStack[],
  key: ComposeSortKey,
  dir: "asc" | "desc",
) {
  const STATUS_ORDER: Record<ComposeStackStatus, number> = {
    running: 0,
    partial: 1,
    stopped: 2,
    degraded: 3,
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
      case "services":
        cmp = a.services.length - b.services.length;
        break;
      case "created":
        cmp = a.created.localeCompare(b.created);
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

const SORT_OPTIONS: { key: ComposeSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "services", label: "Services" },
  { key: "created", label: "Created" },
];

const FILTER_TABS: { id: ComposeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "running", label: "Running" },
  { id: "partial", label: "Partial" },
  { id: "stopped", label: "Stopped" },
];

export default function ComposeView() {
  const {
    stacks,
    selectedId,
    expandedIds,
    filter,
    sortKey,
    sortDir,
    selectStack,
    toggleExpanded,
    setFilter,
    setSort,
    removeStack,
    addStack,
    updateStackStatus,
    updateServiceStatus,
    restartStack,
    pullLatest,
  } = useComposeStore();
  const { searchQuery } = useAppStore();

  const [showNewStackModal, setShowNewStackModal] = useState(false);
  const [showOpenFileModal, setShowOpenFileModal] = useState(false);
  const [showPullModal, setShowPullModal] = useState<ComposeStack | null>(null);
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

  const filtered = stacks.filter((s) => {
    const matchFilter = filter === "all" || s.status === filter;
    const matchSearch =
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.configPath.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const sorted = sortStacks(filtered, sortKey, sortDir);
  const selected = stacks.find((s) => s.id === selectedId) ?? null;
  const totalRunning = stacks.filter((s) => s.status === "running").length;
  const totalPartial = stacks.filter((s) => s.status === "partial").length;
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
          Compose
        </h1>
        <p
          className="text-xs font-mono mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {stacks.length} stacks ·{" "}
          <span style={{ color: "var(--green)" }}>{totalRunning} running</span>
          {totalPartial > 0 && (
            <>
              {" "}
              ·{" "}
              <span style={{ color: "var(--amber)" }}>
                {totalPartial} partial
              </span>
            </>
          )}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 shrink-0">
        <button
          className="toolbar-btn-primary"
          onClick={() => setShowNewStackModal(true)}
        >
          <Plus className="w-4 h-4" /> New stack
        </button>
        <button
          className="toolbar-btn"
          onClick={() => setShowOpenFileModal(true)}
        >
          <FolderOpen className="w-4 h-4" /> Open file
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

        <div className="ml-auto flex gap-1.5">
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
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
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

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Stack list */}
        <div
          className={`flex flex-col overflow-hidden transition-all duration-200 ${selected ? "flex-[1.4]" : "flex-1"}`}
        >
          <div className="flex-1 overflow-y-auto px-6 pb-4 flex flex-col gap-2">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <p
                  className="text-sm font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  No stacks match the current filter
                </p>
                <button
                  className="toolbar-btn-primary px-4"
                  onClick={() => setShowNewStackModal(true)}
                >
                  <Plus className="w-4 h-4" /> New stack
                </button>
              </div>
            ) : (
              sorted.map((stack) => (
                <StackCard
                  key={stack.id}
                  stack={stack}
                  expanded={expandedIds.includes(stack.id)}
                  selected={selectedId === stack.id}
                  onToggleExpand={() => toggleExpanded(stack.id)}
                  onSelect={() =>
                    selectStack(selectedId === stack.id ? null : stack.id)
                  }
                  onRemove={() => removeStack(stack.id)}
                  onStart={() => updateStackStatus(stack.id, "running")}
                  onStop={() => updateStackStatus(stack.id, "stopped")}
                  onRestart={() => restartStack(stack.id)}
                  onPull={() => setShowPullModal(stack)}
                  onServiceToggle={(svc) =>
                    updateServiceStatus(
                      stack.id,
                      svc.name,
                      svc.status === "running" ? "stopped" : "running",
                    )
                  }
                />
              ))
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <DetailPanel
            stack={selected}
            onClose={() => selectStack(null)}
            onRemove={() => {
              removeStack(selected.id);
              selectStack(null);
            }}
            onStart={() => updateStackStatus(selected.id, "running")}
            onStop={() => updateStackStatus(selected.id, "stopped")}
            onRestart={() => restartStack(selected.id)}
            onPull={() => setShowPullModal(selected)}
            onServiceToggle={(svc) =>
              updateServiceStatus(
                selected.id,
                svc.name,
                svc.status === "running" ? "stopped" : "running",
              )
            }
          />
        )}
      </div>

      {/* Modals */}
      {showNewStackModal && (
        <NewStackModal
          onClose={() => setShowNewStackModal(false)}
          onAdd={addStack}
        />
      )}
      {showOpenFileModal && (
        <OpenFileModal
          onClose={() => setShowOpenFileModal(false)}
          onAdd={addStack}
        />
      )}
      {showPullModal && (
        <PullLatestModal
          stack={showPullModal}
          onClose={() => setShowPullModal(null)}
          onPull={() => {
            pullLatest(showPullModal.id);
            setShowPullModal(null);
          }}
        />
      )}
    </div>
  );
}
