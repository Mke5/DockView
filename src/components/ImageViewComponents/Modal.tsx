import {
  DownloadCloud,
  Loader2,
  Play,
  Search,
  UploadCloud,
} from "lucide-react";
import { CloseBtn } from "./CloseBtn";
import { repoColor } from "./ImageRow";
import { DockerImage, useContainerStore, useImageStore } from "../../store";
import { useState } from "react";

const POPULAR_IMAGES = [
  { name: "nginx", tag: "alpine", desc: "High performance web server" },
  { name: "postgres", tag: "15", desc: "Open source relational database" },
  { name: "redis", tag: "7-alpine", desc: "In-memory data structure store" },
  { name: "node", tag: "20-slim", desc: "Node.js JavaScript runtime" },
  { name: "python", tag: "3.11", desc: "Python programming language" },
  { name: "alpine", tag: "latest", desc: "Minimal Linux distribution" },
  { name: "ubuntu", tag: "22.04", desc: "Ubuntu Linux base image" },
  { name: "mysql", tag: "8.0", desc: "MySQL relational database" },
];

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="flex flex-col rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg1)",
          border: "1px solid var(--border-lit)",
          width: wide ? "560px" : "480px",
          maxHeight: "88vh",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h2>
          <CloseBtn onClick={onClose} />
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function ModalField({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div>
        <p
          className="text-xs font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
        {description && (
          <p
            className="text-[10px] font-mono mt-0.5"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function ModalInput({
  value,
  onChange,
  placeholder,
  mono,
  autoFocus,
  error,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  autoFocus?: boolean;
  error?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`w-full h-9 px-3 rounded outline-none text-[11px] ${mono ? "font-mono" : ""}`}
      style={{
        background: "var(--bg3)",
        border: `1px solid ${error ? "var(--red)" : "var(--border)"}`,
        color: "var(--text-secondary)",
        ...style,
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)";
        e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-dim)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error
          ? "var(--red)"
          : "var(--border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function ModalToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p
          className="text-[11px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </p>
        <p
          className="text-[10px] font-mono"
          style={{ color: "var(--text-muted)" }}
        >
          {description}
        </p>
      </div>
      <div
        className="relative w-9 h-5 rounded-full cursor-pointer transition-all duration-200 shrink-0"
        style={{
          background: value ? "var(--accent)" : "var(--bg4)",
          border: `1px solid ${value ? "var(--accent)" : "var(--border-lit)"}`,
        }}
        onClick={() => onChange(!value)}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
          style={{
            left: value ? "calc(100% - 18px)" : "2px",
            background: value ? "#000" : "var(--text-muted)",
          }}
        />
      </div>
    </div>
  );
}

// ─── PULL MODAL ───────────────────────────────────────────────────────────────

export function PullModal({
  onClose,
  onPulled,
}: {
  onClose: () => void;
  onPulled: (img: DockerImage) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [tag, setTag] = useState("latest");
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pullStep, setPullStep] = useState("");
  const [done, setDone] = useState(false);

  const displayImage = selected || query;

  function handlePull() {
    if (!displayImage.trim()) return;
    setPulling(true);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 14 + 3;
      setProgress(Math.min(p, 100));
      if (p < 25) setPullStep("Resolving image reference…");
      else if (p < 50) setPullStep("Downloading layers…");
      else if (p < 75) setPullStep("Verifying checksums…");
      else if (p < 95) setPullStep("Extracting layers…");
      else setPullStep("Finalising…");
      if (p >= 100) {
        clearInterval(iv);
        setPulling(false);
        setDone(true);
        // Add to image store
        const id = "sha256:" + crypto.randomUUID().replace(/-/g, "");
        onPulled({
          id,
          shortId: id.slice(7, 15),
          repository: displayImage,
          tag,
          size: "—",
          sizeBytes: 0,
          created: new Date().toISOString().slice(0, 10),
          inUse: false,
          architecture: "amd64",
          os: "linux",
          digest: `sha256:${id.slice(7, 15)}…`,
          containers: [],
        });
      }
    }, 150);
  }

  const filteredImages = POPULAR_IMAGES.filter(
    (img) => !query || img.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <Modal title="Pull an image" onClose={onClose}>
      {!done ? (
        <div className="flex flex-col gap-4">
          <ModalField
            label="Image name"
            description="Enter a Docker Hub image or search below"
          >
            <div className="flex gap-2">
              <div
                className="flex items-center gap-2 flex-1 px-3 h-9 rounded"
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                }}
              >
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelected("");
                  }}
                  placeholder="Search Docker Hub…"
                  autoFocus
                  className="flex-1 bg-transparent border-none outline-none text-[11px] font-mono"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="tag"
                className="h-9 px-3 rounded text-[11px] font-mono outline-none"
                style={{
                  width: "80px",
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              />
            </div>
          </ModalField>

          <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
            <p
              className="text-[9px] font-semibold uppercase tracking-widest font-mono mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              {query ? "Results" : "Popular images"}
            </p>
            {filteredImages.map((img) => (
              <div
                key={img.name}
                className="flex items-center gap-3 px-3 py-2.5 rounded cursor-pointer transition-all"
                style={{
                  background:
                    selected === img.name ? "var(--accent-dim)" : "var(--bg2)",
                  border: `1px solid ${selected === img.name ? "rgba(0,212,255,0.25)" : "var(--border)"}`,
                }}
                onClick={() => {
                  setSelected(img.name);
                  setQuery(img.name);
                  setTag(img.tag);
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 uppercase"
                  style={repoColor(img.name)}
                >
                  {img.name.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold font-mono"
                    style={{
                      color:
                        selected === img.name
                          ? "var(--accent)"
                          : "var(--text-primary)",
                    }}
                  >
                    {img.name}
                    <span
                      className="ml-1.5 text-[10px] font-normal"
                      style={{ color: "var(--text-muted)" }}
                    >
                      :{img.tag}
                    </span>
                  </p>
                  <p
                    className="text-[10px] font-mono mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {img.desc}
                  </p>
                </div>
                {selected === img.name && (
                  <span style={{ color: "var(--accent)", fontSize: 12 }}>
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>

          {pulling && (
            <div
              className="flex flex-col gap-1.5 p-3 rounded-lg"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {pullStep}
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--accent)" }}
                >
                  {Math.round(progress)}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg4)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress}%`, background: "var(--accent)" }}
                />
              </div>
              <span
                className="text-[10px] font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                {displayImage}:{tag}
              </span>
            </div>
          )}

          <div
            className="flex justify-end gap-2 pt-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button className="toolbar-btn px-4" onClick={onClose}>
              Cancel
            </button>
            <button
              className="px-5 py-2 rounded text-[11px] font-semibold transition-all flex flex-row items-center gap-1"
              style={{
                background:
                  !displayImage.trim() || pulling
                    ? "var(--bg4)"
                    : "var(--accent)",
                color:
                  !displayImage.trim() || pulling
                    ? "var(--text-muted)"
                    : "#000",
                border: "1px solid transparent",
                cursor:
                  !displayImage.trim() || pulling ? "not-allowed" : "pointer",
              }}
              disabled={!displayImage.trim() || pulling}
              onClick={handlePull}
            >
              {pulling ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Pulling…</span>
                </>
              ) : (
                <>
                  <DownloadCloud className="h-4 w-4" />
                  <span>Pull image</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "var(--green-dim)",
              border: "1px solid rgba(0,230,118,0.3)",
            }}
          >
            ✓
          </div>
          <div className="text-center">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Pull complete
            </p>
            <p
              className="text-xs font-mono mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {displayImage}:{tag} added to your images
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="toolbar-btn px-4" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── PUSH MODAL ───────────────────────────────────────────────────────────────

export function PushModal({
  onClose,
  image,
}: {
  onClose: () => void;
  image: DockerImage | null;
}) {
  const { images } = useImageStore();
  const [selectedImg, setSelectedImg] = useState(image?.id ?? "");
  const [registry, setRegistry] = useState("docker.io");
  const [namespace, setNamespace] = useState("mke5");
  const [pushing, setPushing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pushStep, setPushStep] = useState("");
  const [done, setDone] = useState(false);

  const img = images.find((i) => i.id === selectedImg);
  const fullRef = img
    ? `${registry}/${namespace}/${img.repository}:${img.tag}`
    : "";

  function handlePush() {
    if (!img) return;
    setPushing(true);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 12 + 3;
      setProgress(Math.min(p, 100));
      if (p < 30) setPushStep("Preparing layers…");
      else if (p < 60) setPushStep("Pushing layers…");
      else if (p < 85) setPushStep("Pushing manifest…");
      else setPushStep("Finalising…");
      if (p >= 100) {
        clearInterval(iv);
        setPushing(false);
        setDone(true);
      }
    }, 160);
  }

  return (
    <Modal title="Push an image" onClose={onClose}>
      {!done ? (
        <div className="flex flex-col gap-4">
          <ModalField
            label="Select image"
            description="Choose which image to push"
          >
            <select
              value={selectedImg}
              onChange={(e) => setSelectedImg(e.target.value)}
              className="w-full h-9 px-3 rounded text-[11px] font-mono outline-none"
              style={{
                background: "var(--bg3)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              <option value="">Select an image…</option>
              {images.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.repository}:{i.tag}
                </option>
              ))}
            </select>
          </ModalField>

          <div className="grid grid-cols-2 gap-3">
            <ModalField label="Registry" description="">
              <select
                value={registry}
                onChange={(e) => setRegistry(e.target.value)}
                className="w-full h-9 px-3 rounded text-[11px] font-mono outline-none"
                style={{
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                <option value="docker.io">Docker Hub</option>
                <option value="ghcr.io">GitHub GHCR</option>
                <option value="gcr.io">Google GCR</option>
                <option value="custom">Custom…</option>
              </select>
            </ModalField>
            <ModalField label="Namespace / org" description="">
              <ModalInput
                value={namespace}
                onChange={setNamespace}
                placeholder="mke5"
                mono
              />
            </ModalField>
          </div>

          {/* Full ref preview */}
          {fullRef && (
            <div
              className="px-3 py-2.5 rounded"
              style={{
                background: "var(--bg0)",
                border: "1px solid var(--border)",
              }}
            >
              <p
                className="text-[9px] font-mono uppercase tracking-wider mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Push target
              </p>
              <p
                className="text-[11px] font-mono"
                style={{ color: "var(--text-secondary)" }}
              >
                <span style={{ color: "var(--accent)" }}>$ docker push </span>
                {fullRef}
              </p>
            </div>
          )}

          {pushing && (
            <div
              className="flex flex-col gap-1.5 p-3 rounded-lg"
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex justify-between items-center">
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {pushStep}
                </span>
                <span
                  className="text-[10px] font-mono"
                  style={{ color: "var(--accent)" }}
                >
                  {Math.round(progress)}%
                </span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg4)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{ width: `${progress}%`, background: "var(--purple)" }}
                />
              </div>
            </div>
          )}

          <div
            className="flex justify-end gap-2 pt-4"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <button className="toolbar-btn px-4" onClick={onClose}>
              Cancel
            </button>
            <button
              className="px-5 py-2 rounded text-[11px] font-semibold transition-all flex items-center gap-1"
              style={{
                background:
                  !selectedImg || pushing ? "var(--bg4)" : "var(--accent)",
                color: !selectedImg || pushing ? "var(--text-muted)" : "#000",
                border: "1px solid transparent",
                cursor: !selectedImg || pushing ? "not-allowed" : "pointer",
              }}
              disabled={!selectedImg || pushing}
              onClick={handlePush}
            >
              {pushing ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Pushing…</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Push image</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "var(--green-dim)",
              border: "1px solid rgba(0,230,118,0.3)",
            }}
          >
            ✓
          </div>
          <div className="text-center">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Push complete
            </p>
            <p
              className="text-xs font-mono mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {fullRef}
            </p>
          </div>
          <button className="toolbar-btn px-4" onClick={onClose}>
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}

// ─── RUN MODAL ────────────────────────────────────────────────────────────────

export function RunModal({
  onClose,
  image,
}: {
  onClose: () => void;
  image: DockerImage;
}) {
  const addContainer = useContainerStore((s) => s.addContainer);
  const [name, setName] = useState("");
  const [ports, setPorts] = useState("");
  const [envVars, setEnvVars] = useState("");
  const [cmd, setCmd] = useState("");
  const [detach, setDetach] = useState(true);

  function handleRun() {
    const id = crypto.randomUUID();
    addContainer({
      id,
      shortId: id.slice(0, 8),
      name:
        name.trim() ||
        `${image.repository}-${Math.floor(Math.random() * 1000)}`,
      image: `${image.repository}:${image.tag}`,
      status: "running",
      ports: ports
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      cpu: 0,
      memory: "0 MB",
      uptime: "just now",
      created: new Date().toISOString().slice(0, 10),
    });
    onClose();
  }

  return (
    <Modal title={`Run ${image.repository}:${image.tag}`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Image info */}
        <div
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold font-mono uppercase shrink-0"
            style={repoColor(image.repository)}
          >
            {image.repository.slice(0, 2)}
          </div>
          <div>
            <p
              className="text-xs font-semibold font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {image.repository}:{image.tag}
            </p>
            <p
              className="text-[10px] font-mono mt-0.5"
              style={{ color: "var(--text-muted)" }}
            >
              {image.size} · {image.architecture}
            </p>
          </div>
        </div>

        <ModalField
          label="Container name"
          description="Optional — auto-generated if left blank"
        >
          <ModalInput
            value={name}
            onChange={setName}
            placeholder={`${image.repository}-1`}
            mono
            autoFocus
          />
        </ModalField>

        <ModalField
          label="Port mappings"
          description="Comma-separated host:container pairs"
        >
          <ModalInput
            value={ports}
            onChange={setPorts}
            placeholder="8080:80"
            mono
          />
        </ModalField>

        <ModalField
          label="Environment variables"
          description="One per line: KEY=VALUE"
        >
          <textarea
            value={envVars}
            onChange={(e) => setEnvVars(e.target.value)}
            placeholder={"NODE_ENV=production\nPORT=3000"}
            rows={2}
            className="w-full px-3 py-2 rounded text-[11px] font-mono outline-none resize-none"
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          />
        </ModalField>

        <ModalField
          label="Command override"
          description="Override the default CMD"
        >
          <ModalInput
            value={cmd}
            onChange={setCmd}
            placeholder="/bin/sh"
            mono
          />
        </ModalField>

        <ModalToggleRow
          label="Run detached"
          description="Run in background (-d)"
          value={detach}
          onChange={setDetach}
        />
      </div>

      <div
        className="flex justify-end gap-2 mt-5 pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button className="toolbar-btn px-4" onClick={onClose}>
          Cancel
        </button>
        <button
          className="flex gap-1 items-center px-5 py-2 rounded text-[11px] font-semibold cursor-pointer transition-all"
          style={{
            background: "var(--accent)",
            color: "#000",
            border: "1px solid var(--accent)",
          }}
          onClick={handleRun}
        >
          <Play className="w-4 h-4" /> Run container
        </button>
      </div>
    </Modal>
  );
}
