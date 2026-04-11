import { useState } from "react";
import { ComposeService, ComposeStack } from "../../store";
import { Modal, ModalField, ModalInput } from "../Modal";
import { FolderOpen, Plus } from "lucide-react";

// Starter template for New Stack modal
const STACK_TEMPLATE = `version: "3.9"
services:
  app:
    image: node:20-slim
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=secret
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
`;

// ─── NEW STACK MODAL ──────────────────────────────────────────────────────────

export function NewStackModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (s: ComposeStack) => void;
}) {
  const [name, setName] = useState("");
  const [yaml, setYaml] = useState(STACK_TEMPLATE);
  const [configPath, setConfigPath] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"editor" | "options">("editor");

  function handleCreate() {
    if (!name.trim()) {
      setError("Stack name is required.");
      return;
    }
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name.trim())) {
      setError(
        "Name must start with a letter or number (letters, numbers, _, -)",
      );
      return;
    }

    // Parse services from yaml (basic extraction)
    const serviceMatches = [...yaml.matchAll(/^  ([a-zA-Z0-9_-]+):\s*$/gm)].map(
      (m) => m[1],
    );
    const services: ComposeService[] = serviceMatches.map((svcName) => {
      const imageMatch = yaml.match(
        new RegExp(`${svcName}:[\\s\\S]*?image:\\s*([^\\n]+)`),
      );
      const portsMatch = [
        ...yaml.matchAll(
          new RegExp(`${svcName}:[\\s\\S]*?- "([0-9]+:[0-9]+)"`, "g"),
        ),
      ].map((m) => m[1]);
      return {
        name: svcName,
        image: imageMatch?.[1]?.trim() ?? "unknown",
        status: "stopped",
        replicas: 1,
        running: 0,
        ports: portsMatch,
        cpu: 0,
        memory: "0 MB",
        containerId: crypto.randomUUID().slice(0, 8),
      };
    });

    onAdd({
      id: `stack-${name.trim()}-${Date.now()}`,
      name: name.trim(),
      project: name.trim(),
      configPath: configPath.trim() || `~/${name.trim()}/docker-compose.yml`,
      status: "stopped",
      services:
        services.length > 0
          ? services
          : [
              {
                name: "app",
                image: "unknown",
                status: "stopped",
                replicas: 1,
                running: 0,
                ports: [],
                cpu: 0,
                memory: "0 MB",
                containerId: crypto.randomUUID().slice(0, 8),
              },
            ],
      created: new Date().toISOString().slice(0, 10),
      lastStarted: "never",
      networks: [],
      volumes: [],
    });
    onClose();
  }

  return (
    <Modal title="New Compose stack" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <ModalField
            label="Stack name *"
            description="Unique name for this stack"
          >
            <ModalInput
              value={name}
              onChange={(v) => {
                setName(v);
                setError("");
              }}
              placeholder="my-stack"
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
          <ModalField
            label="Config path"
            description="Path to docker-compose.yml"
          >
            <ModalInput
              value={configPath}
              onChange={setConfigPath}
              placeholder="~/project/docker-compose.yml"
              mono
            />
          </ModalField>
        </div>

        {/* Tabs */}
        <div
          className="flex"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {(["editor", "options"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-[11px] font-mono font-medium capitalize cursor-pointer border-none transition-all"
              style={{
                background: "none",
                color:
                  activeTab === tab ? "var(--accent)" : "var(--text-muted)",
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

        {activeTab === "editor" && (
          <div className="flex flex-col gap-1.5">
            <p
              className="text-[10px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              docker-compose.yml content — services will be parsed automatically
            </p>
            <textarea
              value={yaml}
              onChange={(e) => setYaml(e.target.value)}
              rows={14}
              className="w-full px-3 py-2.5 rounded text-[10px] font-mono leading-relaxed outline-none resize-none"
              style={{
                background: "var(--bg0)",
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
        )}

        {activeTab === "options" && (
          <div className="flex flex-col gap-3 py-2">
            <p
              className="text-[11px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              Additional options will be available in a future release. The
              stack will be created in stopped state — start it from the main
              view.
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
          className="flex gap-1 px-5 py-2 rounded text-[11px] font-semibold cursor-pointer transition-all"
          style={{
            background: "var(--accent)",
            color: "#000",
            border: "1px solid var(--accent)",
          }}
          onClick={handleCreate}
        >
          <Plus className="w-4 h-4" /> Create stack
        </button>
      </div>
    </Modal>
  );
}

// ─── OPEN FILE MODAL ──────────────────────────────────────────────────────────

export function OpenFileModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (s: ComposeStack) => void;
}) {
  const [path, setPath] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const recentFiles = [
    "~/Documents/Mke5/dockview/docker-compose.yml",
    "~/infra/monitoring/docker-compose.yml",
    "~/projects/worker/docker-compose.yml",
    "~/infra/traefik/docker-compose.yml",
  ];

  function handleOpen() {
    const filePath = path.trim();
    if (!filePath) {
      setError("File path is required.");
      return;
    }

    const inferredName =
      name.trim() ||
      filePath.split("/").slice(-2, -1)[0] ||
      filePath.split("/").pop()?.replace(".yml", "") ||
      "new-stack";

    onAdd({
      id: `stack-${inferredName}-${Date.now()}`,
      name: inferredName,
      project: inferredName,
      configPath: filePath,
      status: "stopped",
      services: [
        {
          name: "app",
          image: "unknown",
          status: "stopped",
          replicas: 1,
          running: 0,
          ports: [],
          cpu: 0,
          memory: "0 MB",
          containerId: crypto.randomUUID().slice(0, 8),
        },
      ],
      created: new Date().toISOString().slice(0, 10),
      lastStarted: "never",
      networks: [],
      volumes: [],
    });
    onClose();
  }

  return (
    <Modal title="Open compose file" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <ModalField
          label="File path"
          description="Full path to your docker-compose.yml"
        >
          <ModalInput
            value={path}
            onChange={(v) => {
              setPath(v);
              setError("");
            }}
            placeholder="~/project/docker-compose.yml"
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

        <ModalField
          label="Stack name"
          description="Optional — inferred from directory name if blank"
        >
          <ModalInput
            value={name}
            onChange={setName}
            placeholder="my-stack"
            mono
          />
        </ModalField>

        {/* Recent files */}
        <div>
          <p
            className="text-[9px] font-semibold uppercase tracking-widest font-mono mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            Recent files
          </p>
          <div className="flex flex-col gap-1">
            {recentFiles.map((f) => (
              <div
                key={f}
                className="flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer transition-all"
                style={{
                  background: path === f ? "var(--accent-dim)" : "var(--bg2)",
                  border: `1px solid ${path === f ? "rgba(0,212,255,0.25)" : "var(--border)"}`,
                }}
                onClick={() => {
                  setPath(f);
                  setName(f.split("/").slice(-2, -1)[0] || "");
                }}
              >
                <span
                  className="text-sm"
                  style={{
                    color: path === f ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  📄
                </span>
                <span
                  className="text-[10px] font-mono truncate"
                  style={{
                    color:
                      path === f ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {f}
                </span>
                {path === f && (
                  <span
                    className="text-[10px] shrink-0"
                    style={{ color: "var(--accent)" }}
                  >
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>
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
          className="flex gap-1 px-5 py-2 rounded text-[11px] font-semibold cursor-pointer transition-all"
          style={{
            background: "var(--accent)",
            color: "#000",
            border: "1px solid var(--accent)",
          }}
          onClick={handleOpen}
        >
          <FolderOpen className="w-4 h-4" /> Open file
        </button>
      </div>
    </Modal>
  );
}

// ─── PULL LATEST MODAL ────────────────────────────────────────────────────────

export function PullLatestModal({
  stack,
  onClose,
  onPull,
}: {
  stack: ComposeStack;
  onClose: () => void;
  onPull: () => void;
}) {
  const [pulling, setPulling] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  function handlePull() {
    setPulling(true);
    const init: Record<string, number> = {};
    stack.services.forEach((s) => {
      init[s.name] = 0;
    });
    setProgress(init);

    // Simulate pulling each service image
    const intervals: ReturnType<typeof setInterval>[] = [];
    let completedCount = 0;

    stack.services.forEach((svc) => {
      const speed = Math.random() * 12 + 4;
      const iv = setInterval(() => {
        setProgress((prev) => {
          const next = {
            ...prev,
            [svc.name]: Math.min((prev[svc.name] ?? 0) + speed, 100),
          };
          if (next[svc.name] >= 100) {
            clearInterval(iv);
            completedCount++;
            if (completedCount === stack.services.length) {
              setTimeout(() => {
                setDone(true);
                setPulling(false);
              }, 200);
            }
          }
          return next;
        });
      }, 160);
      intervals.push(iv);
    });
  }

  return (
    <Modal title={`Pull latest images — ${stack.name}`} onClose={onClose}>
      {!done ? (
        <div className="flex flex-col gap-4">
          <p
            className="text-xs font-mono"
            style={{ color: "var(--text-muted)" }}
          >
            This will pull the latest version of all {stack.services.length}{" "}
            service images from their registries.
          </p>

          <div className="flex flex-col gap-2">
            {stack.services.map((svc) => {
              const pct = progress[svc.name] ?? 0;
              return (
                <div
                  key={svc.name}
                  className="flex flex-col gap-1.5 p-3 rounded-lg"
                  style={{
                    background: "var(--bg2)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs font-semibold font-mono"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {svc.name}
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {svc.image}
                      </span>
                    </div>
                    {pulling && (
                      <span
                        className="text-[10px] font-mono"
                        style={{
                          color: pct >= 100 ? "var(--green)" : "var(--accent)",
                        }}
                      >
                        {pct >= 100 ? "✓ Done" : `${Math.round(pct)}%`}
                      </span>
                    )}
                  </div>
                  {pulling && (
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: "var(--bg4)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct >= 100 ? "var(--green)" : "var(--accent)",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

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
                background: pulling ? "var(--bg4)" : "var(--accent)",
                color: pulling ? "var(--text-muted)" : "#000",
                border: "1px solid transparent",
                cursor: pulling ? "not-allowed" : "pointer",
              }}
              disabled={pulling}
              onClick={handlePull}
            >
              {pulling ? "⟳ Pulling…" : "⬆ Pull all images"}
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
              All images up to date
            </p>
            <p
              className="text-xs font-mono mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              {stack.services.length} images pulled for {stack.name}
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
              onClick={() => {
                onPull();
                onClose();
              }}
            >
              ↺ Restart with new images
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
