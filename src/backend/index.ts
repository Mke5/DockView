/**
 * src/backend/index.ts
 *
 * Central barrel. Detects whether we're running inside Tauri and exports
 * the appropriate implementations. Components and stores always import from
 * here — never directly from `@tauri-apps/api`.
 */

export * from "./docker";
export { isTauri } from "./utils";
export type { OkResponse, PruneResult, CommandError } from "./docker";
