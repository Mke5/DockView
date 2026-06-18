import { useEffect, useRef } from 'react';
import { onDockerStats, ContainerStats } from '../backend/docker';

const MAX_POINTS = 90; // 3 minutes at 2s interval

export interface StatsPoint {
  time: number;
  cpuPercent: number;
  memoryUsage: number;
  memoryLimit: number;
  memoryPercent: number;
  networkRx: number;
  networkTx: number;
  blockRead: number;
  blockWrite: number;
  pids: number;
}

const history = new Map<string, StatsPoint[]>();

export function useStatsHistory(): {
  getStats: (containerId: string) => StatsPoint[];
} {
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onDockerStats((stats) => {
      for (const s of stats) {
        let points = history.get(s.id);
        if (!points) {
          points = [];
          history.set(s.id, points);
        }
        const prev = points.length > 0 ? points[points.length - 1] : null;
        const now = Date.now();
        points.push({
          time: now,
          cpuPercent: s.cpuPercent,
          memoryUsage: s.memoryUsage,
          memoryLimit: s.memoryLimit,
          memoryPercent: s.memoryPercent,
          networkRx: s.networkRx,
          networkTx: s.networkTx,
          blockRead: s.blockRead,
          blockWrite: s.blockWrite,
          pids: s.pids,
        });
        // Trim to max
        if (points.length > MAX_POINTS) points.splice(0, points.length - MAX_POINTS);
      }
    }).then((unsub) => {
      unlistenRef.current = unsub;
    });

    return () => {
      unlistenRef.current?.();
      unlistenRef.current = null;
      history.clear();
    };
  }, []);

  return {
    getStats: (containerId: string) => history.get(containerId) ?? [],
  };
}
