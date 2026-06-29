import { useEffect } from 'react';

import { useApolloClient } from '@apollo/client/react';

import { NodeStatus } from '@/common/__generated__/graphql';
import type { NodeStatusesQuery } from '@/common/__generated__/graphql';
import { NODE_STATUSES, type NodeStatusEntry, nodeStatusVar, setNodeStatuses } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

/** A node shape carrying the editor status fields (init or compute phase). */
type StatusNode = {
  id: string;
  editor?: {
    status?: NodeStatus | null;
    errors: NodeStatusEntry['errors'];
  } | null;
};

function toEntry(node: StatusNode, pending: boolean): NodeStatusEntry {
  return {
    status: node.editor?.status ?? NodeStatus.Ok,
    errors: node.editor?.errors ?? [],
    pending,
  };
}

/**
 * Drives the two-phase status lifecycle for the model editor (see
 * `nodeStatusVar`).
 *
 * Phase 1 (cheap): the structural NodeGraph query already carries init-time
 * status (`compute: false`). We seed it here. On a structural refetch (after an
 * edit) we *preserve* the last-known compute status for nodes that still exist
 * — so their badges don't flash back to "pending" — and only seed freshly
 * appeared nodes as pending.
 *
 * Phase 2 (a couple of seconds): an async `compute: true` pass over the whole
 * graph, run after every structural change. Editor operations set
 * `tolerateNodeFailures`, so failures come back as node status rather than
 * aborting. Results replace the seeded entries and clear `pending`.
 *
 * `nodes` is the structural NodeGraph result; a new array reference (initial
 * load or an edit-triggered refetch) re-runs the cycle.
 */
export function useNodeStatuses(nodes: readonly StatusNode[]): void {
  const client = useApolloClient();
  const context = useEditorApolloContext();

  useEffect(() => {
    // Reconcile: adopt the fresh init-time status/errors carried by the
    // refetched node (a structural edit may have changed it), but preserve the
    // prior `pending` flag so settled nodes don't flash back to "checking".
    // New nodes start pending; removed ones are dropped.
    const prev = nodeStatusVar();
    const seeded: Record<string, NodeStatusEntry> = {};
    for (const node of nodes) {
      seeded[node.id] = toEntry(node, prev[node.id]?.pending ?? true);
    }
    nodeStatusVar(seeded);

    // Phase 2: compute-phase status for the whole graph.
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await client.query<NodeStatusesQuery>({
          query: NODE_STATUSES,
          fetchPolicy: 'no-cache',
          context,
        });
        if (cancelled || !data) return;
        const entries: Record<string, NodeStatusEntry> = {};
        for (const node of data.instance.nodes) {
          entries[node.id] = toEntry(node, false);
        }
        setNodeStatuses(entries);
      } catch {
        if (cancelled) return;
        // Computation failed wholesale — clear pending so the UI stops showing
        // "checking" and falls back to the init-phase status.
        const current = nodeStatusVar();
        const cleared: Record<string, NodeStatusEntry> = {};
        for (const [id, entry] of Object.entries(current)) {
          cleared[id] = { ...entry, pending: false };
        }
        nodeStatusVar(cleared);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nodes, client, context]);
}
