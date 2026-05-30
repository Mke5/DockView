import React, { useEffect, useRef, useState } from 'react';
import { Bell, Search, Settings, X } from 'lucide-react';
import { useAppStore } from '../../store';

export default function Titlebar() {
  const { engineRunning, searchQuery, setSearchQuery, setActiveView } =
    useAppStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([
    {
      id: 1,
      type: 'warn',
      text: '1 container exited unexpectedly',
      time: '2m ago',
      read: false,
    },
    {
      id: 2,
      type: 'info',
      text: 'postgres-db backup completed',
      time: '14m ago',
      read: false,
    },
    {
      id: 3,
      type: 'success',
      text: 'nginx:alpine pulled successfully',
      time: '1h ago',
      read: true,
    },
    {
      id: 4,
      type: 'error',
      text: 'Build failed — see logs',
      time: '2h ago',
      read: true,
    },
  ]);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setShowNotifs(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function markAllRead() {
    setNotifs((p) => p.map((n) => ({ ...n, read: true })));
  }

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
                  onClick={() => setNotifs([])}
                >
                  Clear all
                </button>
              </div>
              {notifs.length === 0 ? (
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
                notifs.map((n) => (
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
                        {n.time}
                      </div>
                    </div>
                    <button
                      className="btn-icon"
                      style={{ width: 18, height: 18, flexShrink: 0 }}
                      onClick={() =>
                        setNotifs((p) => p.filter((x) => x.id !== n.id))
                      }
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
