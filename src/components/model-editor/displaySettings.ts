import { makeVar } from '@apollo/client';

/**
 * User-facing display settings for the node graph. These are personal view
 * preferences (not model state), so they persist to localStorage globally
 * rather than per instance like `layoutCache`.
 */
export type NodeDisplaySettings = {
  /** Show the category header strip (icon + computational-type label) on node cards. */
  showNodeType: boolean;
};

const DEFAULT_SETTINGS: NodeDisplaySettings = {
  showNodeType: true,
};

const STORAGE_KEY = 'paths:node-display-settings:v1';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function loadSettings(): NodeDisplaySettings {
  if (!isBrowser()) return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_SETTINGS;
    // Merge over defaults so newly added settings pick up their default value.
    const result = { ...DEFAULT_SETTINGS };
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof NodeDisplaySettings)[]) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'boolean') result[key] = value;
    }
    return result;
  } catch (err) {
    console.warn('displaySettings: failed to read settings', err);
    return DEFAULT_SETTINGS;
  }
}

export const nodeDisplaySettingsVar = makeVar<NodeDisplaySettings>(loadSettings());

export function setNodeDisplaySetting<K extends keyof NodeDisplaySettings>(
  key: K,
  value: NodeDisplaySettings[K]
): void {
  const next = { ...nodeDisplaySettingsVar(), [key]: value };
  nodeDisplaySettingsVar(next);
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (err) {
    console.warn('displaySettings: failed to write settings', err);
  }
}
