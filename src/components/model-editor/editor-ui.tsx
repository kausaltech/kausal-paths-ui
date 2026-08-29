'use client';

import {
  type ReactNode,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Box } from '@mui/material';

import { useReactFlow } from '@xyflow/react';

import type {
  EditorNodeEdgeFragment,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';

export type EditorFocusOrigin = 'user' | 'search' | 'assistant';
export type EditorFocusZoom = 'fit' | 'preserve';
export type EditorUiTarget = 'graph-canvas' | 'node-search' | 'preview-toggle' | 'node-details';

export type FocusNodeResult =
  | { status: 'focused'; nodeId: string }
  | { status: 'hidden-by-filter'; nodeId: string }
  | { status: 'not-found' };

export type EditorUiState = {
  focusedNodeId: string | null;
  focusOrigin: EditorFocusOrigin;
  focusRevision: number;
  highlightedNodeIds: ReadonlySet<string>;
  spotlightTarget: EditorUiTarget | null;
};

export type EditorUiActions = {
  inspectNode: (nodeId: string | null, origin?: EditorFocusOrigin) => void;
  focusNode: (
    nodeRef: string,
    options?: {
      inspect?: boolean;
      zoom?: EditorFocusZoom;
      highlight?: boolean;
      origin?: EditorFocusOrigin;
    }
  ) => Promise<FocusNodeResult>;
  highlightNodes: (nodeRefs: readonly string[], durationMs?: number) => string;
  clearHighlight: (token?: string) => void;
  spotlight: (
    target: EditorUiTarget,
    durationMs?: number
  ) => { status: 'spotlighted'; token: string } | { status: 'not-found' };
  clearSpotlight: (token?: string) => void;
};

export type EditorUiController = {
  state: EditorUiState;
  actions: EditorUiActions;
  nodes: readonly EditorNodeFieldsFragment[];
  edges: readonly EditorNodeEdgeFragment[];
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
};

const EditorUiContext = createContext<EditorUiController | null>(null);

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export function useCreateEditorUiController({
  nodes,
  edges,
  nodeMap,
  visibleNodeIds,
}: {
  nodes: readonly EditorNodeFieldsFragment[];
  edges: readonly EditorNodeEdgeFragment[];
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  visibleNodeIds: ReadonlySet<string>;
}): EditorUiController {
  const { fitView, getNodes, getZoom, setCenter } = useReactFlow();
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [focusOrigin, setFocusOrigin] = useState<EditorFocusOrigin>('user');
  const [focusRevision, setFocusRevision] = useState(0);
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [spotlightTarget, setSpotlightTarget] = useState<EditorUiTarget | null>(null);
  const highlightTokenRef = useRef<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spotlightTokenRef = useRef<string | null>(null);
  const spotlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const graphRef = useRef({ nodes, nodeMap, visibleNodeIds });

  useEffect(() => {
    graphRef.current = { nodes, nodeMap, visibleNodeIds };
  }, [nodes, nodeMap, visibleNodeIds]);

  useEffect(
    () => () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    },
    []
  );

  const resolveNode = useCallback((nodeRef: string): EditorNodeFieldsFragment | undefined => {
    const graph = graphRef.current;
    return graph.nodeMap.get(nodeRef) ?? graph.nodes.find((node) => node.identifier === nodeRef);
  }, []);

  const inspectNode = useCallback((nodeId: string | null, origin: EditorFocusOrigin = 'user') => {
    setFocusedNodeId(nodeId);
    setFocusOrigin(origin);
    setFocusRevision((revision) => revision + 1);
  }, []);

  const clearHighlight = useCallback((token?: string) => {
    if (token !== undefined && highlightTokenRef.current !== token) return;
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = null;
    highlightTokenRef.current = null;
    setHighlightedNodeIds(new Set());
  }, []);

  const highlightNodes = useCallback(
    (nodeRefs: readonly string[], durationMs = 2500): string => {
      const token = crypto.randomUUID();
      const ids = nodeRefs
        .map((nodeRef) => resolveNode(nodeRef)?.id)
        .filter((id): id is string => id !== undefined);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTokenRef.current = token;
      setHighlightedNodeIds(new Set(ids));
      highlightTimerRef.current = setTimeout(() => clearHighlight(token), durationMs);
      return token;
    },
    [clearHighlight, resolveNode]
  );

  const clearSpotlight = useCallback((token?: string) => {
    if (token !== undefined && spotlightTokenRef.current !== token) return;
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    spotlightTimerRef.current = null;
    spotlightTokenRef.current = null;
    setSpotlightTarget(null);
  }, []);

  const spotlight = useCallback<EditorUiActions['spotlight']>(
    (target, durationMs = 5000) => {
      const element = document.querySelector<HTMLElement>(`[data-editor-ui-target="${target}"]`);
      if (!element) return { status: 'not-found' };
      const token = crypto.randomUUID();
      if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
      spotlightTokenRef.current = token;
      setSpotlightTarget(target);
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      spotlightTimerRef.current = setTimeout(() => clearSpotlight(token), durationMs);
      return { status: 'spotlighted', token };
    },
    [clearSpotlight]
  );

  const focusNode = useCallback<EditorUiActions['focusNode']>(
    async (nodeRef, options = {}) => {
      // A freshly created node may not have reached the refetched graph yet.
      // Wait briefly for both the model snapshot and React Flow's applied node.
      let node: EditorNodeFieldsFragment | undefined;
      let flowNode: ReturnType<typeof getNodes>[number] | undefined;
      for (let frame = 0; frame < 120; frame += 1) {
        node = resolveNode(nodeRef);
        if (node && !graphRef.current.visibleNodeIds.has(node.id)) {
          return { status: 'hidden-by-filter', nodeId: node.id };
        }
        if (node) {
          const nodeId = node.id;
          flowNode = getNodes().find((candidate) => candidate.id === nodeId);
        }
        if (node && flowNode) break;
        await nextFrame();
      }
      if (!node || !flowNode) return { status: 'not-found' };

      const { inspect = true, zoom = 'fit', highlight = false, origin = 'user' } = options;
      if (inspect) inspectNode(node.id, origin);
      if (highlight) highlightNodes([node.id]);

      if (zoom === 'preserve') {
        const width = flowNode.measured?.width ?? flowNode.width ?? 0;
        const height = flowNode.measured?.height ?? flowNode.height ?? 0;
        await setCenter(flowNode.position.x + width / 2, flowNode.position.y + height / 2, {
          zoom: getZoom(),
          duration: 400,
        });
      } else {
        await fitView({ nodes: [{ id: node.id }], maxZoom: 1.2, duration: 400, padding: 0.4 });
      }
      return { status: 'focused', nodeId: node.id };
    },
    [fitView, getNodes, getZoom, highlightNodes, inspectNode, resolveNode, setCenter]
  );

  const state = useMemo<EditorUiState>(
    () => ({
      focusedNodeId,
      focusOrigin,
      focusRevision,
      highlightedNodeIds,
      spotlightTarget,
    }),
    [focusedNodeId, focusOrigin, focusRevision, highlightedNodeIds, spotlightTarget]
  );
  const actions = useMemo<EditorUiActions>(
    () => ({
      inspectNode,
      focusNode,
      highlightNodes,
      clearHighlight,
      spotlight,
      clearSpotlight,
    }),
    [inspectNode, focusNode, highlightNodes, clearHighlight, spotlight, clearSpotlight]
  );

  return useMemo(
    () => ({ state, actions, nodes, edges, nodeMap }),
    [state, actions, nodes, edges, nodeMap]
  );
}

