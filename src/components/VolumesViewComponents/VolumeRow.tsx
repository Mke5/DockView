import { FolderOpen, Info, X } from "lucide-react";
import { Volume } from "../../store";
import { Cell } from "../Cell";
import { RowBtn } from "../RowBtn";
import { sizeColor, VolumeIcon } from "./Modal";

function shortMount(path: string) {
  const parts = path.split("/");
  if (parts.length > 6) return "…/" + parts.slice(-3).join("/");
  return path;
}

export function VolumeRow({
  volume: v,
  selected,
  onSelect,
  onRemove,
  onBrowse,
}: {
  volume: Volume;
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onBrowse: () => void;
}) {
  const rowBg = selected ? "var(--accent-dim)" : "var(--bg1)";
  const rowBorder = selected ? "rgba(0,212,255,0.25)" : "var(--border)";

  return (
    <tr
      className="group"
      onClick={onSelect}
      style={{ cursor: "pointer" }}
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
      {/* Name */}
      <Cell
        first
        style={{ background: rowBg, borderColor: rowBorder, width: "22%" }}
      >
        <div className="flex items-center gap-2.5">
          <VolumeIcon inUse={v.inUse} sizeBytes={v.sizeBytes} />
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
              {v.scope} · {v.driver}
            </div>
          </div>
        </div>
      </Cell>

      {/* Driver */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "9%" }}>
        <span
          className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium"
          style={{
            background: "var(--bg3)",
            border: "1px solid var(--border-lit)",
            color: "var(--text-secondary)",
          }}
        >
          {v.driver}
        </span>
      </Cell>

      {/* Mount point */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "30%" }}>
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
          title={v.mountpoint}
        >
          {shortMount(v.mountpoint)}
        </span>
      </Cell>

      {/* Size */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "10%" }}>
        <div className="flex items-center gap-1.5">
          <div
            className="w-10 h-1 rounded-full overflow-hidden shrink-0"
            style={{ background: "var(--bg4)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min((v.sizeBytes / 1_500_000_000) * 100, 100)}%`,
                background: sizeColor(v.sizeBytes),
              }}
            />
          </div>
          <span
            className="text-[11px] font-mono whitespace-nowrap"
            style={{ color: "var(--text-secondary)" }}
          >
            {v.size}
          </span>
        </div>
      </Cell>

      {/* Created */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "10%" }}>
        <span
          className="text-[10px] font-mono whitespace-nowrap"
          style={{ color: "var(--text-muted)" }}
        >
          {v.created}
        </span>
      </Cell>

      {/* Status */}
      <Cell style={{ background: rowBg, borderColor: rowBorder, width: "1%" }}>
        {v.inUse ? (
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
            />{" "}
            Unused
          </span>
        )}
      </Cell>

      {/* Actions */}
      <Cell
        last
        style={{ background: rowBg, borderColor: rowBorder, width: "8%" }}
      >
        <div className="flex items-center gap-1 transition-opacity duration-150">
          <RowBtn title="Inspect" onClick={onSelect}>
            <Info className="w-4 h-4" />
          </RowBtn>
          <RowBtn title="Browse files" onClick={onBrowse}>
            <FolderOpen className="w-4 h-4" />
          </RowBtn>
          <RowBtn
            title={v.inUse ? "Stop containers first" : "Remove"}
            danger
            disabled={v.inUse}
            onClick={onRemove}
          >
            <X className="w-4 h-4" />
          </RowBtn>
        </div>
      </Cell>
    </tr>
  );
}
