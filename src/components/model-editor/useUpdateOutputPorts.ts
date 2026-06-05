import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type {
  OutputPortInput,
  UpdateNodeInput,
  UpdateNodeMutation,
  UpdateNodeMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { UPDATE_NODE, draftHeadTokenVar, staleVersionNotificationVar } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

/**
 * Replace a node's output ports. `updateNode` swaps the whole `output_ports`
 * list, so the caller must pass *all* ports (with their existing `id`s
 * preserved, or edges/bindings keyed on them are orphaned). Used to edit a
 * port's unit/quantity.
 *
 * Unlike scalar field edits — which ride the `nodeGraphOverridesVar` overlay —
 * port changes aren't covered by that overlay, so we refetch the (no-cache)
 * NodeGraph to surface them.
 */
export function useUpdateOutputPorts() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation<UpdateNodeMutation, UpdateNodeMutationVariables>(UPDATE_NODE);

  return useCallback(
    async (nodeId: string, outputPorts: OutputPortInput[]) => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            nodeId,
            input: { outputPorts } as UpdateNodeInput,
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries: ['NodeGraph', 'EditorPublishState'],
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.updateNode;
        if (payload?.__typename === 'OperationInfo') {
          const message = payload.messages.map((m) => m.message).join('; ');
          throw new Error(message || 'Failed to update output ports');
        }
      } catch (err) {
        const isStale =
          CombinedGraphQLErrors.is(err) &&
          err.errors.some((e) => e.extensions?.code === 'stale_version');
        if (isStale) {
          staleVersionNotificationVar(true);
          void client.refetchQueries({ include: ['EditorPublishState'] });
        }
        throw err;
      }
    },
    [client, instance.id, mutate, editorContext]
  );
}
