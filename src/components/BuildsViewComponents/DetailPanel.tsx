import { useState } from "react";
import { BuildRecord, BuildStatus } from "../../store";
import { CloseBtn } from "../ImageViewComponents/CloseBtn";
import { InfoRow, Section } from "../ImageViewComponents/ImageRow";
import { STEP_STATUS_CFG, TRIGGER_CFG } from "./BuildsRow";
import {
  AlertCircle,
  Check,
  ChevronRight,
  Cog,
  Download,
  Loader,
  RotateCw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

const BUILD_STATUS_CFG: Record<
  BuildStatus,
  { bg: string; color: string; dot: string; label: string; animate: boolean }
> = {
  success: {
    bg: "var(--green-dim)",
    color: "var(--green)",
    dot: "var(--green)",
    label: "Success",
    animate: false,
  },
  failed: {
    bg: "var(--red-dim)",
    color: "var(--red)",
    dot: "var(--red)",
    label: "Failed",
    animate: false,
  },
  building: {
    bg: "var(--accent-dim)",
    color: "var(--accent)",
    dot: "var(--accent)",
    label: "Building",
    animate: true,
  },
  cancelled: {
    bg: "var(--bg4)",
    color: "var(--text-muted)",
    dot: "var(--text-muted)",
    label: "Cancelled",
    animate: false,
  },
  cached: {
    bg: "var(--purple-dim)",
    color: "var(--purple)",
    dot: "var(--purple)",
    label: "Cached",
    animate: false,
  },
};

export function DetailPanel({
  build: b,
  onClose,
  onClear,
  onRebuild,
  onCancel,
}: {
  build: BuildRecord;
  onClose: () => void;
  onClear: () => void;
  onRebuild: () => void;
  onCancel: () => void;
}) {
  const cfg = BUILD_STATUS_CFG[b.status];
  const [activeTab, setActiveTab] = useState<"steps" | "details" | "logs">(
    "steps",
  );

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: "340px",
        borderLeft: "1px solid var(--border)",
        background: "var(--bg1)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 font-bold"
            style={{ background: `${cfg.color}15`, color: cfg.color }}
          >
            {b.status === "building" ? (
              <Cog size={16} />
            ) : b.status === "failed" ? (
              <X size={16} />
            ) : (
              <Check size={16} />
            )}
          </div>
          <div>
            <div
              className="text-xs font-semibold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {b.image}
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {b.shortId} · {b.duration || "in progress"}
            </div>
          </div>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      <div
        className="flex shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {(["steps", "details", "logs"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 text-[11px] font-mono font-medium capitalize cursor-pointer border-none transition-all"
            style={{
              background: "none",
              color: activeTab === tab ? "var(--accent)" : "var(--text-muted)",
              borderBottom:
                activeTab === tab
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "steps" && <StepsTab build={b} />}
        {activeTab === "details" && (
          <DetailsTab
            build={b}
            onClear={onClear}
            onRebuild={onRebuild}
            onCancel={onCancel}
          />
        )}
        {activeTab === "logs" && <LogsTab build={b} />}
      </div>
    </div>
  );
}

// ─── TABS ─────────────────────────────────────────────────────────────────────

function StepsTab({ build: b }: { build: BuildRecord }) {
  const [expandedStep, setExpandedStep] = useState<string | null>(
    b.steps.find((s) => s.status === "error" || s.status === "running")?.id ??
      null,
  );
  return (
    <div className="p-4 flex flex-col gap-2">
      {" "}
      {b.error && (
        <div
          className="flex flex-col gap-2 px-3 py-2.5 rounded text-[10px] font-mono"
          style={{
            background: "var(--red-dim)",
            border: "1px solid rgba(255,82,82,0.25)",
            color: "var(--red)",
          }}
        >
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <AlertCircle size={14} className="shrink-0" />{" "}
            <span className="font-semibold text-[11px]">Build failed</span>{" "}
          </div>{" "}
          <span
            style={{ color: "rgba(255,82,82,0.9)", whiteSpace: "pre-wrap" }}
          >
            {" "}
            {b.error}{" "}
          </span>{" "}
        </div>
      )}
      <div className="relative mt-2">
        {" "}
        {/* Timeline line */}{" "}
        <div
          className="absolute left-[11px] top-3 bottom-0 w-px"
          style={{ background: "var(--border)" }}
        />
        {b.steps.map((step, index) => {
          const scfg = STEP_STATUS_CFG[step.status];
          const isOpen = expandedStep === step.id;
          const hasLog = step.log && step.log.trim().length > 0;
          const isLast = index === b.steps.length - 1;
          return (
            <div key={step.id} className="relative flex flex-col mb-3">
              {" "}
              {/* Step row */}{" "}
              <div
                className="flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer transition-colors"
                onClick={() =>
                  hasLog && setExpandedStep(isOpen ? null : step.id)
                }
                style={{
                  background: isOpen ? "var(--bg2)" : "transparent",
                  cursor: hasLog ? "pointer" : "default",
                }}
                onMouseEnter={(e) => {
                  if (!isOpen && hasLog)
                    e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                }}
                onMouseLeave={(e) => {
                  if (!isOpen) e.currentTarget.style.background = "transparent";
                }}
              >
                {" "}
                {/* Status icon */}{" "}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 font-bold transition-all"
                  style={{
                    background: `${scfg.color}20`,
                    color: scfg.color,
                    border: `1.5px solid ${scfg.color}50`,
                    animation:
                      step.status === "running"
                        ? "pulseGreen 1.5s infinite"
                        : "none",
                  }}
                >
                  {" "}
                  {step.status === "running" ? (
                    <Loader size={14} className="animate-spin" />
                  ) : step.status === "done" || step.status === "cached" ? (
                    <Check size={14} />
                  ) : step.status === "error" ? (
                    <AlertCircle size={14} />
                  ) : (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: scfg.color }}
                    />
                  )}{" "}
                </div>
                {/* Step name */}{" "}
                <div className="flex-1 min-w-0">
                  {" "}
                  <div
                    className="text-[11px] font-mono truncate"
                    style={{
                      color:
                        step.status === "pending"
                          ? "var(--text-muted)"
                          : "var(--text-secondary)",
                      fontWeight: step.status === "error" ? "600" : "normal",
                    }}
                  >
                    {" "}
                    {step.name}{" "}
                  </div>{" "}
                </div>
                {/* Right section: badges and expand icon */}{" "}
                <div className="flex items-center gap-1.5 shrink-0">
                  {" "}
                  {step.status === "cached" && (
                    <span
                      className="text-[9px] font-mono font-medium px-1.5 py-px rounded"
                      style={{
                        background: "var(--purple-dim)",
                        color: "var(--purple)",
                        border: "1px solid rgba(168,85,247,0.2)",
                      }}
                    >
                      {" "}
                      CACHED{" "}
                    </span>
                  )}{" "}
                  {step.duration && (
                    <span
                      className="text-[10px] font-mono whitespace-nowrap"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {" "}
                      {step.duration}{" "}
                    </span>
                  )}{" "}
                  {hasLog && (
                    <ChevronRight
                      size={14}
                      className="transition-transform duration-150 shrink-0"
                      style={{
                        color: "var(--text-muted)",
                        transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                      }}
                    />
                  )}{" "}
                </div>{" "}
              </div>
              {/* Step log output */}{" "}
              {isOpen && hasLog && (
                <div
                  className="ml-7 mt-1.5 mb-1 p-2.5 rounded text-[10px] font-mono leading-relaxed border overflow-y-auto"
                  style={{
                    background: "var(--bg0)",
                    border: "1px solid var(--border)",
                    color:
                      step.status === "error"
                        ? "var(--red)"
                        : "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "150px",
                  }}
                >
                  {" "}
                  {step.log}{" "}
                </div>
              )}{" "}
            </div>
          );
        })}{" "}
      </div>{" "}
    </div>
  );
}

