import { useCallback, useEffect, useMemo, useState } from 'react';

import { useQuery, useReactiveVar } from '@apollo/client/react';

import type { EditorNodeFieldsFragment } from '@/common/__generated__/graphql';
import { useEditorApolloContext } from '../useEditorApolloContext';
import { EFFECT_SOURCE_CANDIDATES } from './queries';
import {
  type ActionTarget,
  actionWizardVar,
  newEffect,
  setWizardPick,
  updateActionWizard,
  updateEffect,
} from './state';

export type PickMode = {
  /** Whether the next node click goes to the wizard instead of inspecting the node. */
  active: boolean;
  kind: 'target' | 'source' | null;
  /** Nodes that cannot be picked; drawn faded. */
  dimmedNodeIds: ReadonlySet<string> | undefined;
  /** Message for a click on a node that cannot be picked, until the next pick. */
  refusal: string | null;
  /** Handle a node click; returns false when no pick is in progress. */
  pick: (nodeId: string) => boolean;
  cancel: () => void;
};

/**
 * The canvas side of the action wizard: while it waits for a pick, a node
 * click adds an effect on that node (`target`) or names it as an effect's
 * source (`source`). Target picks are limited to the nodes the backend says an
 * action can act on (`actionTargets`, keyed by node uuid), and a click on any
 * other shows the backend's reason. Source picks are limited to the nodes the
 * backend lists as fitting the effect (`effectSourceCandidates`), which the
 * wizard has already fetched for that effect.
 */
export function usePickMode(
  nodes: readonly EditorNodeFieldsFragment[],
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>,
  actionTargets: ReadonlyMap<string, ActionTarget>,
  refusalText: { noFit: string }
): PickMode {
  const state = useReactiveVar(actionWizardVar);
  const editorContext = useEditorApolloContext();
  const [refusal, setRefusal] = useState<string | null>(null);
  const pickState = state.open ? state.pick : null;

  const sourceEffect =
    pickState?.kind === 'source'
      ? state.effects.find((e) => e.key === pickState.effectKey)
      : undefined;
  const sourceTarget = sourceEffect ? nodeMap.get(sourceEffect.targetNodeId) : undefined;
  const { data } = useQuery(EFFECT_SOURCE_CANDIDATES, {
    variables: { targetNodeId: sourceTarget?.uuid ?? '' },
    skip: !sourceTarget,
    context: editorContext,
  });
  const candidatePorts = useMemo(() => {
    const byNodeUuid = new Map<string, string>();
    for (const c of data?.instance.editor?.effectSourceCandidates.nodes ?? []) {
      if (!byNodeUuid.has(c.nodeId)) byNodeUuid.set(c.nodeId, c.portId);
    }
    return byNodeUuid;
  }, [data]);

  const dimmedNodeIds = useMemo(() => {
    if (!pickState) return undefined;
    const pickable =
      pickState.kind === 'target'
        ? (n: EditorNodeFieldsFragment) => actionTargets.get(n.uuid)?.available === true
        : (n: EditorNodeFieldsFragment) => candidatePorts.has(n.uuid);
    return new Set(nodes.filter((n) => !pickable(n)).map((n) => n.id));
  }, [actionTargets, candidatePorts, nodes, pickState]);

  const cancel = useCallback(() => {
    setRefusal(null);
    setWizardPick(null);
  }, []);

  useEffect(() => {
    if (!pickState) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancel, pickState]);

  const pick = useCallback(
    (nodeId: string): boolean => {
      if (!pickState) return false;
      const node = nodeMap.get(nodeId);
      if (!node) return true;
      if (pickState.kind === 'target') {
        const target = actionTargets.get(node.uuid);
        if (!target?.available) {
          setRefusal(target?.reason ?? null);
          return true;
        }
        updateActionWizard((s) => ({
          ...s,
          pick: null,
          // An action acts on each node once; picking a node again only ends the pick.
          effects: s.effects.some((e) => e.targetNodeId === node.id)
            ? s.effects
            : [...s.effects, newEffect(node.id)],
        }));
      } else {
        const portId = candidatePorts.get(node.uuid);
        if (!portId) {
          setRefusal(refusalText.noFit);
          return true;
        }
        updateEffect(pickState.effectKey, { sourcePort: `${node.uuid}:${portId}` });
        setWizardPick(null);
      }
      setRefusal(null);
      return true;
    },
    [actionTargets, candidatePorts, nodeMap, pickState, refusalText.noFit]
  );

  return {
    active: pickState !== null,
    kind: pickState?.kind ?? null,
    dimmedNodeIds,
    refusal,
    pick,
    cancel,
  };
}
