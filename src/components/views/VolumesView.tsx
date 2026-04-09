import { useEffect, useRef, useState } from "react";
import { useAppStore, Volume } from "../../store";
import { useVolumeStore, VolumeFilter } from "../../store/volumeStore";

const FILTER_TABS: { id: VolumeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in-use", label: "In use" },
  { id: "unused", label: "Unused" },
];

const SORT_OPTIONS: { key: VolumeSortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "size", label: "Size" },
  { key: "created", label: "Created" },
  { key: "driver", label: "Driver" },
];

export default function VolumesView() {
  const {
    volumes,
    selectedName,
    filter,
    sortKey,
    sortDir,
    selectVolume,
    setFilter,
    setSort,
    removeVolume,
    pruneUnused,
    addVolume,
  } = useVolumeStore();
  const { searchQuery } = useAppStore();

  const [confirmPrune, setConfirmPrune] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBrowseModal, setShowBrowseModal] = useState<Volume | null>(null);
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

  const filtered = volumes.filter((v) => {
    const matchFilter =
      filter === "all" ||
      (filter === "in-use" && v.inUse) ||
      (filter === "unused" && !v.inUse);
    const matchSearch =
      !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.driver.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const sorted = sortVolumes(filtered, sortKey, sortDir);
  const selected = volumes.find((v) => v.name === selectedName) ?? null;
  const unusedCount = volumes.filter((v) => !v.inUse).length;
  const unusedSize = totalSize(volumes.filter((v) => !v.inUse));
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
          Volumes
        </h1>
        <p
          className="text-xs font-mono mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {volumes.length} volumes · {totalSize(volumes)} total ·{" "}
          <span
            style={{
              color: unusedCount > 0 ? "var(--amber)" : "var(--text-muted)",
            }}
          >
            {unusedCount} unused ({unusedSize} reclaimable)
          </span>
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-6 py-3 shrink-0">
        <button
          className="toolbar-btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          ＋ Create volume
        </button>
        <button className="toolbar-btn">⟳ Refresh</button>

        <div
          className="w-px h-5 mx-1"
          style={{ background: "var(--border)" }}
        />

        <div className="flex gap-0.5">
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
          {/* Prune */}
          {unusedCount > 0 && !confirmPrune && (
            <button
              className="toolbar-btn"
              style={{
                color: "var(--amber)",
                borderColor: "rgba(255,171,64,0.3)",
              }}
              onClick={() => setConfirmPrune(true)}
            >
              ✦ Prune unused ({unusedCount})
            </button>
          )}
          {confirmPrune && (
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-mono"
                style={{ color: "var(--amber)" }}
              >
                Remove {unusedCount} volumes?
              </span>
              <button
                className="toolbar-btn"
                style={{
                  color: "var(--red)",
                  borderColor: "rgba(255,82,82,0.3)",
                  background: "var(--red-dim)",
                }}
                onClick={() => {
                  pruneUnused();
                  setConfirmPrune(false);
                }}
              >
                Confirm
              </button>
              <button
                className="toolbar-btn"
                onClick={() => setConfirmPrune(false)}
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
              {sortDir === "asc" ? "↑" : "↓"} Sort
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
                      sortKey === opt.key
                        ? sortDir === "asc"
                          ? "↑ asc"
                          : "↓ desc"
                        : undefined
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
                    { label: "Name", key: "name" as VolumeSortKey, w: "22%" },
                    {
                      label: "Driver",
                      key: "driver" as VolumeSortKey,
                      w: "9%",
                    },
                    { label: "Mount point", key: null, w: "30%" },
                    { label: "Size", key: "size" as VolumeSortKey, w: "10%" },
                    {
                      label: "Created",
                      key: "created" as VolumeSortKey,
                      w: "10%",
                    },
                    { label: "Status", key: null, w: "10%" },
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
                            {sortDir === "asc" ? "↑" : "↓"}
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
                      colSpan={7}
                      className="text-center py-12 text-sm font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No volumes match the current filter.
                    </td>
                  </tr>
                ) : (
                  sorted.map((vol) => (
                    <VolumeRow
                      key={vol.name}
                      volume={vol}
                      selected={selectedName === vol.name}
                      onSelect={() =>
                        selectVolume(
                          selectedName === vol.name ? null : vol.name,
                        )
                      }
                      onRemove={() => removeVolume(vol.name)}
                      onBrowse={() => setShowBrowseModal(vol)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <StorageSummary volumes={volumes} />
        </div>

        {/* Detail panel */}
        {selected && (
          <DetailPanel
            volume={selected}
            onClose={() => selectVolume(null)}
            onRemove={() => {
              removeVolume(selected.name);
              selectVolume(null);
            }}
            onBrowse={() => setShowBrowseModal(selected)}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateVolumeModal
          onClose={() => setShowCreateModal(false)}
          onCreate={addVolume}
        />
      )}
      {showBrowseModal && (
        <BrowseModal
          volume={showBrowseModal}
          onClose={() => setShowBrowseModal(null)}
        />
      )}
    </div>
  );
}