function DetailsTab({
  build: b,
  onClear,
  onRebuild,
  onCancel,
}: {
  build: BuildRecord;
  onClear: () => void;
  onRebuild: () => void;
  onCancel: () => void;
}) {
  const cfg = BUILD_STATUS_CFG[b.status];

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex gap-1.5">
        {b.status === "building" ? (
          <button
            className="toolbar-btn flex-1 justify-center"
            style={{
              color: "var(--amber)",
              borderColor: "rgba(255,171,64,0.3)",
            }}
            onClick={onCancel}
            title="Cancel the currently building image"
          >
            <AlertCircle size={16} /> Cancel
          </button>
        ) : (
          <button
            className="toolbar-btn-primary flex-1 justify-center text-center py-1.5 rounded text-[11px] font-semibold"
            onClick={onRebuild}
            title="Rebuild this image"
          >
            <RotateCw size={16} /> Rebuild
          </button>
        )}
        <button
          className="toolbar-btn flex-1 justify-center"
          title="Push image to registry"
        >
          <UploadCloud size={16} /> Push
        </button>
        <button
          className="toolbar-btn px-2.5"
          style={{ color: "var(--red)", borderColor: "rgba(255,82,82,0.3)" }}
          onClick={onClear}
          title="Delete this build record"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div
        className="flex items-center justify-between p-3 rounded"
        style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: cfg.dot }}
          />
          <span
            className="text-sm font-semibold font-mono"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
        </div>
        <span className="text-xs font-mono" style={{ color: cfg.color }}>
          {b.duration || "running…"}
        </span>
      </div>

      <Section title="Build info">
        <InfoRow label="Image" value={b.image} mono />
        <InfoRow label="Platform" value={b.platform} mono />
        <InfoRow label="Dockerfile" value={b.dockerfile} mono />
        <InfoRow label="Context" value={b.context} mono />
        <InfoRow
          label="Trigger"
          value={TRIGGER_CFG[b.trigger]?.label ?? b.trigger}
        />
        <InfoRow label="Cache used" value={b.cacheUsed ? "Yes" : "No"} />
      </Section>

      <Section title="Timing">
        <InfoRow label="Started" value={b.startedAt} mono />
        <InfoRow label="Finished" value={b.finishedAt || "—"} mono />
        <InfoRow label="Duration" value={b.duration || "running"} mono />
      </Section>

      {b.tags.length > 0 && (
        <Section title="Tags">
          <div className="flex flex-wrap gap-1">
            {b.tags.map((t) => (
              <span
                key={t}
                className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border-lit)",
                  color: "var(--text-secondary)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </Section>
      )}

      {b.size !== "—" && (
        <Section title="Output image">
          <InfoRow label="Size" value={b.size} mono />
        </Section>
      )}
    </div>
  );
}

