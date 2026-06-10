import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type {
  DeleteEdgeMutation,
  DeleteEdgeMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { DELETE_EDGE, draftHeadTokenVar, staleVersionNotificationVar } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

/**
 * Delete a node→node edge by its id. `deleteEdge` returns `null` on success and
 * an `OperationInfo` with messages on failure. The NodeGraph query is
 * `no-cache`, so we refetch it (and the publish state) to drop the edge from
 * the view. Mirrors {@link useCreateEdge}'s version/stale-version handling.
 */
export function useDeleteEdge() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation<DeleteEdgeMutation, DeleteEdgeMutationVariables>(DELETE_EDGE);

  return useCallback(
    async (edgeId: string) => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            edgeId,
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries: ['NodeGraph', 'EditorPublishState'],
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.deleteEdge;
        if (payload && payload.messages.length > 0) {
          const message = payload.messages.map((m) => m.message).join('; ');
          throw new Error(message || 'Failed to delete edge');
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
