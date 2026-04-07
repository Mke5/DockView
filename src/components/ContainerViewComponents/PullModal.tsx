import {
  Check,
  Download,
  Package,
  Play,
  RefreshCw,
  Search,
} from "lucide-react";
import { Modal, ModalField } from "../Modal";
import { useState } from "react";

export function PullModal({ onClose }: { onClose: () => void }) {
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
      p += Math.random() * 15 + 3;
      setProgress(Math.min(p, 100));
      if (p < 25) setPullStep("Resolving image reference…");
      else if (p < 50) setPullStep("Downloading layers…");
      else if (p < 75) setPullStep("Verifying checksums…");
      else if (p < 95) setPullStep("Extracting layers…");
      else setPullStep("Finalising…");
      if (p >= 100) {
        clearInterval(iv);
        setDone(true);
        setPulling(false);
      }
    }, 150);
  }

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
                  className="text-[20px]"
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

          {/* Image list */}
          <div className="flex flex-col gap-1 max-h-56 overflow-y-auto">
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
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0"
                  style={{ background: "var(--bg3)", color: "var(--accent)" }}
                >
                  {/*{img.name.slice(0, 2).toUpperCase()}*/}
                  <Package className="w-4 h-4" />
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
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Pull progress */}
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
              className="px-5 py-2 rounded text-[11px] font-semibold transition-all"
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
                  <RefreshCw className="w-4 h-4 mr-1 inline animate-spin" />
                  Pulling…
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1 inline" />
                  Pull image
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Success */
        <div className="flex flex-col items-center gap-4 py-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "var(--green-dim)",
              border: "1px solid rgba(0,230,118,0.3)",
            }}
          >
            <Check className="w-7 h-7" />
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
              {displayImage}:{tag} is ready to use
            </p>
          </div>
          <div className="flex gap-2 mt-2">
            <button className="toolbar-btn px-4" onClick={onClose}>
              Close
            </button>
            <button
              className="px-5 py-2 rounded text-[11px] font-semibold cursor-pointer"
              style={{
                background: "var(--accent)",
                color: "#000",
                border: "1px solid var(--accent)",
              }}
              onClick={onClose}
            >
              <Play className="w-4 h-4 mr-1 inline" /> Run now
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
