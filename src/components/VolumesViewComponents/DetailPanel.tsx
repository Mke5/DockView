import { FolderOpen, X } from "lucide-react";
import { Volume } from "../../store";
import { CloseBtn } from "../ImageViewComponents/CloseBtn";
import { InfoRow } from "../ImageViewComponents/ImageRow";
import { Section, sizeColor, VolumeIcon } from "./Modal";

export function DetailPanel({
  volume: v,
  onClose,
  onRemove,
  onBrowse,
}: {
  volume: Volume;
  onClose: () => void;
  onRemove: () => void;
  onBrowse: () => void;
}) {
  const pct = Math.min((v.sizeBytes / 1_500_000_000) * 100, 100);

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: "300px",
        borderLeft: "1px solid var(--border)",
        background: "var(--bg1)",
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <VolumeIcon inUse={v.inUse} sizeBytes={v.sizeBytes} size="lg" />
          <div>
            <div
              className="text-xs font-semibold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {v.name}
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {v.driver} · {v.scope}
            </div>
          </div>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex gap-1.5">
          <button
            className="toolbar-btn flex-1 justify-center text-center"
            onClick={onBrowse}
          >
            <FolderOpen className="w-4 h-4" /> Browse
          </button>
          <button
            className="toolbar-btn px-3"
            style={
              v.inUse
                ? { opacity: 0.4, cursor: "not-allowed" }
                : { color: "var(--red)", borderColor: "rgba(255,82,82,0.3)" }
            }
            disabled={v.inUse}
            onClick={v.inUse ? undefined : onRemove}
            title={
              v.inUse ? "Stop containers before removing" : "Remove volume"
            }
          >
            <X className="w-4 h-4" /> Remove
          </button>
        </div>

        {v.inUse && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded text-[11px] font-mono"
            style={{
              background: "rgba(255,171,64,0.08)",
              border: "1px solid rgba(255,171,64,0.2)",
              color: "var(--amber)",
            }}
          >
            <span className="shrink-0 mt-px">⚠</span>
            <span>Volume is in use. Stop all containers before removing.</span>
          </div>
        )}

        <Section title="Storage">
          <div
            className="flex flex-col gap-2 p-3 rounded"
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex justify-between items-baseline">
              <span
                className="text-2xl font-semibold font-mono"
                style={{ color: "var(--text-primary)" }}
              >
                {v.size}
              </span>
              <span
                className="text-[10px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                of 1.5 GB ref.
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--bg4)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: sizeColor(v.sizeBytes) }}
              />
            </div>
          </div>
        </Section>

        <Section title="Details">
          <InfoRow label="Driver" value={v.driver} mono />
          <InfoRow label="Scope" value={v.scope} mono />
          <InfoRow label="Created" value={v.created} mono />
        </Section>

        <Section title="Mount point">
          <div
            className="text-[10px] font-mono break-all leading-relaxed p-2.5 rounded"
            style={{
              background: "var(--bg2)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {v.mountpoint}
          </div>
        </Section>

        <Section title={`Containers (${v.containers.length})`}>
          {v.containers.length > 0 ? (
            <div className="flex flex-col gap-1">
              {v.containers.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-mono cursor-pointer transition-all"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-lit)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <span style={{ color: "var(--green)" }}>▣</span>
                  {name}
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-[11px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              No containers mounted
            </p>
          )}
        </Section>

        {Object.keys(v.labels).length > 0 && (
          <Section title="Labels">
            <div className="flex flex-col gap-1">
              {Object.entries(v.labels).map(([k, val]) => (
                <div
                  key={k}
                  className="flex flex-col px-2.5 py-1.5 rounded gap-0.5"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="text-[9px] font-mono"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {k}
                  </span>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
