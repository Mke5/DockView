import { isTauri } from './utils';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  currentVersion?: string;
  body?: string;
  date?: string;
}

let _update: any = null;

export async function checkForUpdates(): Promise<UpdateInfo> {
  if (!isTauri()) {
    return { available: false };
  }

  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (update) {
      _update = update;
      return {
        available: true,
        version: update.version,
        currentVersion: update.currentVersion,
        body: update.body,
        date: update.date,
      };
    }
  } catch (e) {
    console.warn('[updater] check failed:', e);
  }

  return { available: false };
}

export async function installUpdate(): Promise<void> {
  if (!_update) return;
  try {
    await _update.downloadAndInstall();
  } catch (e) {
    console.warn('[updater] install failed:', e);
  }
}

export function getLastUpdate(): any {
  return _update;
}
