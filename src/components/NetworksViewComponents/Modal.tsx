import { useState } from "react";
import { Network, useContainerStore } from "../../store";
import { driverColor, Flag } from "./NetworkRow";
import { Modal, ModalField, ModalInput, ModalToggleRow } from "../Modal";
import { CloseBtn } from "../ImageViewComponents/CloseBtn";
import { InfoRow, Section } from "../ImageViewComponents/ImageRow";
import {
  Box,
  CircleOff,
  Link,
  MinusCircle,
  Network as NetworkIcon,
  Play,
  Plug,
  Plus,
  X,
} from "lucide-react";

function nextIp(subnet: string): string {
  if (subnet === "—") return "—";
  const base = subnet.split("/")[0].split(".");
  const last = parseInt(base[3]) + Math.floor(Math.random() * 100) + 2;
  return `${base[0]}.${base[1]}.${base[2]}.${Math.min(last, 254)}`;
}

function LegendItem({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span
        className="text-[10px] font-mono"
        style={{ color: "var(--text-muted)" }}
      >
        {children}
      </span>
    </div>
  );
}

// ─── TOPOLOGY VIEW ────────────────────────────────────────────────────────────

export function TopologyView({
  networks,
  selectedId,
  onSelect,
  onConnect,
}: {
  networks: Network[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onConnect: (net: Network) => void;
}) {
  const custom = networks.filter((n) => !n.isDefault);
  const defaults = networks.filter((n) => n.isDefault);

  return (
    <div
      className="flex-1 overflow-auto p-6"
      style={{ background: "var(--bg0)" }}
    >
      <div className="flex flex-col gap-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <LegendItem color="var(--accent)">Custom network</LegendItem>
          <LegendItem color="var(--text-muted)">Default network</LegendItem>
          <LegendItem color="var(--green)">Container</LegendItem>
        </div>

        {custom.length > 0 && (
          <div className="flex flex-col gap-3">
            <p
              className="text-[10px] font-mono font-semibold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Custom networks
            </p>
            {custom.map((net) => {
              const dc = driverColor(net.driver);
              const isSelected = selectedId === net.id;
              return (
                <div
                  key={net.id}
                  className="rounded-xl p-4 cursor-pointer transition-all duration-150"
                  style={{
                    background: isSelected ? "var(--accent-dim)" : "var(--bg2)",
                    border: `1px solid ${isSelected ? "rgba(0,212,255,0.3)" : "var(--border)"}`,
                  }}
                  onClick={() => onSelect(isSelected ? null : net.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ background: dc.bg, color: dc.color }}
                      >
                        <NetworkIcon className="w-4 h-4" />
                      </div>
                      <span
                        className="text-sm font-semibold font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {net.name}
                      </span>
                      {net.internal && (
                        <Flag color="var(--purple)">internal</Flag>
                      )}
                      {net.attachable && (
                        <Flag color="var(--accent)">attachable</Flag>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {net.subnet}
                      </span>
                      <button
                        className="flex gap-1 text-[10px] font-mono px-2 py-0.5 rounded border cursor-pointer transition-all"
                        style={{
                          background: "var(--bg3)",
                          borderColor: "var(--border)",
                          color: "var(--text-muted)",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnect(net);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "var(--accent)";
                          e.currentTarget.style.color = "var(--accent)";
                          e.currentTarget.style.background =
                            "var(--accent-dim)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.color = "var(--text-muted)";
                          e.currentTarget.style.background = "var(--bg3)";
                        }}
                      >
                        <Link className="w-3 h-3" /> Connect
                      </button>
                    </div>
                  </div>
                  {net.containers.length > 0 ? (
                    <div
                      className="flex flex-wrap gap-2 pl-2"
                      style={{ borderLeft: `2px solid ${dc.color}33` }}
                    >
                      {net.containers.map((c) => (
                        <div
                          key={c.name}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded"
                          style={{
                            background: "var(--bg3)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background: "var(--green)",
                              boxShadow: "0 0 4px var(--green)",
                            }}
                          />
                          <span
                            className="text-[11px] font-mono"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {c.name}
                          </span>
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {c.ip}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p
                      className="text-[10px] font-mono pl-2"
                      style={{
                        color: "var(--text-muted)",
                        borderLeft: "2px solid var(--border)",
                      }}
                    >
                      No containers connected ·{" "}
                      <span
                        style={{ color: "var(--accent)", cursor: "pointer" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onConnect(net);
                        }}
                      >
                        Connect one
                      </span>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p
            className="text-[10px] font-mono font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Default networks
          </p>
          <div className="flex gap-2 flex-wrap">
            {defaults.map((net) => {
              const dc = driverColor(net.driver);
              return (
                <div
                  key={net.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                    opacity: 0.7,
                  }}
                  onClick={() =>
                    onSelect(selectedId === net.id ? null : net.id)
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.7";
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
                    style={{ background: dc.bg, color: dc.color }}
                  >
                    <NetworkIcon className="w-4 h-4" />
                  </div>
                  <span
                    className="text-[11px] font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {net.name}
                  </span>
                  <span
                    className="text-[9px] font-mono px-1 py-px rounded"
                    style={{
                      background: "var(--bg4)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {net.driver}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONNECT CONTAINER MODAL ──────────────────────────────────────────────────

export function ConnectContainerModal({
  network,
  onClose,
  onConnect,
}: {
  network: Network;
  onClose: () => void;
  onConnect: (container: { name: string; ip: string }) => void;
}) {
  const { containers } = useContainerStore();
  const [selectedId, setSelectedId] = useState("");
  const [customIp, setCustomIp] = useState("");

  const alreadyConnected = new Set(network.containers.map((c) => c.name));
  const available = containers.filter(
    (c) => c.status === "running" && !alreadyConnected.has(c.name),
  );

  const selected = containers.find((c) => c.id === selectedId);
  const ip = customIp.trim() || (selected ? nextIp(network.subnet) : "");

  function handleConnect() {
    if (!selected) return;
    onConnect({ name: selected.name, ip });
  }

  return (
    <Modal title={`Connect container to ${network.name}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Network info */}
        <div
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
            style={driverColor(network.driver)}
          >
            <NetworkIcon className="w-4 h-4" />
          </div>
          <div>
            <p
              className="text-xs font-semibold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {network.name}
            </p>
            <p
              className="text-[10px] font-mono mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {network.subnet} · {network.driver}
            </p>
          </div>
        </div>

        <ModalField
          label="Select container"
          description="Only running containers can be connected"
        >
          {available.length === 0 ? (
            <div
              className="flex flex-col items-center gap-2 py-6 rounded-lg"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-lg" style={{ color: "var(--text-muted)" }}>
                <CircleOff size={16} className="text-muted" />
              </span>
              <p
                className="text-[11px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                No running containers available to connect
              </p>
              <p
                className="text-[10px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                All running containers are already connected to this network
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
              {available.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer transition-all"
                  style={{
                    background:
                      selectedId === c.id ? "var(--accent-dim)" : "var(--bg2)",
                    border: `1px solid ${selectedId === c.id ? "rgba(0,212,255,0.25)" : "var(--border)"}`,
                  }}
                  onClick={() => setSelectedId(c.id)}
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-xs shrink-0"
                    style={{
                      background: "var(--green-dim)",
                      color: "var(--green)",
                    }}
                  >
                    <Play className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-semibold font-mono"
                      style={{
                        color:
                          selectedId === c.id
                            ? "var(--accent)"
                            : "var(--text-primary)",
                      }}
                    >
                      {c.name}
                    </p>
                    <p
                      className="text-[10px] font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {c.image}
                    </p>
                  </div>
                  {selectedId === c.id && (
                    <span style={{ color: "var(--accent)", fontSize: 12 }}>
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </ModalField>

        {selected && (
          <ModalField
            label="IP address"
            description="Leave blank for automatic assignment"
          >
            <ModalInput
              value={customIp}
              onChange={setCustomIp}
              placeholder={nextIp(network.subnet)}
              mono
            />
          </ModalField>
        )}

        {selected && (
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
              className="text-[10px] font-mono break-all"
              style={{ color: "var(--text-secondary)" }}
            >
              <span style={{ color: "var(--accent)" }}>$ </span>
              docker network connect{ip ? ` --ip ${ip}` : ""} {network.name}{" "}
              {selected.name}
            </p>
          </div>
        )}
      </div>

      <div
        className="flex justify-end gap-2 mt-5 pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button className="toolbar-btn px-4" onClick={onClose}>
          Cancel
        </button>
        <button
          className="flex gap-1 px-5 py-2 rounded text-[11px] font-semibold transition-all"
          style={{
            background:
              !selected || available.length === 0
                ? "var(--bg4)"
                : "var(--accent)",
            color:
              !selected || available.length === 0
                ? "var(--text-muted)"
                : "#000",
            border: "1px solid transparent",
            cursor:
              !selected || available.length === 0 ? "not-allowed" : "pointer",
          }}
          disabled={!selected || available.length === 0}
          onClick={handleConnect}
        >
          <Link className="w-4 h-4" /> Connect
        </button>
      </div>
    </Modal>
  );
}

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
            <NetworkIcon className="w-4 h-4" />
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
            <Link className="w-4 h-4" /> Connect
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
            <X className="w-4 h-4" /> Remove
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
                      <Box className="w-4 h-4" />
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
                      <MinusCircle className="w-4 h-4" />
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
                className="flex gap-1 text-[10px] font-mono px-2.5 py-1 rounded cursor-pointer border transition-all"
                style={{
                  background: "var(--accent-dim)",
                  borderColor: "rgba(0,212,255,0.2)",
                  color: "var(--accent)",
                }}
                onClick={onConnect}
              >
                <Plug className="w-4 h-4" /> Connect a container
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

// ─── CREATE NETWORK MODAL ─────────────────────────────────────────────────────

const DRIVER_OPTIONS = ["bridge", "host", "overlay", "macvlan", "none"];

const SCOPE_OPTIONS = ["local", "global", "swarm"];

export function CreateNetworkModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (n: Network) => void;
}) {
  const [name, setName] = useState("");
  const [driver, setDriver] = useState("bridge");
  const [scope, setScope] = useState("local");
  const [subnet, setSubnet] = useState("");
  const [gateway, setGateway] = useState("");
  const [ipRange, setIpRange] = useState("");
  const [internal, setInternal] = useState(false);
  const [attachable, setAttachable] = useState(true);
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
      setError("Network name is required.");
      return;
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name.trim())) {
      setError("Name must start with a letter or number.");
      return;
    }
    const id = `net-${name.trim()}-${Date.now()}`;
    const shortId = id.slice(-8);
    const effectiveSubnet =
      subnet.trim() ||
      (driver === "bridge"
        ? `172.${Math.floor(Math.random() * 50 + 22)}.0.0/16`
        : "—");
    const effectiveGateway =
      gateway.trim() ||
      (driver === "bridge"
        ? effectiveSubnet.replace("/16", "").replace(/\.0$/, ".1")
        : "—");
    onCreate({
      id,
      shortId,
      name: name.trim(),
      driver,
      scope: scope as "local" | "global" | "swarm",
      subnet: effectiveSubnet,
      gateway: effectiveGateway,
      ipRange: ipRange.trim() || effectiveSubnet,
      internal,
      attachable,
      created: new Date().toISOString().slice(0, 10),
      containers: [],
      labels,
      isDefault: false,
    });
    onClose();
  }

  const cliPreview = [
    "docker network create",
    `--driver ${driver}`,
    subnet && `--subnet ${subnet}`,
    gateway && `--gateway ${gateway}`,
    ipRange && `--ip-range ${ipRange}`,
    internal && "--internal",
    attachable && "--attachable",
    ...Object.entries(labels).map(([k, v]) => `--label ${k}=${v}`),
    name || "<name>",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Modal title="Create a network" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <ModalField
          label="Network name *"
          description="Unique name for the network"
        >
          <ModalInput
            value={name}
            onChange={(v) => {
              setName(v);
              setError("");
            }}
            placeholder="my_network"
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

        <div className="grid grid-cols-2 gap-3">
          <ModalField label="Driver" description="Network driver">
            <div className="flex flex-wrap gap-1.5">
              {DRIVER_OPTIONS.map((d) => (
                <button
                  key={d}
                  className="px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer border transition-all"
                  style={{
                    background:
                      driver === d ? "var(--accent-dim)" : "var(--bg3)",
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

          <ModalField label="Scope" description="Network scope">
            <div className="flex gap-1.5">
              {SCOPE_OPTIONS.map((s) => (
                <button
                  key={s}
                  className="px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer border transition-all"
                  style={{
                    background:
                      scope === s ? "var(--accent-dim)" : "var(--bg3)",
                    borderColor:
                      scope === s ? "rgba(0,212,255,0.3)" : "var(--border)",
                    color: scope === s ? "var(--accent)" : "var(--text-muted)",
                  }}
                  onClick={() => setScope(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </ModalField>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <ModalField label="Subnet" description="e.g. 172.20.0.0/16">
            <ModalInput
              value={subnet}
              onChange={setSubnet}
              placeholder="auto"
              mono
            />
          </ModalField>
          <ModalField label="Gateway" description="e.g. 172.20.0.1">
            <ModalInput
              value={gateway}
              onChange={setGateway}
              placeholder="auto"
              mono
            />
          </ModalField>
          <ModalField label="IP Range" description="e.g. 172.20.0.0/24">
            <ModalInput
              value={ipRange}
              onChange={setIpRange}
              placeholder="auto"
              mono
            />
          </ModalField>
        </div>

        {/* Flags */}
        <div
          className="grid grid-cols-2 gap-3 p-3 rounded-lg"
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
          }}
        >
          <ModalToggleRow
            label="Internal"
            description="Restrict external access (--internal)"
            value={internal}
            onChange={setInternal}
          />
          <ModalToggleRow
            label="Attachable"
            description="Allow manual container attach (--attachable)"
            value={attachable}
            onChange={setAttachable}
          />
        </div>

        {/* Labels */}
        <ModalField
          label="Labels"
          description="Key-value metadata for the network"
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
          <Plus className="w-4 h-4" /> Create network
        </button>
      </div>
    </Modal>
  );
}
