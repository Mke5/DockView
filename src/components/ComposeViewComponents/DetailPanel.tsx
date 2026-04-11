import { useState } from "react";
import { ComposeService, ComposeStack } from "../../store";
import { CloseBtn } from "../ImageViewComponents/CloseBtn";
import {
  runningRatio,
  SERVICE_STATUS_CFG,
  SmallBtn,
  STACK_STATUS_CFG,
} from "./StackCard";
import { generateYaml } from "./generateYaml";
import { Section } from "../VolumesViewComponents/Modal";
import { InfoRow } from "../ImageViewComponents/ImageRow";
import {
  Check,
  Copy,
  DownloadCloud,
  FileText,
  Layers,
  Pause,
  Pencil,
  Play,
  RotateCw,
  Terminal,
  X,
} from "lucide-react";

export function DetailPanel({
  stack,
  onClose,
  onRemove,
  onStart,
  onStop,
  onRestart,
  onPull,
  onServiceToggle,
}: {
  stack: ComposeStack;
  onClose: () => void;
  onRemove: () => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onPull: () => void;
  onServiceToggle: (svc: ComposeService) => void;
}) {
  const cfg = STACK_STATUS_CFG[stack.status];
  const { running, total } = runningRatio(stack);
  const [activeTab, setActiveTab] = useState<
    "overview" | "services" | "config"
  >("overview");

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: "320px",
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
            style={{ background: `${cfg.color}18`, color: cfg.color }}
          >
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div
              className="text-xs font-semibold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {stack.name}
            </div>
            <div
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              {running}/{total} services · {stack.lastStarted}
            </div>
          </div>
        </div>
        <CloseBtn onClick={onClose} />
      </div>

      <div
        className="flex shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {(["overview", "services", "config"] as const).map((tab) => (
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
        {activeTab === "overview" && (
          <OverviewTab
            stack={stack}
            onStart={onStart}
            onStop={onStop}
            onRestart={onRestart}
            onPull={onPull}
            onRemove={onRemove}
          />
        )}
        {activeTab === "services" && (
          <ServicesTab stack={stack} onServiceToggle={onServiceToggle} />
        )}
        {activeTab === "config" && <ConfigTab stack={stack} />}
      </div>
    </div>
  );
}

