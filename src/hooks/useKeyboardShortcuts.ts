import { useEffect } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  handler: (e: KeyboardEvent) => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      for (const s of shortcuts) {
        const matchCtrl = s.ctrl ? e.ctrlKey || e.metaKey : true;
        const matchMeta = s.meta ? e.metaKey : true;
        if (e.key === s.key && matchCtrl && matchMeta) {
          e.preventDefault();
          e.stopPropagation();
          s.handler(e);
          return;
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
}
