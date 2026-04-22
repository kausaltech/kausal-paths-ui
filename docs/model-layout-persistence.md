# Model Layout Persistence

## Problem

The node graph editor re-runs an ELK layout on every mount. User-made
position changes (drags) are ephemeral and lost on reload. We want:

1. Compute the initial layout once per instance, then cache it.
2. Persist user drags across sessions.
3. Re-run ELK only when the backend introduces a node the cache has
   never seen.

There is no backend API for storing layouts yet, so the cache lives in
`localStorage` and is scoped per instance.

## Storage

One key per instance:

```
paths:node-layout:v1:{instanceId}
```

Value shape:

```ts
{
  version: 1,
  instanceId: string,
  updatedAt: string,                // ISO timestamp
  positions: {
    [nodeId: string]: {
      x: number,
      y: number,
      source: 'auto' | 'user',      // 'auto' = written by ELK, 'user' = dragged
    }
  }
}
```

Why store the `source`: it lets us re-run ELK when a new node appears
without trampling nodes the user has deliberately moved.

Parse failures, schema mismatches (`version !== 1`), or a missing
`window` (SSR) yield an empty cache. The cache module never throws.

## Read path

Entry point: [src/components/model-editor/useLayoutNodes.ts](../src/components/model-editor/useLayoutNodes.ts).

The hook now accepts `instanceId` and runs this sequence whenever
`layoutVersion` changes:

1. Load the cache for `instanceId`.
2. Partition the current React Flow nodes:
   - **covered** — ID is in the cache
   - **missing** — ID is not
3. If `missing` is empty: apply cached positions directly, skip ELK,
   call `fitView`, and mark the version applied. No network of ELK work.
4. If anything is missing: run ELK on the full visible graph, then for
   each node:
   - `source === 'user'` → keep the cached position
   - otherwise → use ELK's fresh position
5. Persist every non-user position back with `source: 'auto'` (one batch
   write, single `updatedAt` bump).

Upshot:

- **Reload, same graph:** zero ELK calls.
- **Filters toggled:** nodes are already cached → zero ELK calls.
  Filters become pure show/hide.
- **Backend adds a node:** ELK runs once, new node is placed among
  sticky user-moved nodes, everyone else takes ELK's new position.

## Write path

Entry point: [src/components/model-editor/NodeGraphEditor.tsx](../src/components/model-editor/NodeGraphEditor.tsx).

`onNodesChange` is wrapped so that for every change of type `'position'`
with `dragging === false`, we call
`saveUserPosition(instanceId, nodeId, x, y)`. `dragging === false` fires
exactly once on drag release, so we don't thrash `localStorage` during
the drag itself and don't need to debounce.

## Cache module

New file: [src/components/model-editor/layoutCache.ts](../src/components/model-editor/layoutCache.ts).

API:

```ts
export type CachedPosition = { x: number; y: number; source: 'auto' | 'user' };

loadLayoutCache(instanceId: string): Record<string, CachedPosition>;
saveAutoPositions(instanceId, positions: Array<{id, x, y}>): void;   // merges, never downgrades user -> auto
saveUserPosition(instanceId, nodeId, x, y): void;                    // upgrades auto -> user
clearLayoutCache(instanceId): void;                                  // nuke everything
```

Invariants:

- `saveAutoPositions` **never** overwrites an existing `user` entry.
- `saveUserPosition` **always** writes `source: 'user'`.
- All reads/writes guard `typeof window !== 'undefined'`.
- All reads/writes are wrapped in `try/catch`; failures log and return
  the empty state.

## Reset UI

A "Reset layout" button is added as an extra `<ControlButton>` inside
React Flow's bottom-left `<Controls>` strip (next to zoom/fit-view). It
calls `clearLayoutCache(instanceId)` and forces a re-layout by bumping
the layout version. This is the user's escape hatch from a messy graph.

Per-node reset ("reset this node") is intentionally out of scope for
v1; we can add it via the node context menu later.

## Versioning

- `version: 1` embedded in the stored payload. A bump to `2` would mean
  old entries are discarded on read.
- ELK option tuning changes **do not** invalidate the cache. If a tuning
  change produces visibly worse "auto" layouts for existing users, they
  can hit "Reset layout" to recompute. We can add an ELK-options hash to
  the key later if that becomes a real problem.

## Non-goals

- No IndexedDB; the payload is small (< ~100KB for hundreds of nodes).
- No backend sync; this is a local simulation of the future backend
  feature. When the backend arrives, the cache module is the seam to
  swap in.
- No per-user scoping within a browser; the cache is per browser
  profile. If multiple users share a browser they share layouts.
