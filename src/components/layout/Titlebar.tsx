import React, { useEffect, useRef, useState } from 'react';
import { Bell, Search, Settings, X } from 'lucide-react';
import { useAppStore, useNotificationStore } from '../../store';
import { onDockerEvent } from '../../backend/docker';
import { isTauri } from '../../backend/utils';
import type { AppNotification } from '../../store/notificationStore';

function formatRelative(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function notificationForEvent(event: {
  eventType: string;
  action: string;
  actorName: string;
}): { type: AppNotification['type']; text: string } | null {
  const { eventType, action, actorName } = event;
  const name = actorName || 'unknown';

  if (eventType === 'container') {
    switch (action) {
      case 'start':
        return { type: 'success', text: `Container "${name}" started` };
      case 'die':
        return { type: 'error', text: `Container "${name}" stopped` };
      case 'kill':
        return { type: 'warn', text: `Container "${name}" killed` };
      case 'stop':
        return { type: 'warn', text: `Container "${name}" stopped` };
      case 'pause':
        return { type: 'warn', text: `Container "${name}" paused` };
      case 'unpause':
        return { type: 'success', text: `Container "${name}" unpaused` };
      case 'restart':
        return { type: 'warn', text: `Container "${name}" restarted` };
      case 'create':
        return { type: 'info', text: `Container "${name}" created` };
      case 'destroy':
        return { type: 'warn', text: `Container "${name}" removed` };
      case 'rename':
        return { type: 'info', text: `Container renamed to "${name}"` };
    }
  } else if (eventType === 'image') {
    switch (action) {
      case 'pull':
        return { type: 'success', text: `Pulled image "${name}"` };
      case 'delete':
        return { type: 'info', text: `Deleted image "${name}"` };
      case 'tag':
        return { type: 'info', text: `Tagged image "${name}"` };
      case 'untag':
        return { type: 'info', text: `Untagged image "${name}"` };
      case 'prune':
        return { type: 'warn', text: 'Pruned unused images' };
    }
  } else if (eventType === 'volume') {
    switch (action) {
      case 'create':
        return { type: 'info', text: `Created volume "${name}"` };
      case 'destroy':
        return { type: 'warn', text: `Removed volume "${name}"` };
    }
  } else if (eventType === 'network') {
    switch (action) {
      case 'create':
        return { type: 'info', text: `Created network "${name}"` };
      case 'destroy':
        return { type: 'warn', text: `Removed network "${name}"` };
    }
  }
  return null;
}

export default function Titlebar() {
  const { engineRunning, searchQuery, setSearchQuery, setActiveView } =
    useAppStore();
  const { notifications, add, remove, clearAll, markAllRead } =
    useNotificationStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!isTauri()) return;
    let unlisten: (() => void) | null = null;
    void onDockerEvent((event) => {
      const n = notificationForEvent(event);
      if (n) add(n.type, n.text);
    }).then((u) => {
      unlisten = u;
    });
    return () => {
      unlisten?.();
    };
  }, [add]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifs(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const NOTIF_COLOR: Record<string, string> = {
    warn: 'var(--amber)',
    error: 'var(--red)',
    info: 'var(--blue)',
    success: 'var(--green)',
  };

  return (
    <div
      style={
        {
          height: 'var(--topbar-h)',
          background: 'var(--bg1)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          WebkitAppRegion: 'drag',
        } as React.CSSProperties
      }
    >
      {/* Logo */}
      <div
        style={
          {
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
            height: '100%',
            borderRight: '1px solid var(--border)',
            WebkitAppRegion: 'no-drag',
            flexShrink: 0,
          } as React.CSSProperties
        }
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: 'var(--blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth={2.5}
          >
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-4 0v2" />
            <line x1="12" y1="12" x2="12" y2="16" />
            <line x1="10" y1="14" x2="14" y2="14" />
          </svg>
        </div>
        <div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-0)',
              letterSpacing: '0.05em',
            }}
          >
            dock
          </div>
          <div className="mono" style={{ fontSize: 9, color: 'var(--text-2)' }}>
            v0.1.0
          </div>
        </div>
      </div>

      {/* Search */}
      <div
        style={
          {
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            maxWidth: 360,
            margin: '0 auto',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties
        }
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            width: '100%',
            height: 26,
            padding: '0 10px',
            borderRadius: 4,
            background: 'var(--bg3)',
            border: '1px solid var(--border-md)',
          }}
        >
          <Search size={12} color="var(--text-2)" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search containers, images…"
            className="mono"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 11.5,
              color: 'var(--text-0)',
            }}
          />
          {searchQuery ? (
            <button
              className="btn-icon"
              style={{ width: 16, height: 16 }}
              onClick={() => setSearchQuery('')}
            >
              <X size={10} />
            </button>
          ) : (
            <span
              className="mono"
              style={{
                fontSize: 9,
                color: 'var(--text-2)',
                background: 'var(--bg4)',
                border: '1px solid var(--border-md)',
                borderRadius: 3,
                padding: '1px 4px',
              }}
            >
              ⌘K
            </span>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div
        style={
          {
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '0 12px',
            marginLeft: 'auto',
            WebkitAppRegion: 'no-drag',
          } as React.CSSProperties
        }
      >
        {/* Engine status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 4,
            background: engineRunning ? 'var(--green-dim)' : 'var(--red-dim)',
            border: `1px solid ${engineRunning ? 'rgba(61,214,140,0.2)' : 'rgba(242,95,92,0.2)'}`,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: engineRunning ? 'var(--green)' : 'var(--red)',
              boxShadow: engineRunning ? '0 0 6px var(--green)' : 'none',
            }}
          />
          <span
            className="mono"
            style={{
              fontSize: 10.5,
              color: engineRunning ? 'var(--green)' : 'var(--red)',
              fontWeight: 500,
            }}
          >
            {engineRunning ? 'running' : 'stopped'}
          </span>
        </div>

        {/* Notifications */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="btn-icon"
            style={{ position: 'relative' }}
            onClick={() => {
              setShowNotifs((v) => !v);
              markAllRead();
            }}
          >
            <Bell size={14} />
            {unread > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  background: 'var(--red)',
                  color: '#fff',
                  fontSize: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {unread}
              </span>
            )}
          </button>
          {showNotifs && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 290,
                background: 'var(--bg3)',
                border: '1px solid var(--border-hi)',
                borderRadius: 6,
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                zIndex: 200,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: 'var(--text-0)',
                  }}
                >
                  Notifications
                </span>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 11 }}
                  onClick={clearAll}
                >
                  Clear all
                </button>
              </div>
              {notifications.length === 0 ? (
                <div
                  style={{
                    padding: '24px 0',
                    textAlign: 'center',
                    color: 'var(--text-2)',
                    fontSize: 11,
                  }}
                >
                  No notifications
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: n.read
                          ? 'transparent'
                          : NOTIF_COLOR[n.type],
                        marginTop: 4,
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: n.read ? 'var(--text-2)' : 'var(--text-1)',
                        }}
                      >
                        {n.text}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: 10,
                          color: 'var(--text-2)',
                          marginTop: 2,
                        }}
                      >
                        {formatRelative(n.ts)}
                      </div>
                    </div>
                    <button
                      className="btn-icon"
                      style={{ width: 18, height: 18, flexShrink: 0 }}
                      onClick={() => remove(n.id)}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button className="btn-icon" onClick={() => setActiveView('settings')}>
          <Settings size={14} />
        </button>
      </div>
    </div>
  );
}
