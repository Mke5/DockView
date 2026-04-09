import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../store/";
import { Bell, X, Settings, Search } from "lucide-react";

export default function Titlebar() {
  const {
    engineRunning,
    setEngineRunning,
    searchQuery,
    setSearchQuery,
    setActiveView,
  } = useAppStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "warn",
      text: "1 container exited unexpectedly",
      time: "2m ago",
      read: false,
    },
    {
      id: 2,
      type: "info",
      text: "postgres-db backup completed",
      time: "14m ago",
      read: false,
    },
    {
      id: 3,
      type: "success",
      text: "nginx:alpine pulled successfully",
      time: "1h ago",
      read: true,
    },
    {
      id: 4,
      type: "error",
      text: "Build bld-003 failed — see logs",
      time: "2h ago",
      read: true,
    },
  ]);

  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function dismissNotification(id: number) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const NOTIF_COLORS: Record<string, string> = {
    warn: "var(--amber)",
    error: "var(--red)",
    info: "var(--accent)",
    success: "var(--green)",
  };

  return (
    <div
      className="flex items-center h-9 md:h-10 lg:h-12 shrink-0"
      style={
        {
          background: "rgba(20,20,20,0.6)",
          // backdropFilter: "blur(10px)",
          borderBottom: "1px solid var(--border)",
          WebkitAppRegion: "drag",
        } as React.CSSProperties
      }
    >
      <div className="flex items-center w-full max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-2 md:px-3.5 h-full shrink-0"
          style={
            {
              borderRight: "1px solid var(--border)",
              WebkitAppRegion: "no-drag",
            } as React.CSSProperties
          }
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold font-mono"
            style={{
              background: "linear-gradient(135deg, var(--accent), #0088ff)",
              color: "#000",
            }}
          >
            DV
          </div>

          <div className="hidden sm:block">
            <div className="font-mono text-[10px] md:text-xs font-semibold tracking-wider text-[var(--text-primary)]">
              dockview
            </div>
            <div className="font-mono text-[8px] md:text-[9px] text-[var(--text-muted)]">
              v0.1.0
            </div>
          </div>
        </div>

        {/* Search */}
        <div
          className="flex-1 flex items-center px-4 max-w-sm mx-auto"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <div
            className="flex items-center gap-2 w-full h-[26px] px-2.5 rounded transition-all duration-150"
            style={{
              background: "var(--bg3)",
              border: "1px solid var(--border)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "0 0 0 2px var(--accent-dim)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <span
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search containers, images…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[11px] font-mono"
              style={{ color: "var(--text-primary)" }}
            />
            {searchQuery ? (
              <button
                className="text-[10px] cursor-pointer border-none bg-transparent shrink-0"
                style={{ color: "var(--text-muted)" }}
                onClick={() => setSearchQuery("")}
              >
                <X size={14} />
              </button>
            ) : (
              <span
                className="shrink-0 text-[9px] font-mono px-1 py-0.5 rounded"
                style={{
                  background: "var(--bg4)",
                  border: "1px solid var(--border-lit)",
                  color: "var(--text-muted)",
                }}
              >
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Right side */}
        <div
          className="flex items-center gap-0.5 md:gap-1 px-2 md:px-3 ml-auto"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          {/* Engine toggle */}
          <button
            title={
              engineRunning
                ? "Engine running — click to stop"
                : "Engine stopped — click to start"
            }
            className="flex items-center gap-1.5 px-2.5 py-1 rounded mr-1 cursor-pointer border transition-all duration-200"
            style={{
              background: engineRunning ? "var(--green-dim)" : "var(--red-dim)",
              borderColor: engineRunning
                ? "rgba(0,230,118,0.2)"
                : "rgba(255,82,82,0.2)",
            }}
            onClick={() => setEngineRunning(!engineRunning)}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0`}
              style={{
                background: engineRunning ? "var(--green)" : "var(--red)",
                boxShadow: engineRunning ? "0 0 6px var(--green)" : "none",
                animation: engineRunning ? "pulseGreen 2s infinite" : "none",
              }}
            />
            <span
              className="text-[10px] font-mono font-medium"
              style={{ color: engineRunning ? "var(--green)" : "var(--red)" }}
            >
              {engineRunning ? "Engine running" : "Engine stopped"}
            </span>
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              title="Notifications"
              className="relative w-7 h-7 rounded flex items-center justify-center text-sm cursor-pointer transition-all duration-150 border-none"
              style={{
                background: showNotifications ? "var(--bg3)" : "none",
                color: "var(--text-secondary)",
              }}
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAllRead();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg3)";
                e.currentTarget.style.color = "var(--text-primary)";
              }}
              onMouseLeave={(e) => {
                if (!showNotifications) {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              <Bell size={16} />
              {unread > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold"
                  style={{ background: "var(--red)", color: "#fff" }}
                >
                  {unread}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute top-full right-0 mt-1 z-50 rounded-xl overflow-hidden"
                style={{
                  width: "300px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border-lit)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Notifications
                  </span>
                  <button
                    className="text-[10px] font-mono cursor-pointer border-none bg-transparent"
                    style={{ color: "var(--text-muted)" }}
                    onClick={() => setNotifications([])}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    Clear all
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <span
                      className="text-lg"
                      style={{ color: "var(--text-muted)" }}
                    >
                      <Bell size={16} />
                    </span>
                    <p
                      className="text-xs font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      No notifications
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 px-4 py-3 group transition-all"
                        style={{
                          background: n.read
                            ? "transparent"
                            : "rgba(255,255,255,0.02)",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                          style={{
                            background: n.read
                              ? "transparent"
                              : NOTIF_COLORS[n.type],
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[11px] leading-snug"
                            style={{
                              color: n.read
                                ? "var(--text-muted)"
                                : "var(--text-secondary)",
                            }}
                          >
                            {n.text}
                          </p>
                          <p
                            className="text-[9px] font-mono mt-0.5"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {n.time}
                          </p>
                        </div>
                        <button
                          className="text-[15px] cursor-pointer border-none bg-transparent opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          style={{ color: "var(--text-muted)" }}
                          onClick={() => dismissNotification(n.id)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "var(--red)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "var(--text-muted)";
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <TitlebarIconBtn onClick={() => setActiveView("settings")}>
            <Settings size={16} />
          </TitlebarIconBtn>
        </div>
      </div>
    </div>
  );
}

function TitlebarIconBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded hover:bg-[var(--bg3)]"
    >
      {children}
    </button>
  );
}
