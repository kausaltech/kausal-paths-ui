import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type {
  DeleteNodeMutation,
  DeleteNodeMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { DELETE_NODE, draftHeadTokenVar, staleVersionNotificationVar } from './queries';

export function useDeleteNode() {
  const instance = useInstance();
  const client = useApolloClient();
  const [mutate] = useMutation<DeleteNodeMutation, DeleteNodeMutationVariables>(DELETE_NODE);

  return useCallback(
    async (nodeId: string): Promise<void> => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            nodeId,
            version: draftHeadTokenVar(),
          },
          refetchQueries: ['NodeGraph', 'EditorPublishState'],
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.deleteNode;
        if (payload && payload.messages.length > 0) {
          const message = payload.messages.map((m) => m.message).join('; ');
          throw new Error(message || 'Failed to delete node');
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
    [client, instance.id, mutate]
  );
}
