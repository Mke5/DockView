import {
  Archive,
  Box,
  Database,
  FileText,
  Hammer,
  ImageIcon,
  Layers,
  Settings,
  Share2,
  Terminal,
} from "lucide-react";
import {
  useAppStore,
  useContainerStore,
  useImageStore,
  useVolumeStore,
  useNetworkStore,
  useComposeStore,
  useBuildStore,
  ViewSection,
} from "../store/";
import React from "react";
import { Divider } from "./SideBarComponents/Divider";
import { ResourceBar } from "./SideBarComponents/ResourceBar";
import { NavBtn } from "./SideBarComponents/NavItem";

export default function Sidebar() {
  const { activeView, setActiveView, resources } = useAppStore();

  // Live counts for badges
  const containers = useContainerStore((s) => s.containers);
  const images = useImageStore((s) => s.images);
  const volumes = useVolumeStore((s) => s.volumes);
  const networks = useNetworkStore((s) => s.networks);
  const stacks = useComposeStore((s) => s.stacks);
  const builds = useBuildStore((s) => s.builds);

  const runningContainers = containers.filter(
    (c) => c.status === "running",
  ).length;
  const partialStacks = stacks.filter(
    (s) => s.status === "partial" || s.status === "degraded",
  ).length;
  const buildingBuilds = builds.filter((b) => b.status === "building").length;
  const failedBuilds = builds.filter((b) => b.status === "failed").length;

  type BadgeType = "running" | "count" | "warn";
  interface NavItem {
    id: ViewSection;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeType?: BadgeType;
  }

  const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
    {
      label: "Docker",
      items: [
        {
          id: "containers",
          label: "Containers",
          icon: <Box size={16} />,
          badge:
            runningContainers > 0
              ? `${runningContainers} up`
              : String(containers.length),
          badgeType: runningContainers > 0 ? "running" : "count",
        },
        {
          id: "images",
          label: "Images",
          icon: <ImageIcon size={16} />,
          badge: String(images.length),
          badgeType: "count",
        },
        {
          id: "volumes",
          label: "Volumes",
          icon: <Database size={16} />,
          badge: String(volumes.length),
          badgeType: "count",
        },
        {
          id: "networks",
          label: "Networks",
          icon: <Share2 size={16} />,
          badge: String(networks.filter((n) => !n.isDefault).length),
          badgeType: "count",
        },
      ],
    },
    {
      label: "Dev Env",
      items: [
        {
          id: "compose",
          label: "Compose",
          icon: <Layers size={16} />,
          badge:
            partialStacks > 0
              ? `${partialStacks} partial`
              : String(stacks.length),
          badgeType: partialStacks > 0 ? "warn" : "count",
        },
        {
          id: "builds",
          label: "Builds",
          icon: <Hammer size={16} />,
          badge:
            buildingBuilds > 0
              ? `${buildingBuilds} building`
              : failedBuilds > 0
                ? `${failedBuilds} failed`
                : String(builds.length),
          badgeType:
            buildingBuilds > 0
              ? "running"
              : failedBuilds > 0
                ? "warn"
                : "count",
        },
        { id: "registry", label: "Registry", icon: <Archive size={16} /> },
      ],
    },
    {
      label: "System",
      items: [
        { id: "logs", label: "Logs", icon: <FileText size={16} /> },
        { id: "terminal", label: "Terminal", icon: <Terminal size={16} /> },
        { id: "settings", label: "Settings", icon: <Settings size={16} /> },
      ],
    },
  ];

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{
        width: "var(--sidebar-w)",
        background: "var(--bg1)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-2">
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label}>
            {si > 0 && <Divider />}
            <div className="px-2.5 pt-4 pb-1">
              <p
                className="text-[10px] font-semibold uppercase tracking-widest font-mono px-1.5 mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {section.label}
              </p>
              {section.items.map((item) => (
                <NavBtn
                  key={item.id}
                  item={item}
                  active={activeView === item.id}
                  onClick={() => setActiveView(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        className="shrink-0 p-2.5"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <ResourceBar
          label="CPU"
          value={`${resources.cpu}%`}
          fill={resources.cpu}
          color="var(--accent)"
        />
        <ResourceBar
          label="Memory"
          value={`${resources.memUsed} / ${resources.memTotal} GB`}
          fill={(resources.memUsed / resources.memTotal) * 100}
          color="var(--purple)"
        />
        <ResourceBar
          label="Disk"
          value={`${resources.disk} GB`}
          fill={22}
          color="var(--amber)"
        />

        <Divider />

        {/* User card */}
        <div
          className="flex items-center gap-2 p-1.5 rounded cursor-pointer transition-all duration-100"
          style={{ color: "var(--text-primary)" }}
          onClick={() => setActiveView("settings")}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg3)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
            style={{
              background: "linear-gradient(135deg, #7c3aed, var(--accent))",
              color: "#fff",
            }}
          >
            MK
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[11px] font-medium truncate"
              style={{ color: "var(--text-primary)" }}
            >
              mke5
            </div>
            <div
              className="text-[9px] font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              Docker Hub · Free
            </div>
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            ⋯
          </span>
        </div>
      </div>
    </div>
  );
}
