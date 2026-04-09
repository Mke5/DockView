import { useEffect, useRef, useState } from "react";
import { DockerImage, useAppStore, useImageStore } from "../../store";
import { ImageSortKey } from "../../store/imageStore";
import {
  ArrowDown,
  ArrowUp,
  Download,
  RefreshCw,
  Scissors,
  Upload,
} from "lucide-react";
import { Dropdown, DropdownCheckItem, DropdownHeader } from "../DropDown";
import { ImageRow } from "../ImageViewComponents/ImageRow";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

type ImageFilter = "all" | "in-use" | "unused";

function sortImages(
  list: DockerImage[],
  key: ImageSortKey,
  dir: "asc" | "desc",
) {
  return [...list].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case "repository":
        cmp = a.repository.localeCompare(b.repository);
        break;
      case "tag":
        cmp = a.tag.localeCompare(b.tag);
        break;
      case "size":
        cmp = a.sizeBytes - b.sizeBytes;
        break;
      case "created":
        cmp = a.created.localeCompare(b.created);
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function totalSize(images: DockerImage[]) {
  const bytes = images.reduce((a, i) => a + i.sizeBytes, 0);
  return bytes >= 1e9
    ? `${(bytes / 1e9).toFixed(1)} GB`
    : `${(bytes / 1e6).toFixed(0)} MB`;
}

const SORT_OPTIONS: { key: ImageSortKey; label: string }[] = [
  { key: "repository", label: "Repository" },
  { key: "tag", label: "Tag" },
  { key: "size", label: "Size" },
  { key: "created", label: "Created" },
];

const FILTER_TABS: { id: ImageFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in-use", label: "In use" },
  { id: "unused", label: "Unused" },
];

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
    removeImage,
    pruneUnused,
    addImage,
  } = useImageStore();

  const { searchQuery } = useAppStore();

  const [confirmPrune, setConfirmPrune] = useState(false);
  const [showPullModal, setShowPullModal] = useState(false);
  const [showPushModal, setShowPushModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState<DockerImage | null>(null);
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

  const filtered = images.filter((img) => {
    const matchFilter =
      filter === "all" ||
      (filter === "in-use" && img.inUse) ||
      (filter === "unused" && !img.inUse);
    const matchSearch =
      !searchQuery ||
      img.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.shortId.includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const sorted = sortImages(filtered, sortKey, sortDir);
  const selected = images.find((i) => i.id === selectedId) ?? null;
  const unusedCount = images.filter((i) => !i.inUse).length;
  const unusedSize = totalSize(images.filter((i) => !i.inUse));
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
          Images
        </h1>
        <p
          className="text-xs font-mono mt-0.5"
          style={{ color: "var(--text-muted)" }}
        >
          {images.length} images · {totalSize(images)} total ·{" "}
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
          onClick={() => setShowPullModal(true)}
        >
          <Download className="w-4 h-4 mr-1.5 inline" /> Pull image
        </button>
        <button className="toolbar-btn" onClick={() => setShowPushModal(true)}>
          <Upload className="w-4 h-4 mr-1.5 inline" /> Push
        </button>
        <button className="toolbar-btn">
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
              <Scissors className="w-4 h-4 mr-1.5 inline" /> Prune unused (
              {unusedCount})
            </button>
          )}
          {confirmPrune && (
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-mono"
                style={{ color: "var(--amber)" }}
              >
                Remove {unusedCount} images?
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
                sortKey !== "repository"
                  ? {
                      color: "var(--accent)",
                      borderColor: "rgba(0,212,255,0.3)",
                      background: "var(--accent-dim)",
                    }
                  : {}
              }
              onClick={() => setShowSortMenu((v) => !v)}
            >
              <span style={{ color: "var(--accent)" }}>
                {sortDir === "asc" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
              </span>{" "}
              Sort
              {sortKey !== "repository" && (
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

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Table */}
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
                      label: "Repository",
                      key: "repository" as ImageSortKey,
                      w: "26%",
                    },
                    { label: "Tag", key: "tag" as ImageSortKey, w: "12%" },
                    { label: "Image ID", key: null, w: "13%" },
                    { label: "Size", key: "size" as ImageSortKey, w: "10%" },
                    {
                      label: "Created",
                      key: "created" as ImageSortKey,
                      w: "13%",
                    },
                    { label: "Status", key: null, w: "11%" },
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
                      colSpan={7}
                      className="text-center py-12 text-sm font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No images match the current filter.
                    </td>
                  </tr>
                ) : (
                  sorted.map((img) => (
                    <ImageRow
                      key={img.id}
                      image={img}
                      selected={selectedId === img.id}
                      onSelect={() =>
                        selectImage(selectedId === img.id ? null : img.id)
                      }
                      onRemove={() => removeImage(img.id)}
                      onRun={() => setShowRunModal(img)}
                      onPush={() => setShowPushModal(true)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
