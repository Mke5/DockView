import React, { useEffect } from 'react';
import { X } from 'lucide-react';

// ─── Modal ────────────────────────────────────────────────────────────────────

export function Modal({
  title,
  onClose,
  children,
  width = 480,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-box"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="btn-icon" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label className="field-label">{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && (
        <span className="field-hint" style={{ color: 'var(--red)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

export function Toggle({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="toggle-wrap" onClick={() => onChange(!value)}>
      <div>
        <div style={{ fontSize: 12.5, color: 'var(--text-0)' }}>{label}</div>
        {hint && <div className="field-hint">{hint}</div>}
      </div>
      <div className={`toggle ${value ? 'on' : ''}`} />
    </div>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const pulse =
    status === 'running' || status === 'building' || status === 'checking';
  return (
    <span className={`badge badge-${status}`}>
      <span className={`badge-dot ${pulse ? 'pulse' : ''}`} />
      {status}
    </span>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

export function ProgressBar({
  value,
  color,
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="progress-track" style={{ flex: 1 }}>
      <div
        className="progress-fill"
        style={{ width: `${value}%`, background: color }}
      />
    </div>
  );
}

// ─── Dropdown primitives ──────────────────────────────────────────────────────

export function DropdownMenu({
  right,
  children,
}: {
  right?: boolean;
  children: React.ReactNode;
}) {
  return <div className={`dropdown ${right ? 'right' : ''}`}>{children}</div>;
}

export function DropdownHeader({ children }: { children: React.ReactNode }) {
  return <div className="dropdown-header">{children}</div>;
}

export function DropdownItem({
  children,
  active,
  onClick,
  suffix,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  suffix?: React.ReactNode;
}) {
  return (
    <button
      className={`dropdown-item ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      <span style={{ flex: 1 }}>{children}</span>
      {suffix && (
        <span style={{ color: 'var(--text-2)', marginLeft: 'auto' }}>
          {suffix}
        </span>
      )}
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

export function ViewHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="section-header"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div style={{ flex: 1 }}>
        <div className="section-title">{title}</div>
        {subtitle && <div className="section-sub">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ─── Detail KV row ────────────────────────────────────────────────────────────

export function KVRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <>
      <span className="detail-k">{label}</span>
      <span className="detail-v">{value}</span>
    </>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      className="spin"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
