export type CachedPositionSource = 'auto' | 'user';

export type CachedPosition = {
  x: number;
  y: number;
  source: CachedPositionSource;
};

type StoredPayload = {
  version: 1;
  instanceId: string;
  updatedAt: string;
  positions: Record<string, CachedPosition>;
};

const SCHEMA_VERSION = 1;
const KEY_PREFIX = 'paths:node-layout:v1:';

function keyFor(instanceId: string): string {
  return `${KEY_PREFIX}${instanceId}`;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function isValidPayload(value: unknown, instanceId: string): value is StoredPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<StoredPayload>;
  if (v.version !== SCHEMA_VERSION) return false;
  if (v.instanceId !== instanceId) return false;
  if (!v.positions || typeof v.positions !== 'object') return false;
  return true;
}

function readPayload(instanceId: string): StoredPayload | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(instanceId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidPayload(parsed, instanceId)) return null;
    return parsed;
  } catch (err) {
    console.warn('layoutCache: failed to read cache', err);
    return null;
  }
}

function writePayload(payload: StoredPayload): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(keyFor(payload.instanceId), JSON.stringify(payload));
  } catch (err) {
    console.warn('layoutCache: failed to write cache', err);
  }
}

function emptyPayload(instanceId: string): StoredPayload {
  return {
    version: SCHEMA_VERSION,
    instanceId,
    updatedAt: new Date().toISOString(),
    positions: {},
  };
}

export function loadLayoutCache(instanceId: string): Record<string, CachedPosition> {
  const payload = readPayload(instanceId);
  if (!payload) return {};
  return payload.positions;
}

/**
 * Merge a batch of ELK-produced positions into the cache. Never downgrades
 * an existing `user` entry back to `auto`.
 */
export function saveAutoPositions(
  instanceId: string,
  positions: ReadonlyArray<{ id: string; x: number; y: number }>
): void {
  if (!isBrowser()) return;
  if (positions.length === 0) return;
  const payload = readPayload(instanceId) ?? emptyPayload(instanceId);
  for (const { id, x, y } of positions) {
    const existing = payload.positions[id];
    if (existing?.source === 'user') continue;
    payload.positions[id] = { x, y, source: 'auto' };
  }
  payload.updatedAt = new Date().toISOString();
  writePayload(payload);
}

/** Record a user-driven drag. Upgrades the entry to `source: 'user'`. */
export function saveUserPosition(instanceId: string, nodeId: string, x: number, y: number): void {
  if (!isBrowser()) return;
  const payload = readPayload(instanceId) ?? emptyPayload(instanceId);
  payload.positions[nodeId] = { x, y, source: 'user' };
  payload.updatedAt = new Date().toISOString();
  writePayload(payload);
}

/** Drop the entire cached layout for an instance. */
export function clearLayoutCache(instanceId: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(keyFor(instanceId));
  } catch (err) {
    console.warn('layoutCache: failed to clear cache', err);
  }
}
