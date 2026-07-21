import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type {
  UpdateNodeInput,
  UpdateNodeMutation,
  UpdateNodeMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import {
  type NodeFieldOverrides,
  UPDATE_NODE,
  draftHeadTokenVar,
  patchNodeGraphOverride,
  staleVersionNotificationVar,
} from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

// Backend rejects explicit `null` on Maybe[str] fields — must omit them.
// Codegen types require every input field, so we strip nulls and cast.
function stripNulls(input: Partial<UpdateNodeInput>): UpdateNodeInput {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out as UpdateNodeInput;
}

/**
 * Update a node's editable fields. Handles the editor's write plumbing:
 * passes the draft-head version token (and refreshes it after the write),
 * propagates the updated fields to NodeGraph consumers via the reactive-var
 * overlay, and raises the stale-version notice when another tab won the race.
 */
export function useUpdateNodeMutation() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation<UpdateNodeMutation, UpdateNodeMutationVariables>(UPDATE_NODE);
  return useCallback(
    async (nodeId: string, input: Partial<UpdateNodeInput>) => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            nodeId,
            input: stripNulls(input),
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          // Re-fetch the token after a successful write so subsequent mutations
          // pass the new head and don't trip the stale-check.
          refetchQueries: ['EditorPublishState'],
        });
        const payload = result.data?.instanceEditor.updateNode;
        if (payload?.__typename === 'Node' || payload?.__typename === 'ActionNode') {
          // NodeGraph query uses fetchPolicy: 'no-cache', so propagate the
          // updated fields via the reactive-var overlay.
          const override: NodeFieldOverrides = {};
          if (input.name !== undefined) override.name = payload.name;
          if (input.shortName !== undefined) override.shortName = payload.shortName;
          if (input.description !== undefined) override.description = payload.description;
          if (input.color !== undefined) override.color = payload.color;
          if (input.isVisible !== undefined) override.isVisible = payload.isVisible;
          if (input.isOutcome !== undefined && payload.__typename === 'Node') {
            override.isOutcome = payload.isOutcome;
          }
          if (input.nodeGroup !== undefined) {
            override.nodeGroup = payload.editor?.nodeGroup ?? null;
          }
          patchNodeGraphOverride(nodeId, override);
        }
        return result;
      } catch (err) {
        const isStale =
          CombinedGraphQLErrors.is(err) &&
          err.errors.some((e) => e.extensions?.code === 'stale_version');
        if (isStale) {
          staleVersionNotificationVar(true);
          // Refresh the token so the user's next edit — on a fresh page or
          // after dismissing — doesn't hit the stale-check again.
          void client.refetchQueries({ include: ['EditorPublishState'] });
        }
        throw err;
      }
    },
    [instance.id, mutate, client, editorContext]
  );
}
