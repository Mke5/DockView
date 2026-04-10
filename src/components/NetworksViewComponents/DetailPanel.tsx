import { Network } from "../../store";
import { CloseBtn } from "../ImageViewComponents/CloseBtn";
import { InfoRow, Section } from "../ImageViewComponents/ImageRow";
import { driverColor, Flag } from "./NetworkRow";

export function DetailPanel({
  network: n,
  onClose,
  onRemove,
  onConnect,
  onDisconnect,
}: {
  network: Network;
  onClose: () => void;
  onRemove: () => void;
  onConnect: () => void;
  onDisconnect: (name: string) => void;
}) {
  const dc = driverColor(n.driver);

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
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={{ background: dc.bg, color: dc.color }}
          >
            ⬡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="text-xs font-semibold font-mono"
                style={{ color: "var(--text-primary)" }}
              >
                {n.name}
              </span>
              {n.isDefault && (
                <span
                  className="text-[9px] font-mono px-1 py-px rounded"
                  style={{
                    background: "var(--bg4)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  default
                </span>
              )}
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {n.driver} · {n.scope}
            </div>
          </div>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="flex gap-1.5">
          <button
            className="toolbar-btn flex-1 justify-center"
            onClick={onConnect}
          >
            ⊕ Connect
          </button>
          <button
            className="toolbar-btn px-3"
            style={
              n.isDefault
                ? { opacity: 0.4, cursor: "not-allowed" }
                : { color: "var(--red)", borderColor: "rgba(255,82,82,0.3)" }
            }
            disabled={n.isDefault}
            onClick={n.isDefault ? undefined : onRemove}
            title={
              n.isDefault
                ? "Default networks cannot be removed"
                : "Remove network"
            }
          >
            ✕ Remove
          </button>
        </div>

        {n.isDefault && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded text-[11px] font-mono"
            style={{
              background: "rgba(74,85,104,0.3)",
              border: "1px solid var(--border-lit)",
              color: "var(--text-secondary)",
            }}
          >
            <span className="shrink-0 mt-px">ℹ</span>
            <span>
              Default networks are managed by Docker and cannot be removed.
            </span>
          </div>
        )}

        <Section title="IP Configuration">
          <div
            className="rounded overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="grid grid-cols-2"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <IpCell label="Subnet" value={n.subnet} />
              <IpCell label="Gateway" value={n.gateway} right />
            </div>
            <div className="grid grid-cols-2">
              <IpCell label="IP Range" value={n.ipRange} />
              <IpCell label="Scope" value={n.scope} right />
            </div>
          </div>
        </Section>

        <Section title="Details">
          <InfoRow label="Network ID" value={n.shortId} mono />
          <InfoRow label="Driver" value={n.driver} mono />
          <InfoRow label="Created" value={n.created} mono />
          <InfoRow label="Internal" value={n.internal ? "Yes" : "No"} />
          <InfoRow label="Attachable" value={n.attachable ? "Yes" : "No"} />
        </Section>

        <Section title="Flags">
          <div className="flex flex-wrap gap-1.5">
            {n.internal && <Flag color="var(--purple)">internal</Flag>}
            {n.attachable && <Flag color="var(--accent)">attachable</Flag>}
            {n.isDefault && <Flag color="var(--text-muted)">default</Flag>}
            {!n.internal && !n.attachable && !n.isDefault && (
              <span
                className="text-[11px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                No special flags
              </span>
            )}
          </div>
        </Section>

        {/* Connected containers with disconnect */}
        <Section title={`Connected containers (${n.containers.length})`}>
          {n.containers.length > 0 ? (
            <div className="flex flex-col gap-1">
              {n.containers.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between px-2.5 py-2 rounded group/container transition-all cursor-pointer"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-lit)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--green)", fontSize: 12 }}>
                      ▣
                    </span>
                    <span
                      className="text-[11px] font-mono"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {c.ip}
                    </span>
                    <button
                      title="Disconnect"
                      className="opacity-0 group-hover/container:opacity-100 text-[10px] px-1.5 py-0.5 rounded cursor-pointer border transition-all"
                      style={{
                        background: "none",
                        borderColor: "transparent",
                        color: "var(--text-muted)",
                      }}
                      onClick={() => onDisconnect(c.name)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--red-dim)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,82,82,0.3)";
                        e.currentTarget.style.color = "var(--red)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.borderColor = "transparent";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      ⊖
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-3">
              <p
                className="text-[11px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                No containers connected
              </p>
              <button
                className="text-[10px] font-mono px-2.5 py-1 rounded cursor-pointer border transition-all"
                style={{
                  background: "var(--accent-dim)",
                  borderColor: "rgba(0,212,255,0.2)",
                  color: "var(--accent)",
                }}
                onClick={onConnect}
              >
                ⊕ Connect a container
              </button>
            </div>
          )}
        </Section>

        {Object.keys(n.labels).length > 0 && (
          <Section title="Labels">
            <div className="flex flex-col gap-1">
              {Object.entries(n.labels).map(([k, val]) => (
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

function IpCell({
  label,
  value,
  right,
}: {
  label: string;
  value: string;
  right?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-0.5 p-2.5"
      style={{ borderLeft: right ? "1px solid var(--border)" : "none" }}
    >
      <span
        className="text-[9px] font-mono uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </span>
      <span
        className="text-[11px] font-mono"
        style={{
          color: value === "—" ? "var(--text-muted)" : "var(--text-secondary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}
