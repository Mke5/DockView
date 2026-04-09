import { Bug, Code, Play, Trash2, Upload } from "lucide-react";
import { DockerImage } from "../../store";
import { Cell } from "../Cell";
import { RowBtn } from "../RowBtn";
import { repoColor } from "./Config";
import { SizeBar } from "./Helpers";

export function ImageRow({
  image: img,
  selected,
  onSelect,
  onRemove,
  onRun,
  onPush,
}: {
  image: DockerImage;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRun: () => void;
  onPush: () => void;
}) {
  const { bg, color } = repoColor(img.repository);
  const rowBg = selected ? "var(--accent-dim)" : "var(--bg1)";
  const rowBorder = selected ? "rgba(0,212,255,0.25)" : "var(--border)";

  return (
    <tr
      onClick={onSelect}
      style={{ cursor: "pointer" }}
      className="group"
      onMouseEnter={(e) => {
        if (!selected)
          Array.from(e.currentTarget.cells).forEach((td) => {
            td.style.background = "var(--bg2)";
            td.style.borderTopColor = "var(--border-lit)";
            td.style.borderBottomColor = "var(--border-lit)";
          });
      }}
      onMouseLeave={(e) => {
        if (!selected)
          Array.from(e.currentTarget.cells).forEach((td) => {
            td.style.background = rowBg;
            td.style.borderTopColor = rowBorder;
            td.style.borderBottomColor = rowBorder;
          });
      }}
    >
      {/* Repository */}
      <Cell
        first
        style={{ background: rowBg, borderColor: rowBorder, width: "26%" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 uppercase"
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
              {img.digest.slice(0, 20)}…
            </div>
          </div>
        </div>
      </Cell>

      {/* Tag */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "12%" }}>
        <span
          className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium"
          style={{
            background: "var(--bg3)",
            border: "1px solid var(--border-lit)",
            color: "var(--text-secondary)",
          }}
        >
          {img.tag}
        </span>
      </Cell>

      {/* Image ID */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "13%" }}>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {img.shortId}
        </span>
      </Cell>

      {/* Size */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "10%" }}>
        <SizeBar sizeBytes={img.sizeBytes} label={img.size} />
      </Cell>

      {/* Created */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "13%" }}>
        <span
          className="text-[10px] font-mono whitespace-nowrap"
          style={{ color: "var(--text-muted)" }}
        >
          {img.created}
        </span>
      </Cell>

      {/* Status */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "11%" }}>
        {img.inUse ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase"
            style={{ background: "var(--green-dim)", color: "var(--green)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "var(--green)" }}
            />
            In use
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase"
            style={{ background: "var(--bg4)", color: "var(--text-muted)" }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: "var(--text-muted)" }}
            />
            Unused
          </span>
        )}
      </Cell>

      {/* Actions */}
      <Cell
        last
        style={{ background: rowBg, borderColor: rowBorder, width: "8%" }}
      >
        <div className="flex items-center gap-0.5 transition-opacity duration-150">
          <RowBtn title="Inspect" onClick={onSelect}>
            <Code className="w-3 h-3" />
          </RowBtn>
          <RowBtn
            title="Run container"
            onClick={(e) => {
              e.stopPropagation();
              onRun();
            }}
          >
            <Play className="w-3 h-3" />
          </RowBtn>
          <RowBtn
            title="Push to registry"
            onClick={(e) => {
              e.stopPropagation();
              onPush();
            }}
          >
            <Upload className="w-3 h-3" />
          </RowBtn>
          <RowBtn
            title="Remove"
            danger
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Trash2 className="w-3 h-3" />
          </RowBtn>
        </div>
      </Cell>
    </tr>
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

export function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      className="flex justify-between items-center py-1"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span
        className={`text-[11px] ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--text-secondary)" }}
      >
        {value}
      </span>
    </div>
  );
}
