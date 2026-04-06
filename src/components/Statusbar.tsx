import { useEffect, useState } from "react";
import { useAppStore } from "../store/";
import { dockerSystemInfo } from "../backend/docker";
import { isTauri } from "../backend/utils";

interface LiveInfo {
  apiVersion: string;
  serverVersion: string;
  context: string;
  runtime: string;
}

export default function StatusBar() {
  const { engineRunning } = useAppStore();
  const [info, setInfo] = useState<LiveInfo>({
    apiVersion: "v1.46",
    serverVersion: "—",
    context: "default",
    runtime: "runc",
  });

  useEffect(() => {
    if (!isTauri() || !engineRunning) return;
    dockerSystemInfo()
      .then((i) =>
        setInfo({
          apiVersion: i.apiVersion || "v1.46",
          serverVersion: i.serverVersion || i.dockerVersion,
          context: "default",
          runtime: "runc",
        }),
      )
      .catch(() => {});
  }, [engineRunning]);

  return (
    <div
      className="flex items-center gap-4 px-4 shrink-0"
      style={{
        height: "30px",
        background: "var(--bg1)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <StatusItem color={engineRunning ? "var(--green)" : "var(--red)"}>
        ● Engine
      </StatusItem>
      <StatusItem>
        <Muted>Context:</Muted> {info.context}
      </StatusItem>
      <StatusItem>
        <Muted>API:</Muted> {info.apiVersion}
      </StatusItem>
      <StatusItem>
        <Muted>Runtime:</Muted> {info.runtime}
      </StatusItem>
      {info.serverVersion && info.serverVersion !== "—" && (
        <StatusItem>
          <Muted>Docker:</Muted> {info.serverVersion}
        </StatusItem>
      )}
      <div className="ml-auto">
        <StatusItem>
          <Muted>Last sync:</Muted> just now
        </StatusItem>
      </div>
    </div>
  );
}

function StatusItem({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      className="flex items-center gap-1 text-[12px] font-mono"
      style={{ color: color ?? "var(--text-muted)" }}
    >
      {children}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--text-muted)" }}>{children}</span>;
}
