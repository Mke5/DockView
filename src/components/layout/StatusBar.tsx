import { useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { dockerSystemInfo } from '../../backend/docker';
import { isTauri } from '../../backend/utils';

export default function StatusBar() {
  const { engineRunning } = useAppStore();
  const [serverVersion, setServerVersion] = useState('—');
  const [apiVersion, setApiVersion] = useState('v1.46');

  useEffect(() => {
    if (!isTauri() || !engineRunning) return;
    dockerSystemInfo()
      .then((i) => {
        setServerVersion(i.serverVersion || i.dockerVersion || '—');
        setApiVersion(i.apiVersion || 'v1.46');
      })
      .catch(() => {});
  }, [engineRunning]);

  return (
    <div
      style={{
        height: 'var(--statusbar-h)',
        background: 'var(--bg1)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 14px',
        flexShrink: 0,
      }}
    >
      <StatusItem>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: engineRunning ? 'var(--green)' : 'var(--red)',
            display: 'inline-block',
            marginRight: 4,
          }}
        />
        Engine {engineRunning ? 'running' : 'stopped'}
      </StatusItem>
      <StatusItem label="Context">default</StatusItem>
      <StatusItem label="API">{apiVersion}</StatusItem>
      {serverVersion !== '—' && (
        <StatusItem label="Docker">{serverVersion}</StatusItem>
      )}
      <div style={{ marginLeft: 'auto' }}>
        <StatusItem label="Runtime">runc</StatusItem>
      </div>
    </div>
  );
}

function StatusItem({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 10.5,
        color: 'var(--text-2)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {label && (
        <span style={{ color: 'var(--text-2)', marginRight: 4 }}>{label}:</span>
      )}
      <span style={{ color: 'var(--text-1)' }}>{children}</span>
    </span>
  );
}
