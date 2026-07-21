import { useCallback, useState } from 'react';

import { useReactFlow } from '@xyflow/react';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import { loadLayoutCache, saveUserPosition } from './layoutCache';
import { type NewNodeKind, useCreateNode } from './useCreateNode';
import { useDeleteNode } from './useDeleteNode';
import { useDuplicateNode } from './useDuplicateNode';

// Diagonal gap, in flow coordinates, between a duplicated node and its source
// so the copy is visibly distinct without drifting far from the original.
const DUPLICATE_OFFSET = 48;

export type NodeCrudFeedback =
  { kind: 'success'; message: string } | { kind: 'error'; message: string };

type Params = {
  instanceId: string;
  /** All nodes in the graph (used for identifier uniqueness and duplication). */
  allNodes: readonly EditorNodeFieldsFragment[];
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  /** Called with the new node's id after a create / duplicate resolves. */
  onCreated: (newId: string) => void;
  /** Called after a delete resolves, before the feedback snackbar shows. */
  onDeleted: (nodeId: string) => void;
};

/**
 * Owns the node create / duplicate / delete flows for the graph editor: the
 * mutation calls (via useCreateNode / useDuplicateNode / useDeleteNode), the
 * position seeding that keeps the viewport stable across the refetch, the
 * delete confirmation state, and the shared success / error feedback. The
 * matching UI (busy backdrop, confirm dialog, snackbar) is NodeCrudDialogs.
 */
export function useNodeCrudActions({
  instanceId,
  allNodes,
  nodeMap,
  onCreated,
  onDeleted,
}: Params) {
  const { getNodes } = useReactFlow();
  const [feedback, setFeedback] = useState<NodeCrudFeedback | null>(null);
  const dismissFeedback = useCallback(() => setFeedback(null), []);

  const duplicateNodeMutation = useDuplicateNode();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const duplicateNode = useCallback(
    (nodeId: string) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;
      if (isDuplicating) return;
      // Capture the source position now, while the original is on screen and
      // stationary.
      const sourcePos = getNodes().find((n) => n.id === node.id)?.position ??
        loadLayoutCache(instanceId)[node.id] ?? { x: 0, y: 0 };
      setIsDuplicating(true);
      duplicateNodeMutation(node, allNodes, (newId) => {
        // Runs before the graph refetches (see `useDuplicateNode`): seed the
        // copy's offset position so the refetch-triggered layout pass finds it
        // already cached. Every node is then cached, so that pass takes its
        // no-ELK, no-refit path (see `useLayoutNodes`) — the copy lands at the
        // offset and the viewport stays put. Doing this in `.then()` instead
        // would race the refetch and sometimes drop the copy top-left.
        saveUserPosition(
          instanceId,
          newId,
          sourcePos.x + DUPLICATE_OFFSET,
          sourcePos.y + DUPLICATE_OFFSET
        );
      })
        .then((result) => {
          onCreated(result.newId);
          setFeedback({
            kind: 'success',
            message: `Duplicated "${node.name}" as "${result.newIdentifier}"`,
          });
        })
        .catch((err: unknown) =>
          setFeedback({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Failed to duplicate node',
          })
        )
        .finally(() => setIsDuplicating(false));
    },
    [duplicateNodeMutation, getNodes, instanceId, isDuplicating, nodeMap, allNodes, onCreated]
  );

  const createNodeMutation = useCreateNode();
  const [isCreating, setIsCreating] = useState(false);

  // Create a node immediately at the right-click position with sensible
  // defaults (unit/quantity are editable afterward in the details panel) and
  // select it, rather than prompting up front.
  const createNodeAt = useCallback(
    (flowX: number, flowY: number, kind: NewNodeKind) => {
      if (isCreating) return;
      setIsCreating(true);
      const existingIdentifiers = new Set(allNodes.map((n) => n.identifier));
      const name = kind === 'action' ? 'My Action' : 'My Node';
      createNodeMutation(
        { name, unit: 'kt/a', quantity: 'emissions', kind, existingIdentifiers },
        // Seed the position at the right-click location before the refetch, so
        // the node lands there and the layout pass keeps the viewport (a pure
        // addition served from cache — see useLayoutNodes).
        (newId) => saveUserPosition(instanceId, newId, flowX, flowY)
      )
        .then((result) => {
          onCreated(result.newId);
          setFeedback({
            kind: 'success',
            message: `Created "${result.newIdentifier}"`,
          });
        })
        .catch((err: unknown) =>
          setFeedback({
            kind: 'error',
            message: err instanceof Error ? err.message : 'Failed to create node',
          })
        )
        .finally(() => setIsCreating(false));
    },
    [createNodeMutation, instanceId, isCreating, allNodes, onCreated]
  );

  const deleteNodeMutation = useDeleteNode();
  const [deleteConfirmNode, setDeleteConfirmNode] = useState<EditorNodeFieldsFragment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const requestDeleteNode = useCallback(
    (nodeId: string) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;
      setDeleteConfirmNode(node);
    },
    [nodeMap]
  );

  const cancelDelete = useCallback(() => setDeleteConfirmNode(null), []);

  const confirmDelete = useCallback(() => {
    const node = deleteConfirmNode;
    if (!node || isDeleting) return;
    setIsDeleting(true);
    deleteNodeMutation(node.id)
      .then(() => {
        onDeleted(node.id);
        setFeedback({ kind: 'success', message: `Deleted "${node.name}"` });
      })
      .catch((err: unknown) =>
        setFeedback({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Failed to delete node',
        })
      )
      .finally(() => {
        setIsDeleting(false);
        setDeleteConfirmNode(null);
      });
  }, [deleteConfirmNode, deleteNodeMutation, isDeleting, onDeleted]);

  return {
    feedback,
    dismissFeedback,
    isDuplicating,
    isCreating,
    isDeleting,
    deleteConfirmNode,
    duplicateNode,
    createNodeAt,
    requestDeleteNode,
    cancelDelete,
    confirmDelete,
  };
}

export type NodeCrudActions = ReturnType<typeof useNodeCrudActions>;
