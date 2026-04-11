import { Box, Info, Play, UploadCloud, X } from "lucide-react";
import { DockerImage } from "../../store";
import { CloseBtn } from "./CloseBtn";
import { SizeBar } from "./Helpers";
import { InfoRow, repoColor, Section } from "./ImageRow";

export function DetailPanel({
  image: img,
  onClose,
  onRemove,
  onRun,
  onPush,
}: {
  image: DockerImage;
  onClose: () => void;
  onRemove: () => void;
  onRun: () => void;
  onPush: () => void;
}) {
  const { bg, color } = repoColor(img.repository);

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: "300px",
        borderLeft: "1px solid var(--border)",
        background: "var(--bg1)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono uppercase shrink-0"
            style={{ background: bg, color }}
          >
            {img.repository.slice(0, 2)}
          </div>
          <div>
            <div
              className="text-xs font-semibold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {img.repository}
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              :{img.tag}
            </div>
          </div>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Quick actions */}
        <div className="flex gap-1.5">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-semibold cursor-pointer transition-all"
            style={{
              background: "var(--accent)",
              color: "#000",
              border: "1px solid var(--accent)",
            }}
            onClick={onRun}
          >
            <Play className="w-4 h-4" /> Run
          </button>
          <button
            className="toolbar-btn flex-1 justify-center"
            onClick={onPush}
          >
            <UploadCloud className="w-4 h-4" /> Push
          </button>
          <button
            className="toolbar-btn px-2.5"
            style={{ color: "var(--red)", borderColor: "rgba(255,82,82,0.3)" }}
            onClick={onRemove}
            title={
              img.inUse
                ? "Remove (container must be stopped first)"
                : "Remove image"
            }
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* In-use warning */}
        {img.inUse && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded text-[11px] font-mono"
            style={{
              background: "rgba(255,171,64,0.08)",
              border: "1px solid rgba(255,171,64,0.2)",
              color: "var(--amber)",
            }}
          >
            <span className="shrink-0 mt-px">
              <Info className="w-4 h-4" />
            </span>
            <span>
              Image is in use by {img.containers.length} container
              {img.containers.length !== 1 ? "s" : ""}. Stop them before
              removing.
            </span>
          </div>
        )}

        <Section title="Details">
          <InfoRow label="Image ID" value={img.shortId} mono />
          <InfoRow label="Size" value={img.size} mono />
          <InfoRow label="Created" value={img.created} mono />
          <InfoRow label="OS" value={img.os} mono />
          <InfoRow label="Arch" value={img.architecture} mono />
        </Section>

        <Section title="Digest">
          <div
            className="text-[10px] font-mono break-all leading-relaxed p-2.5 rounded"
            style={{
              background: "var(--bg2)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {img.id.slice(0, 71)}
          </div>
        </Section>

        <Section title="Containers using this image">
          {img.containers.length > 0 ? (
            <div className="flex flex-col gap-1">
              {img.containers.map((name) => (
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
                  <span style={{ color: "var(--green)" }}>
                    <Box className="w-4 h-4" />
                  </span>
                  {name}
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-[11px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              No containers running this image
            </p>
          )}
        </Section>

        <Section title="Relative size">
          <SizeBar sizeBytes={img.sizeBytes} label={img.size} showFull />
        </Section>
      </div>
    </div>
  );
}