export function EditorUiProvider({
  controller,
  children,
}: {
  controller: EditorUiController;
  children: ReactNode;
}) {
  return (
    <EditorUiContext value={controller}>
      {children}
      {controller.state.spotlightTarget && (
        <EditorSpotlight
          key={controller.state.spotlightTarget}
          target={controller.state.spotlightTarget}
        />
      )}
    </EditorUiContext>
  );
}

function EditorSpotlight({ target }: { target: EditorUiTarget }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const element = document.querySelector<HTMLElement>(`[data-editor-ui-target="${target}"]`);
    if (!element) return;
    const update = () => setRect(element.getBoundingClientRect());
    const frame = requestAnimationFrame(update);
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [target]);

  if (!rect) return null;
  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: theme.zIndex.modal + 1,
        left: rect.left - 4,
        top: rect.top - 4,
        width: rect.width + 8,
        height: rect.height + 8,
        border: `3px solid ${theme.palette.primary.main}`,
        borderRadius: 1,
        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.36)',
        transition: 'left 180ms ease, top 180ms ease, width 180ms ease, height 180ms ease',
      })}
    />
  );
}

export function useEditorUi(): EditorUiController {
  const controller = use(EditorUiContext);
  if (!controller) throw new Error('useEditorUi must be used inside EditorUiProvider');
  return controller;
}

export function useEditorUiActions(): EditorUiActions {
  return useEditorUi().actions;
}
