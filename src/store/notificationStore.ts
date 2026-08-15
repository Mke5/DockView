import { create } from 'zustand';

export interface AppNotification {
  id: number;
  type: 'info' | 'success' | 'warn' | 'error';
  text: string;
  ts: number;
  read: boolean;
}

const MAX_NOTIFICATIONS = 50;

let nextId = 1;

interface NotificationState {
  notifications: AppNotification[];
  add: (type: AppNotification['type'], text: string) => void;
  remove: (id: number) => void;
  clearAll: () => void;
  markAllRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  add: (type, text) =>
    set((state) => ({
      notifications: [
        { id: nextId++, type, text, ts: Date.now(), read: false },
        ...state.notifications,
      ].slice(0, MAX_NOTIFICATIONS),
    })),
  remove: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearAll: () => set({ notifications: [] }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
}));
