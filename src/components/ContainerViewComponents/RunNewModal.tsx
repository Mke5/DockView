import { Play } from "lucide-react";
import { Container } from "../../store";
import { useState } from "react";
import { Modal, ModalField, ModalInput, ModalToggleRow } from "../Modal";

export function RunNewModal({
  onClose,
  onRun,
}: {
  onClose: () => void;
  onRun: (c: Container) => void;
}) {
  const [image, setImage] = useState("");
  const [name, setName] = useState("");
  const [ports, setPorts] = useState("");
  const [envVars, setEnvVars] = useState("");
  const [cmd, setCmd] = useState("");
  const [detach, setDetach] = useState(true);
  const [autoRemove, setAutoRemove] = useState(false);
  const [restart, setRestart] = useState<
    "no" | "always" | "on-failure" | "unless-stopped"
  >("no");
  const [error, setError] = useState("");

  function handleRun() {
    if (!image.trim()) {
      setError("Image name is required.");
      return;
    }
    const container: Container = {
      id: crypto.randomUUID(),
      shortId: crypto.randomUUID().slice(0, 8),
      name:
        name.trim() ||
        `${image.split(":")[0].split("/").pop()}-${Math.floor(Math.random() * 1000)}`,
      image: image.trim(),
      status: "running",
      ports: ports
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean),
      cpu: 0,
      memory: "0 MB",
      uptime: "just now",
      created: new Date().toISOString().slice(0, 10),
    };
    onRun(container);
    onClose();
  }

  const cmdPreview = [
    "docker run",
    detach && "-d",
    autoRemove && "--rm",
    restart !== "no" && `--restart ${restart}`,
    name.trim() && `--name ${name.trim()}`,
    ...ports
      .split(",")
      .filter(Boolean)
      .map((p) => `-p ${p.trim()}`),
    ...envVars
      .split("\n")
      .filter(Boolean)
      .map((e) => `-e ${e.trim()}`),
    image || "<image>",
    cmd,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Modal title="Run a new container" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <ModalField
          label="Image *"
          description="Image name and optional tag (e.g. nginx:alpine)"
        >
          <ModalInput
            value={image}
            onChange={(v) => {
              setImage(v);
              setError("");
            }}
            placeholder="nginx:alpine"
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
          label="Container name"
          description="Optional — auto-generated if left blank"
        >
          <ModalInput
            value={name}
            onChange={setName}
            placeholder="my-container"
            mono
          />
        </ModalField>

        <ModalField
          label="Port mappings"
          description="Comma-separated host:container pairs (e.g. 8080:80, 5432:5432)"
        >
          <ModalInput
            value={ports}
            onChange={setPorts}
            placeholder="8080:80, 443:443"
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
            rows={3}
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
          description="Override the default CMD (leave blank to use image default)"
        >
          <ModalInput
            value={cmd}
            onChange={setCmd}
            placeholder="/bin/sh"
            mono
          />
        </ModalField>

        {/* Options grid */}
        <div
          className="grid grid-cols-2 gap-3 p-3 rounded-lg"
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
          }}
        >
          <ModalToggleRow
            label="Run detached"
            description="Run in background (-d)"
            value={detach}
            onChange={setDetach}
          />
          <ModalToggleRow
            label="Auto-remove"
            description="Delete on stop (--rm)"
            value={autoRemove}
            onChange={setAutoRemove}
          />
          <div
            className="col-span-2 pt-1"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p
              className="text-[10px] font-mono mb-2 mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Restart policy
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {(["no", "always", "on-failure", "unless-stopped"] as const).map(
                (r) => (
                  <button
                    key={r}
                    className="px-2.5 py-1 rounded text-[10px] font-mono cursor-pointer border transition-all"
                    style={{
                      background:
                        restart === r ? "var(--accent-dim)" : "var(--bg3)",
                      borderColor:
                        restart === r ? "rgba(0,212,255,0.3)" : "var(--border)",
                      color:
                        restart === r ? "var(--accent)" : "var(--text-muted)",
                    }}
                    onClick={() => setRestart(r)}
                  >
                    {r}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Command preview */}
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
            {cmdPreview}
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
          onClick={handleRun}
        >
          <Play className="w-4 h-4 mr-1 inline" />
          Run container
        </button>
      </div>
    </Modal>
  );
}
