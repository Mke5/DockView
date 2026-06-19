import React from 'react';
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
} from 'lucide-react';
import {
  useAppStore,
  useContainerStore,
  useImageStore,
  useVolumeStore,
  useNetworkStore,
  useComposeStore,
  useBuildStore,
  ViewSection,
} from '../../store';
import { useResizeX } from '../shared/useResize';

const NAV_SECTIONS = [
  {
    label: 'Resources',
    items: [
      { id: 'containers' as ViewSection, label: 'Containers', icon: Box },
      { id: 'images' as ViewSection, label: 'Images', icon: ImageIcon },
      { id: 'volumes' as ViewSection, label: 'Volumes', icon: Database },
      { id: 'networks' as ViewSection, label: 'Networks', icon: Share2 },
    ],
  },
  {
    label: 'Dev',
    items: [
      { id: 'compose' as ViewSection, label: 'Compose', icon: Layers },
      { id: 'builds' as ViewSection, label: 'Builds', icon: Hammer },
      { id: 'registry' as ViewSection, label: 'Registry', icon: Archive },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'logs' as ViewSection, label: 'Logs', icon: FileText },
      { id: 'terminal' as ViewSection, label: 'Terminal', icon: Terminal },
      { id: 'settings' as ViewSection, label: 'Settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const { activeView, setActiveView, resources } = useAppStore();
  const containers = useContainerStore((s) => s.containers);
  const images = useImageStore((s) => s.images);
  const volumes = useVolumeStore((s) => s.volumes);
  const networks = useNetworkStore((s) => s.networks);
  const stacks = useComposeStore((s) => s.stacks);
  const builds = useBuildStore((s) => s.builds);

  const { width, handleRef, onMouseDown } = useResizeX(210, 160, 300);

  const runningContainers = containers.filter(
    (c) => c.status === 'running'
  ).length;
  const failedBuilds = builds.filter((b) => b.status === 'failed').length;
  const buildingBuilds = builds.filter((b) => b.status === 'building').length;

  function getBadge(id: ViewSection): { text: string; color?: string } | null {
    switch (id) {
      case 'containers':
        return runningContainers > 0
          ? { text: `${runningContainers}`, color: 'var(--green)' }
          : containers.length > 0
            ? { text: `${containers.length}` }
            : null;
      case 'images':
        return images.length > 0 ? { text: `${images.length}` } : null;
      case 'volumes':
        return volumes.length > 0 ? { text: `${volumes.length}` } : null;
      case 'networks':
        return networks.filter((n) => !n.isDefault).length > 0
          ? { text: `${networks.filter((n) => !n.isDefault).length}` }
          : null;
      case 'compose':
        return stacks.length > 0 ? { text: `${stacks.length}` } : null;
      case 'builds':
        if (buildingBuilds > 0)
          return { text: `${buildingBuilds}`, color: 'var(--blue)' };
        if (failedBuilds > 0)
          return { text: `${failedBuilds}`, color: 'var(--red)' };
        return builds.length > 0 ? { text: `${builds.length}` } : null;
      default:
        return null;
    }
  }

  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      <div
        style={{
          width,
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg1)',
          borderRight: '1px solid var(--border)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {/* Navigation */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 0' }}>
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label} style={{ marginBottom: 4 }}>
              {si > 0 && (
                <div
                  style={{
                    height: 1,
                    background: 'var(--border)',
                    margin: '6px 4px',
                  }}
                />
              )}
              <div
                className="mono"
                style={{
                  fontSize: 9.5,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-2)',
                  padding: '6px 8px 4px',
                }}
              >
                {section.label}
              </div>
              {section.items.map((item) => {
                const active = activeView === item.id;
                const badge = getBadge(item.id);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`nav-item ${active ? 'active' : ''}`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <Icon size={14} style={{ flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12.5 }}>
                      {item.label}
                    </span>
                    {badge && (
                      <span
                        className="mono"
                        style={{
                          fontSize: 9.5,
                          color: badge.color ?? 'var(--text-2)',
                          background: 'var(--bg4)',
                          borderRadius: 3,
                          padding: '1px 5px',
                        }}
                      >
                        {badge.text}
                      </span>
                    )}
                    {active && <div className="nav-dot" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Keyboard shortcuts hint */}
        <div
          style={{
            padding: '6px 12px 8px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <ShortcutBadge keys="Ctrl+K" label="Search" />
          <ShortcutBadge keys="Ctrl+/" label="Cycle view" />
        </div>

        {/* Footer: resource bars + user */}
        <div
          style={{
            padding: '10px 10px 8px',
            borderTop: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <ResourceBar
            label="CPU"
            value={resources.cpu}
            color="var(--blue)"
            unit="%"
          />
          <ResourceBar
            label="MEM"
            value={(resources.memUsed / resources.memTotal) * 100}
            color="var(--purple)"
            unit={`${resources.memUsed}/${resources.memTotal}G`}
          />
          <ResourceBar
            label="DISK"
            value={22}
            color="var(--amber)"
            unit={`${resources.disk}G`}
          />

          <div
            style={{ height: 1, background: 'var(--border)', margin: '8px 0' }}
          />

          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderRadius: 4,
              padding: '6px 4px',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onClick={() => setActiveView('settings')}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--bg3)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background:
                  'linear-gradient(135deg, var(--blue), var(--purple))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span
                className="mono"
                style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}
              >
                MK
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  color: 'var(--text-0)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                mke5
              </div>
              <div
                className="mono"
                style={{ fontSize: 9, color: 'var(--text-2)' }}
              >
                Docker Hub · Free
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Resize handle */}
      <div
        ref={handleRef}
        className="resize-handle"
        onMouseDown={onMouseDown}
      />
    </div>
  );
}

function ShortcutBadge({ keys, label }: { keys: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 9.5,
        color: 'var(--text-3)',
      }}
    >
      <kbd
        className="mono"
        style={{
          fontSize: 8.5,
          background: 'var(--bg4)',
          border: '1px solid var(--border)',
          borderRadius: 3,
          padding: '1px 4px',
          color: 'var(--text-2)',
        }}
      >
        {keys}
      </kbd>
      <span>{label}</span>
    </div>
  );
}

function ResourceBar({
  label,
  value,
  color,
  unit,
}: {
  label: string;
  value: number;
  color: string;
  unit: string;
}) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 3,
        }}
      >
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--text-2)',
            letterSpacing: '0.06em',
          }}
        >
          {label}
        </span>
        <span className="mono" style={{ fontSize: 10, color: 'var(--text-2)' }}>
          {unit}
        </span>
      </div>
      <div className="res-bar-track">
        <div
          className="progress-fill"
          style={{ width: `${Math.min(100, value)}%`, background: color }}
        />
      </div>
    </div>
  );
}
