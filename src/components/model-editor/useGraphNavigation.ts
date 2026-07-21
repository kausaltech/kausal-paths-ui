import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { type OnMoveEnd, type Viewport, useReactFlow } from '@xyflow/react';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import type { ElkNodeType } from './ElkNode';
import { saveViewport } from './layoutCache';

type Params = {
  instanceId: string;
  nodes: readonly EditorNodeFieldsFragment[];
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  selectedNodeId: string | null;
  /** True once the ELK layout has been applied to React Flow's node state. */
  isLayoutCurrent: boolean;
  /** The viewport the user left this instance at, captured once on mount. */
  savedViewport: Viewport | null;
  setNodes: Dispatch<SetStateAction<ElkNodeType[]>>;
};

/**
 * URL / viewport synchronisation for the graph editor:
 *
 * - restores the last-seen viewport (pan + zoom) once the initial layout is
 *   applied, unless a `?node=` deep-link takes precedence;
 * - handles `?node=<identifier>` deep-links by selecting and centering the
 *   target node;
 * - mirrors the current selection back into the URL so the view is
 *   linkable/refreshable;
 * - persists the viewport after every pan/zoom via the returned `onMoveEnd`.
 */
export function useGraphNavigation({
  instanceId,
  nodes,
  nodeMap,
  selectedNodeId,
  isLayoutCurrent,
  savedViewport,
  setNodes,
}: Params): { onMoveEnd: OnMoveEnd } {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedNodeKey = searchParams.get('node');
  const { fitView, getNodes, setViewport } = useReactFlow();
  const handledNodeKeyRef = useRef<string | null>(null);
  const viewportRestoredRef = useRef(false);

  const onMoveEnd = useCallback<OnMoveEnd>(
    (_event, viewport) => {
      // Persist the viewport after every pan/zoom gesture (and after
      // programmatic fits), so the next visit restores where the user was.
      saveViewport(instanceId, viewport);
    },
    [instanceId]
  );

  // Restore the saved viewport once the initial layout is applied. Gated like
  // the deep-link effect (which takes precedence when `?node=` is present) and
  // runs once per mount.
  useEffect(() => {
    if (savedViewport === null) return;
    if (requestedNodeKey !== null) return;
    if (!isLayoutCurrent) return;
    if (viewportRestoredRef.current) return;
    viewportRestoredRef.current = true;
    void setViewport(savedViewport);
  }, [savedViewport, requestedNodeKey, isLayoutCurrent, setViewport]);

  // Deep-link: /model/nodes?node=<identifier> opens the panel on that
  // node and centers the graph on it. Waits for ELK layout to be *applied*
  // (positions written back to React Flow) so `fitView` reads real coords.
  useEffect(() => {
    if (!requestedNodeKey) return;
    if (!isLayoutCurrent) return;
    if (handledNodeKeyRef.current === requestedNodeKey) return;

    const target =
      nodes.find((n) => n.identifier === requestedNodeKey) ??
      nodes.find((n) => n.id === requestedNodeKey);
    if (!target) return;

    const rfNodes = getNodes();
    const targetRfNode = rfNodes.find((n) => n.id === target.id);
    if (!targetRfNode) return;

    handledNodeKeyRef.current = requestedNodeKey;
    // Drive RF's own selection state; `onSelectionChange` fires with this
    // node and updates `selectedNodeId`, which opens the details panel.
    setNodes((prev) => prev.map((n) => ({ ...n, selected: n.id === target.id })));
    // fitView with a single node centers and zooms on it natively.
    void fitView({ nodes: [{ id: target.id }], maxZoom: 1.2, duration: 400, padding: 0.4 });
  }, [requestedNodeKey, isLayoutCurrent, nodes, getNodes, fitView, setNodes]);

  // Mirror the current selection back into the URL (`?node=<identifier>`) so
  // the view is linkable/refreshable. Uses `window.history.replaceState` rather
  // than `router.replace` so the update stays shallow: `router.replace`
  // soft-navigates and re-renders the route's Server Components, which re-runs
  // the layout's `InstanceContext` fetch on every node click. `useSearchParams`
  // still observes the change. Syncs `handledNodeKeyRef` so the deep-link
  // effect above doesn't re-pan/re-zoom in response to our own URL update.
  useEffect(() => {
    const target = selectedNodeId ? nodeMap.get(selectedNodeId) : null;
    const nextKey = target?.identifier ?? target?.id ?? null;
    if (nextKey === requestedNodeKey) return;
    // On fresh load with `?node=xxx`, the deep-link effect hasn't populated
    // selection yet. Don't strip the param in that window, or the target
    // never gets focused.
    if (
      nextKey === null &&
      requestedNodeKey !== null &&
      handledNodeKeyRef.current !== requestedNodeKey
    ) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (nextKey) params.set('node', nextKey);
    else params.delete('node');
    const query = params.toString();
    handledNodeKeyRef.current = nextKey;
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
  }, [selectedNodeId, nodeMap, requestedNodeKey, searchParams, pathname]);

  return { onMoveEnd };
}