function LogsTab({ build: b }: { build: BuildRecord }) {
  const allLogs = b.steps
    .filter((s) => s.log)
    .map((s) => `[${s.name}]\n${s.log}`)
    .join("\n\n");

  const fullContent = allLogs + (b.error ? `\n\n${b.error}` : "");

  function handleDownload() {
    const blob = new Blob([fullContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${b.shortId}-build.log`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // function handleCopy() {
  //   navigator.clipboard.writeText(fullContent).then(() => {
  //     console.log("Logs copied to clipboard");
  //   });
  // }

  const hasLogs = allLogs.trim().length > 0;

  return (
    <div className="p-4 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold font-mono uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Build Output
          </span>

          {b.status === "building" && (
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono"
              style={{
                background: "rgba(0,212,255,0.1)",
                color: "var(--accent)",
              }}
            >
              <Loader size={12} className="animate-spin" />
              Live
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/*<button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            onClick={handleCopy}
            disabled={!hasLogs}
            title="Copy logs to clipboard"
          >
            <Copy size={14} />
            Copy
          </button>*/}

          <button
            className="cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-semibold transition-colors"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            onClick={handleDownload}
            disabled={!hasLogs}
            title="Download logs"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {/* Logs */}
      <div
        className="flex-1 flex flex-col rounded-lg overflow-hidden border"
        style={{
          background: "var(--bg0)",
          borderColor: "var(--border)",
        }}
      >
        {hasLogs ? (
          <div
            className="flex-1 p-3 overflow-y-auto font-mono text-[10px]"
            style={{
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {allLogs.split("\n").map((line, idx) => (
              <div
                key={idx}
                style={{
                  color: line.includes("error")
                    ? "var(--red)"
                    : line.startsWith("[")
                      ? "var(--accent)"
                      : "var(--text-secondary)",
                }}
              >
                {line}
              </div>
            ))}

            {b.error && (
              <div
                className="mt-4 pt-4"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div
                  className="flex items-center gap-2 mb-2"
                  style={{ color: "var(--red)" }}
                >
                  <AlertCircle size={14} />
                  <span className="font-semibold text-[11px]">Build Error</span>
                </div>
                <div style={{ color: "var(--red)" }}>{b.error}</div>
              </div>
            )}

            {b.status === "building" && (
              <span
                className="animate-pulse"
                style={{ color: "var(--accent)" }}
              >
                ▌
              </span>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle size={24} style={{ color: "var(--text-muted)" }} />
              <span
                className="text-[11px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                No log output available
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px]">
        <span style={{ color: "var(--text-muted)" }}>
          {hasLogs ? `${fullContent.split("\n").length} lines` : "No output"}
        </span>

        {b.duration && (
          <span style={{ color: "var(--text-muted)" }}>
            Duration: {b.duration}
          </span>
        )}
      </div>
    </div>
  );
}