function ServicesTab({
  stack,
  onServiceToggle,
}: {
  stack: ComposeStack;
  onServiceToggle: (svc: ComposeService) => void;
}) {
  return (
    <div className="p-4 flex flex-col gap-2">
      {stack.services.map((svc) => {
        const scfg =
          SERVICE_STATUS_CFG[svc.status] ?? SERVICE_STATUS_CFG.stopped;
        const cpuColor =
          svc.cpu > 60
            ? "var(--red)"
            : svc.cpu > 30
              ? "var(--amber)"
              : "var(--green)";

        return (
          <div
            key={svc.name}
            className="rounded-lg overflow-hidden"
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: scfg.color }}>
                  {scfg.icon}
                </span>
                <span
                  className="text-[12px] font-semibold font-mono"
                  style={{ color: "var(--text-primary)" }}
                >
                  {svc.name}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <SmallBtn title="Logs">
                  <FileText className="w-3 h-3" />
                </SmallBtn>
                <SmallBtn title="Terminal">
                  <Terminal className="w-3 h-3" />
                </SmallBtn>
                <SmallBtn
                  title={
                    svc.status === "running" ? "Stop service" : "Start service"
                  }
                  onClick={() => onServiceToggle(svc)}
                >
                  {svc.status === "running" ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </SmallBtn>
              </div>
            </div>
            <div className="px-3 py-2 flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  Image
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {svc.image}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  Replicas
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: svc.replicas }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-sm"
                      style={{
                        background:
                          i < svc.running ? "var(--green)" : "var(--bg4)",
                      }}
                    />
                  ))}
                  <span
                    className="text-[10px] font-mono ml-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {svc.running}/{svc.replicas}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  CPU
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-16 h-1 rounded-full overflow-hidden"
                    style={{ background: "var(--bg4)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${svc.cpu}%`, background: cpuColor }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {svc.cpu}%
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  Memory
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {svc.memory}
                </span>
              </div>
              {svc.ports.length > 0 && (
                <div className="flex justify-between items-center">
                  <span
                    className="text-[10px] font-mono"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Ports
                  </span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {svc.ports.map((p) => (
                      <span key={p} className="port-tag">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConfigTab({ stack }: { stack: ComposeStack }) {
  const [copied, setCopied] = useState(false);
  const yaml = generateYaml(stack);

  function handleCopy() {
    navigator.clipboard.writeText(yaml).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {stack.configPath}
        </span>
        <div className="flex gap-1.5">
          <button
            className="toolbar-btn px-2 py-1 text-[10px]"
            style={
              copied
                ? { color: "var(--green)", borderColor: "rgba(0,230,118,0.3)" }
                : {}
            }
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy
              </>
            )}
          </button>
          <button className="toolbar-btn px-2 py-1 text-[10px]">
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>
      <div
        className="rounded-lg p-3 overflow-x-auto"
        style={{ background: "var(--bg0)", border: "1px solid var(--border)" }}
      >
        <pre
          className="text-[10px] font-mono leading-relaxed"
          style={{ color: "var(--text-secondary)", margin: 0 }}
        >
          {yaml}
        </pre>
      </div>
    </div>
  );
}

function OverviewTab({
  stack,
  onStart,
  onStop,
  onRestart,
  onPull,
  onRemove,
}: {
  stack: ComposeStack;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onPull: () => void;
  onRemove: () => void;
}) {
  const cfg = STACK_STATUS_CFG[stack.status];
  const { running, total } = runningRatio(stack);

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1.5">
        {stack.status === "running" || stack.status === "partial" ? (
          <button className="toolbar-btn justify-center" onClick={onStop}>
            <Pause className="w-4 h-4" /> Stop
          </button>
        ) : (
          <button
            className="toolbar-btn-primary justify-center text-center py-1.5 rounded text-[11px] font-semibold"
            onClick={onStart}
          >
            <Play className="w-4 h-4" /> Start
          </button>
        )}
        <button className="toolbar-btn justify-center" onClick={onRestart}>
          <RotateCw className="w-4 h-4" /> Restart
        </button>
        <button className="toolbar-btn justify-center" onClick={onPull}>
          <DownloadCloud className="w-4 h-4" /> Pull latest
        </button>
        <button className="toolbar-btn justify-center">
          <Pencil className="w-4 h-4" /> Edit file
        </button>
      </div>
      <button
        className="toolbar-btn justify-center w-full"
        style={{ color: "var(--red)", borderColor: "rgba(255,82,82,0.3)" }}
        onClick={onRemove}
      >
        <X className="w-4 h-4" /> Remove stack
      </button>

      <Section title="Status">
        <div
          className="flex items-center justify-between p-3 rounded"
          style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: cfg.dot,
                boxShadow:
                  stack.status === "running" ? `0 0 6px ${cfg.dot}` : "none",
              }}
            />
            <span
              className="text-sm font-semibold font-mono"
              style={{ color: cfg.color }}
            >
              {cfg.label}
            </span>
          </div>
          <span className="text-xs font-mono" style={{ color: cfg.color }}>
            {running}/{total} services up
          </span>
        </div>
      </Section>

      <Section title="Service health">
        <div className="flex flex-col gap-1">
          {stack.services.map((svc) => {
            const scfg =
              SERVICE_STATUS_CFG[svc.status] ?? SERVICE_STATUS_CFG.stopped;
            return (
              <div
                key={svc.name}
                className="flex items-center justify-between px-2.5 py-2 rounded"
                style={{
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: scfg.color }}>
                    {scfg.icon}
                  </span>
                  <span
                    className="text-[11px] font-mono"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {svc.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {svc.cpu > 0 && (
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {svc.cpu}% CPU
                    </span>
                  )}
                  <span
                    className="text-[10px] font-mono px-1.5 py-px rounded capitalize"
                    style={{ background: `${scfg.color}18`, color: scfg.color }}
                  >
                    {svc.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Details">
        <InfoRow label="Project" value={stack.project} mono />
        <InfoRow label="Created" value={stack.created} mono />
        <InfoRow label="Started" value={stack.lastStarted} mono />
      </Section>

      {stack.networks.length > 0 && (
        <Section title="Networks">
          <div className="flex flex-wrap gap-1">
            {stack.networks.map((n) => (
              <span
                key={n}
                className="port-tag"
                style={{
                  background: "rgba(0,212,255,0.1)",
                  color: "var(--accent)",
                }}
              >
                {n}
              </span>
            ))}
          </div>
        </Section>
      )}

      {stack.volumes.length > 0 && (
        <Section title="Volumes">
          <div className="flex flex-wrap gap-1">
            {stack.volumes.map((v) => (
              <span
                key={v}
                className="port-tag"
                style={{
                  background: "rgba(179,136,255,0.1)",
                  color: "var(--purple)",
                }}
              >
                {v}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
