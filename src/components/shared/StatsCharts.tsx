import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { StatsPoint } from '../../hooks/useStatsHistory';

function formatBytes(b: number): string {
  if (b >= 1_000_000_000) return `${(b / 1_000_000_000).toFixed(1)} GB`;
  if (b >= 1_000_000) return `${(b / 1_000_000).toFixed(0)} MB`;
  if (b >= 1_000) return `${(b / 1_000).toFixed(0)} KB`;
  return `${b} B`;
}

function formatBytesPerSec(b: number): string {
  return `${formatBytes(b)}/s`;
}

interface MiniChartProps {
  data: StatsPoint[];
  dataKey: keyof StatsPoint;
  color: string;
  unit: string;
  label: string;
  formatter?: (v: number) => string;
}

function MiniChart({ data, dataKey, color, unit, label, formatter }: MiniChartProps) {
  if (data.length < 2) {
    const val = data.length === 1 ? data[0][dataKey] : 0;
    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 4, fontWeight: 600 }}>{label}</div>
        <div className="mono" style={{ fontSize: 18, fontWeight: 600, color }}>
          {formatter ? formatter(Number(val)) : Number(val).toFixed(1)}{unit}
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--text-2)', marginTop: 2 }}>Collecting data…</div>
      </div>
    );
  }

  const latest = data[data.length - 1];
  const current = formatter ? formatter(Number(latest[dataKey])) : Number(latest[dataKey]).toFixed(1);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-2)', fontWeight: 600 }}>{label}</span>
        <span className="mono" style={{ fontSize: 11, fontWeight: 600, color }}>{current}{unit}</span>
      </div>
      <ResponsiveContainer width="100%" height={48}>
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontSize: 11,
            }}
            labelFormatter={() => ''}
            formatter={(value: any) => [formatter ? formatter(Number(value)) : Number(value).toFixed(1), label]}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#grad-${dataKey})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface NetworkChartProps {
  data: StatsPoint[];
}

function NetworkChart({ data }: NetworkChartProps) {
  if (data.length < 2) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 4, fontWeight: 600 }}>
        Network I/O
      </div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 6 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--blue)' }}>
          RX {formatBytesPerSec(data[data.length - 1].networkRx)}
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--purple)' }}>
          TX {formatBytesPerSec(data[data.length - 1].networkTx)}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Area
            type="monotone"
            dataKey="networkRx"
            stroke="var(--blue)"
            strokeWidth={1.5}
            fill="rgba(77,158,255,0.1)"
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="networkTx"
            stroke="var(--purple)"
            strokeWidth={1.5}
            fill="rgba(167,139,250,0.1)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BlockIOChartProps {
  data: StatsPoint[];
}

function BlockIOChart({ data }: BlockIOChartProps) {
  if (data.length < 2) return null;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 10, color: 'var(--text-2)', marginBottom: 4, fontWeight: 600 }}>
        Block I/O
      </div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 6 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--green)' }}>
          Read {formatBytesPerSec(data[data.length - 1].blockRead)}
        </div>
        <div className="mono" style={{ fontSize: 11, color: 'var(--amber)' }}>
          Write {formatBytesPerSec(data[data.length - 1].blockWrite)}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={40}>
        <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="time" hide />
          <YAxis hide />
          <Area
            type="monotone"
            dataKey="blockRead"
            stroke="var(--green)"
            strokeWidth={1.5}
            fill="rgba(61,214,140,0.1)"
            dot={false}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="blockWrite"
            stroke="var(--amber)"
            strokeWidth={1.5}
            fill="rgba(245,166,35,0.1)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface Props {
  stats: StatsPoint[];
}

export default function StatsCharts({ stats }: Props) {
  return (
    <div style={{ marginTop: 16 }}>
      <div
        className="mono"
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-2)',
          marginBottom: 10,
        }}
      >
        Live Stats
      </div>
      <MiniChart
        data={stats}
        dataKey="cpuPercent"
        color="var(--blue)"
        unit="%"
        label="CPU"
        formatter={(v) => v.toFixed(1)}
      />
      <MiniChart
        data={stats}
        dataKey="memoryPercent"
        color="var(--purple)"
        unit="%"
        label="Memory"
        formatter={(v) => v.toFixed(1)}
      />
      <MiniChart
        data={stats}
        dataKey="pids"
        color="var(--amber)"
        unit=""
        label="Processes"
        formatter={(v) => Math.round(v).toString()}
      />
      <NetworkChart data={stats} />
      <BlockIOChart data={stats} />
    </div>
  );
}
