import { useEffect, useRef, useState } from "react";
import {
  BuildRecord,
  BuildStatus,
  useAppStore,
  useBuildStore,
} from "../../store";
import { BuildFilter, BuildSortKey } from "../../store/buildStore";
import { Dropdown, DropdownCheckItem, DropdownHeader } from "../DropDown";
import { BuildRow } from "../BuildsViewComponents/BuildsRow";
import { StatsBar } from "../BuildsViewComponents/StatsBar";
import { ArrowDown, ArrowUp, Plus, RefreshCcw, X } from "lucide-react";

function sortBuilds(
  list: BuildRecord[],
  key: BuildSortKey,
  dir: "asc" | "desc",
) {
  const STATUS_ORDER: Record<BuildStatus, number> = {
    building: 0,
    failed: 1,
    success: 2,
    cached: 3,
    cancelled: 4,
  };
  return [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "image":
        cmp = a.image.localeCompare(b.image);
        break;
      case "status":
        cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
      case "duration":
        cmp = a.durationMs - b.durationMs;
        break;
      case "started":
        cmp = a.startedAt.localeCompare(b.startedAt);
        break;
      case "size":
        cmp = a.sizeBytes - b.sizeBytes;
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

const SORT_OPTIONS: { key: BuildSortKey; label: string }[] = [
  { key: "started", label: "Started" },
  { key: "image", label: "Image" },
  { key: "status", label: "Status" },
  { key: "duration", label: "Duration" },
  { key: "size", label: "Size" },
];

const FILTER_TABS: { id: BuildFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "success", label: "Success" },
  { id: "failed", label: "Failed" },
  { id: "building", label: "Building" },
];

export default function BuildsView() {
  const {
    builds,
    selectedId,
    filter,
    sortKey,
    sortDir,
    selectBuild,
    setFilter,
    setSort,
    clearBuild,
    clearAll,
    addBuild,
    rebuildBuild,
    cancelBuild,
  } = useBuildStore();
  const { searchQuery } = useAppStore();

  const [showNewBuildModal, setShowNewBuildModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSortMenu(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = builds.filter((b) => {
    const matchFilter = filter === "all" || b.status === filter;
    const matchSearch =
      !searchQuery ||
      b.image.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.shortId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.dockerfile.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const sorted = sortBuilds(filtered, sortKey, sortDir);
  const selected = builds.find((b) => b.id === selectedId) ?? null;
  const building = builds.filter((b) => b.status === "building").length;
  const failed = builds.filter((b) => b.status === "failed").length;
  const finished = builds.filter((b) => b.status !== "building");
  const successPct =
    finished.length > 0
      ? Math.round(
          (builds.filter((b) => b.status === "success").length /
            finished.length) *
            100,
        )
      : 0;

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
          Builds
        </h1>
        <p
          className="text-xs font-mono mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {builds.length} total ·{" "}
          {building > 0 && (
            <>
              <span style={{ color: "var(--accent)" }}>
                {building} building
              </span>{" "}
              ·{" "}
            </>
          )}
          {failed > 0 && (
            <>
              <span style={{ color: "var(--red)" }}>{failed} failed</span>{" "}
              ·{" "}
            </>
          )}
          <span style={{ color: "var(--green)" }}>
            {successPct}% success rate
          </span>
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 shrink-0">
        <button
          className="toolbar-btn-primary"
          onClick={() => setShowNewBuildModal(true)}
        >
          <Plus className="w-4 h-4" /> New build
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
          {builds.length > 0 && !confirmClearAll && (
            <button
              className="toolbar-btn"
              style={{
                color: "var(--amber)",
                borderColor: "rgba(255,171,64,0.3)",
              }}
              onClick={() => setConfirmClearAll(true)}
            >
              <X className="w-4 h-4" /> Clear history
            </button>
          )}
          {confirmClearAll && (
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-mono"
                style={{ color: "var(--amber)" }}
              >
                Clear all {builds.length} builds?
              </span>
              <button
                className="toolbar-btn"
                style={{
                  color: "var(--red)",
                  borderColor: "rgba(255,82,82,0.3)",
                  background: "var(--red-dim)",
                }}
                onClick={() => {
                  clearAll();
                  setConfirmClearAll(false);
                }}
              >
                Confirm
              </button>
              <button
                className="toolbar-btn"
                onClick={() => setConfirmClearAll(false)}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Sort dropdown */}
          <div ref={sortRef} className="relative">
            <button
              className="toolbar-btn flex items-center gap-1.5"
              style={
                sortKey !== "started"
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
              {sortKey !== "started" && (
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

      {/* Stats bar */}
      <StatsBar builds={builds} />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Build list */}
        <div
          className={`flex flex-col overflow-hidden transition-all duration-200 ${selected ? "flex-[1.4]" : "flex-1"}`}
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
                      label: "Image / Target",
                      key: "image" as BuildSortKey,
                      w: "22%",
                    },
                    {
                      label: "Status",
                      key: "status" as BuildSortKey,
                      w: "11%",
                    },
                    { label: "Trigger", key: null, w: "10%" },
                    { label: "Steps", key: null, w: "12%" },
                    {
                      label: "Duration",
                      key: "duration" as BuildSortKey,
                      w: "10%",
                    },
                    { label: "Size", key: "size" as BuildSortKey, w: "8%" },
                    {
                      label: "Started",
                      key: "started" as BuildSortKey,
                      w: "14%",
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
                {sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-12 text-sm font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No builds match the current filter.
                    </td>
                  </tr>
                ) : (
                  sorted.map((build) => (
                    <BuildRow
                      key={build.id}
                      build={build}
                      selected={selectedId === build.id}
                      onSelect={() =>
                        selectBuild(selectedId === build.id ? null : build.id)
                      }
                      onClear={() => clearBuild(build.id)}
                      onRebuild={() => rebuildBuild(build.id)}
                      onCancel={() => cancelBuild(build.id)}
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
            build={selected}
            onClose={() => selectBuild(null)}
            onClear={() => {
              clearBuild(selected.id);
              selectBuild(null);
            }}
            onRebuild={() => rebuildBuild(selected.id)}
            onCancel={() => cancelBuild(selected.id)}
          />
        )}
      </div>

      {/* Modals */}
      {showNewBuildModal && (
        <NewBuildModal
          onClose={() => setShowNewBuildModal(false)}
          onBuild={(build) => {
            addBuild(build);
            setShowNewBuildModal(false);
          }}
          totalBuilds={builds.length}
        />
      )}
    </div>
  );
}
