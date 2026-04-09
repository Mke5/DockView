import { useState } from "react";
import { Volume } from "../../store";
import { Modal, ModalField, ModalInput } from "../Modal";
import { Database } from "lucide-react";

const DRIVER_OPTIONS = ["local", "nfs", "tmpfs", "overlay2", "custom"];

// ─── CREATE VOLUME MODAL ──────────────────────────────────────────────────────

export function CreateVolumeModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (v: Volume) => void;
}) {
  const [name, setName] = useState("");
  const [driver, setDriver] = useState("local");
  const [driverOpts, setDriverOpts] = useState("");
  const [labelKey, setLabelKey] = useState("");
  const [labelVal, setLabelVal] = useState("");
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  function addLabel() {
    if (!labelKey.trim()) return;
    setLabels((prev) => ({ ...prev, [labelKey.trim()]: labelVal.trim() }));
    setLabelKey("");
    setLabelVal("");
  }

  function removeLabel(key: string) {
    setLabels((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }

  function handleCreate() {
    if (!name.trim()) {
      setError("Volume name is required.");
      return;
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name.trim())) {
      setError(
        "Name must start with a letter or number and contain only letters, numbers, _, ., or -",
      );
      return;
    }
    onCreate({
      name: name.trim(),
      driver,
      mountpoint: `/var/lib/docker/volumes/${name.trim()}/_data`,
      size: "0 B",
      sizeBytes: 0,
      inUse: false,
      containers: [],
      created: new Date().toISOString().slice(0, 10),
      scope: "local",
      labels,
    });
    onClose();
  }

  // Build cli preview
  const cliPreview = [
    "docker volume create",
    `--driver ${driver}`,
    ...Object.entries(labels).map(([k, v]) => `--label ${k}=${v}`),
    ...driverOpts
      .split(",")
      .filter(Boolean)
      .map((o) => `--opt ${o.trim()}`),
    name.trim() || "<name>",
  ].join(" ");

  return (
    <Modal title="Create a volume" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <ModalField
          label="Volume name *"
          description="Unique name for the volume (letters, numbers, _, ., -)"
        >
          <ModalInput
            value={name}
            onChange={(v) => {
              setName(v);
              setError("");
            }}
            placeholder="my_volume"
            mono
            autoFocus
            error={!!error}
          />
          {error && (
            <p
              className="text-[10px] font-mono mt-1"
              style={{ color: "var(--red)" }}
            >
              {error}
            </p>
          )}
        </ModalField>

        <ModalField label="Driver" description="Volume driver to use">
          <div className="flex gap-1.5 flex-wrap">
            {DRIVER_OPTIONS.map((d) => (
              <button
                key={d}
                className="px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer border transition-all"
                style={{
                  background: driver === d ? "var(--accent-dim)" : "var(--bg3)",
                  borderColor:
                    driver === d ? "rgba(0,212,255,0.3)" : "var(--border)",
                  color: driver === d ? "var(--accent)" : "var(--text-muted)",
                }}
                onClick={() => setDriver(d)}
              >
                {d}
              </button>
            ))}
          </div>
        </ModalField>

        <ModalField
          label="Driver options"
          description="Comma-separated key=value options passed to the driver"
        >
          <ModalInput
            value={driverOpts}
            onChange={setDriverOpts}
            placeholder="type=nfs,device=/exports/data"
            mono
          />
        </ModalField>

        {/* Labels */}
        <ModalField
          label="Labels"
          description="Key-value metadata attached to the volume"
        >
          <div className="flex gap-2 mb-2">
            <ModalInput
              value={labelKey}
              onChange={setLabelKey}
              placeholder="com.example.key"
              mono
              style={{ flex: 1 }}
            />
            <span
              className="self-center text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              =
            </span>
            <ModalInput
              value={labelVal}
              onChange={setLabelVal}
              placeholder="value"
              mono
              style={{ flex: 1 }}
            />
            <button
              className="px-2.5 py-1.5 rounded text-[10px] font-mono cursor-pointer border transition-all shrink-0"
              style={{
                background: "var(--bg3)",
                borderColor: "var(--border)",
                color: "var(--text-secondary)",
              }}
              onClick={addLabel}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent)";
                e.currentTarget.style.color = "var(--accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              ＋ Add
            </button>
          </div>
          {Object.keys(labels).length > 0 && (
            <div className="flex flex-col gap-1">
              {Object.entries(labels).map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span style={{ color: "var(--accent)" }}>{k}</span> = {v}
                  </span>
                  <button
                    className="text-[10px] cursor-pointer border-none bg-transparent ml-2"
                    style={{ color: "var(--text-muted)" }}
                    onClick={() => removeLabel(k)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--red)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </ModalField>

        {/* CLI preview */}
        <div
          className="px-3 py-2.5 rounded"
          style={{
            background: "var(--bg0)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[9px] font-mono uppercase tracking-wider mb-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            Command preview
          </p>
          <p
            className="text-[10px] font-mono leading-relaxed break-all"
            style={{ color: "var(--text-secondary)" }}
          >
            <span style={{ color: "var(--accent)" }}>$ </span>
            {cliPreview}
          </p>
        </div>
      </div>

      <div
        className="flex justify-end gap-2 mt-5 pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button className="toolbar-btn px-4" onClick={onClose}>
          Cancel
        </button>
        <button
          className="px-5 py-2 rounded text-[11px] font-semibold cursor-pointer transition-all"
          style={{
            background: "var(--accent)",
            color: "#000",
            border: "1px solid var(--accent)",
          }}
          onClick={handleCreate}
        >
          ◈ Create volume
        </button>
      </div>
    </Modal>
  );
}

// ─── BROWSE MODAL ─────────────────────────────────────────────────────────────
function buildMockFs(volumeName: string): FileNode[] {
  const bases: Record<string, FileNode[]> = {
    postgres_data: [
      { name: "PG_VERSION", type: "file", size: "3 B", modified: "2026-03-15" },
      {
        name: "base",
        type: "dir",
        size: "—",
        modified: "2026-03-18",
        children: [
          { name: "1", type: "dir", size: "7.8 MB", modified: "2026-03-15" },
          {
            name: "16384",
            type: "dir",
            size: "820 MB",
            modified: "2026-03-18",
          },
        ],
      },
      { name: "global", type: "dir", size: "128 KB", modified: "2026-03-15" },
      {
        name: "pg_hba.conf",
        type: "file",
        size: "4.9 KB",
        modified: "2026-03-15",
      },
      {
        name: "postgresql.conf",
        type: "file",
        size: "27 KB",
        modified: "2026-03-15",
      },
      {
        name: "postmaster.pid",
        type: "file",
        size: "86 B",
        modified: "2026-03-18",
      },
    ],
    redis_data: [
      { name: "dump.rdb", type: "file", size: "12 MB", modified: "2026-03-18" },
      { name: "aof.log", type: "file", size: "220 KB", modified: "2026-03-18" },
    ],
    app_uploads: [
      {
        name: "images",
        type: "dir",
        size: "—",
        modified: "2026-03-16",
        children: [
          {
            name: "avatar_001.png",
            type: "file",
            size: "48 KB",
            modified: "2026-03-16",
          },
          {
            name: "avatar_002.jpg",
            type: "file",
            size: "62 KB",
            modified: "2026-03-17",
          },
        ],
      },
      { name: "documents", type: "dir", size: "—", modified: "2026-03-17" },
      { name: "tmp", type: "dir", size: "—", modified: "2026-03-18" },
    ],
  };
  return (
    bases[volumeName] ?? [
      { name: "data", type: "dir", size: "—", modified: "2026-03-15" },
    ]
  );
}

interface FileNode {
  name: string;
  type: "file" | "dir";
  size: string;
  modified: string;
  children?: FileNode[];
}

export function BrowseModal({
  volume,
  onClose,
}: {
  volume: Volume;
  onClose: () => void;
}) {
  const [path, setPath] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const rootNodes = buildMockFs(volume.name);

  function getNodes(nodes: FileNode[], pathParts: string[]): FileNode[] {
    if (pathParts.length === 0) return nodes;
    const next = nodes.find((n) => n.name === pathParts[0]);
    if (!next || next.type !== "dir") return [];
    return getNodes(next.children ?? [], pathParts.slice(1));
  }

  const currentNodes = getNodes(rootNodes, path);
  const currentPath = "/" + path.join("/");

  return (
    <Modal title={`Browse: ${volume.name}`} onClose={onClose} wide>
      <div className="flex flex-col gap-3">
        {/* Path breadcrumb */}
        <div
          className="flex items-center gap-1 px-3 py-2 rounded font-mono text-[10px] overflow-x-auto"
          style={{
            background: "var(--bg0)",
            border: "1px solid var(--border)",
          }}
        >
          <span
            className="cursor-pointer transition-colors shrink-0"
            style={{ color: "var(--accent)" }}
            onClick={() => setPath([])}
          >
            {volume.mountpoint.split("/").slice(0, -1).join("/")}
          </span>
          {path.map((part, i) => (
            <>
              <span key={`sep-${i}`} style={{ color: "var(--text-muted)" }}>
                /
              </span>
              <span
                key={part}
                className="cursor-pointer whitespace-nowrap"
                style={{
                  color:
                    i === path.length - 1
                      ? "var(--text-primary)"
                      : "var(--accent)",
                }}
                onClick={() => setPath(path.slice(0, i + 1))}
              >
                {part}
              </span>
            </>
          ))}
        </div>

        {/* File list */}
        <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto">
          {/* Back row */}
          {path.length > 0 && (
            <div
              className="flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer transition-all"
              style={{ color: "var(--text-muted)" }}
              onClick={() => setPath(path.slice(0, -1))}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg2)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <span className="text-sm">↩</span>
              <span className="text-[11px] font-mono">..</span>
            </div>
          )}

          {currentNodes.length === 0 && (
            <p
              className="text-center py-8 text-[11px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              Empty directory
            </p>
          )}

          {currentNodes.map((node) => (
            <div
              key={node.name}
              className="flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer transition-all group"
              style={{ color: "var(--text-secondary)" }}
              onClick={() => {
                if (node.type === "dir") setPath([...path, node.name]);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg2)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              {/* Icon */}
              <span
                className="text-sm shrink-0 w-5 text-center"
                style={{
                  color:
                    node.type === "dir" ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {node.type === "dir" ? "◈" : "≡"}
              </span>

              {/* Name */}
              <span className="flex-1 text-[11px] font-mono truncate">
                {node.name}
              </span>

              {/* Meta */}
              <span
                className="text-[10px] font-mono shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                {node.size}
              </span>
              <span
                className="text-[10px] font-mono shrink-0 w-24 text-right"
                style={{ color: "var(--text-muted)" }}
              >
                {node.modified}
              </span>

              {/* Type badge */}
              <span
                className="text-[9px] font-mono px-1.5 py-px rounded shrink-0"
                style={{
                  background:
                    node.type === "dir" ? "var(--accent-dim)" : "var(--bg4)",
                  color:
                    node.type === "dir" ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                {node.type}
              </span>
            </div>
          ))}
        </div>

        {/* Status bar */}
        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {currentNodes.length} items · {currentPath}
          </span>
          <span
            className="text-[10px] font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            {volume.size} total
          </span>
        </div>
      </div>

      <div
        className="flex justify-end pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button className="toolbar-btn px-4" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

// ─── STORAGE SUMMARY ─────────────────────────────────────────────────────────

function SummaryItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span
        className="text-[10px] font-mono"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span className="text-[11px] font-semibold font-mono" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export function StorageSummary({ volumes }: { volumes: Volume[] }) {
  const total = volumes.reduce((a, v) => a + v.sizeBytes, 0);
  const inUse = volumes
    .filter((v) => v.inUse)
    .reduce((a, v) => a + v.sizeBytes, 0);
  const unused = total - inUse;
  const usedPct = total > 0 ? (inUse / total) * 100 : 0;
  const fmt = (b: number) =>
    b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(0)} MB`;

  return (
    <div
      className="shrink-0 flex items-center gap-6 px-6 py-3"
      style={{ borderTop: "1px solid var(--border)", background: "var(--bg1)" }}
    >
      <div className="flex items-center gap-2 flex-1">
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--bg4)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${usedPct}%`, background: "var(--accent)" }}
          />
        </div>
      </div>
      <SummaryItem
        label="Total"
        value={fmt(total)}
        color="var(--text-secondary)"
      />
      <SummaryItem label="In use" value={fmt(inUse)} color="var(--accent)" />
      <SummaryItem
        label="Reclaimable"
        value={fmt(unused)}
        color="var(--amber)"
      />
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

export function sizeColor(bytes: number) {
  if (bytes > 500_000_000) return "var(--red)";
  if (bytes > 100_000_000) return "var(--amber)";
  return "var(--green)";
}

export function VolumeIcon({
  inUse,
  sizeBytes,
  size = "sm",
}: {
  inUse: boolean;
  sizeBytes: number;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-9 h-9" : "w-8 h-8";
  const color = sizeColor(sizeBytes);
  const bg = inUse
    ? "rgba(0,212,255,0.1)"
    : sizeBytes > 500_000_000
      ? "var(--red-dim)"
      : "var(--bg3)";
  return (
    <div
      className={`${dim} rounded-lg flex items-center justify-center text-base shrink-0`}
      style={{ background: bg, color: inUse ? "var(--accent)" : color }}
    >
      <Database size={16} />
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p
        className="text-[9px] font-semibold uppercase tracking-widest font-mono mb-2"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}
