import { useCallback, useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { type OnMoveEnd, type Viewport, useReactFlow } from '@xyflow/react';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import { useEditorUiActions } from './editor-ui';
import { saveViewport } from './layoutCache';

type Params = {
  instanceId: string;
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  inspectedNodeId: string | null;
  /** True once the ELK layout has been applied to React Flow's node state. */
  isLayoutCurrent: boolean;
  /** The viewport the user left this instance at, captured once on mount. */
  savedViewport: Viewport | null;
};

/**
 * URL / viewport synchronisation for the graph editor:
 *
 * - restores the last-seen viewport (pan + zoom) once the initial layout is
 *   applied, unless a `?node=` deep-link takes precedence;
 * - handles `?node=<identifier>` deep-links by inspecting and centering the
 *   target node;
 * - mirrors the currently inspected node back into the URL so the view is
 *   linkable/refreshable;
 * - persists the viewport after every pan/zoom via the returned `onMoveEnd`.
 */
export function useGraphNavigation({
  instanceId,
  nodeMap,
  inspectedNodeId,
  isLayoutCurrent,
  savedViewport,
}: Params): { onMoveEnd: OnMoveEnd } {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requestedNodeKey = searchParams.get('node');
  const { setViewport } = useReactFlow();
  const { focusNode } = useEditorUiActions();
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

    handledNodeKeyRef.current = requestedNodeKey;
    void focusNode(requestedNodeKey, { origin: 'search', zoom: 'fit' }).then((result) => {
      if (result.status !== 'focused') handledNodeKeyRef.current = null;
    });
  }, [requestedNodeKey, isLayoutCurrent, focusNode]);

  // Mirror the inspected node back into the URL (`?node=<identifier>`) so
  // the view is linkable/refreshable. Uses `window.history.replaceState` rather
  // than `router.replace` so the update stays shallow: `router.replace`
  // soft-navigates and re-renders the route's Server Components, which re-runs
  // the layout's `InstanceContext` fetch on every node click. `useSearchParams`
  // still observes the change. Syncs `handledNodeKeyRef` so the deep-link
  // effect above doesn't re-pan/re-zoom in response to our own URL update.
  useEffect(() => {
    const target = inspectedNodeId ? nodeMap.get(inspectedNodeId) : null;
    const nextKey = target?.identifier ?? target?.id ?? null;
    if (nextKey === requestedNodeKey) return;
    // On fresh load with `?node=xxx`, the deep-link effect hasn't populated
    // inspection yet. Don't strip the param in that window, or the target
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
  }, [inspectedNodeId, nodeMap, requestedNodeKey, searchParams, pathname]);

  return { onMoveEnd };
}
