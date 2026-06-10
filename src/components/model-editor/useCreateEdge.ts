import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type {
  CreateEdgeMutation,
  CreateEdgeMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { CREATE_EDGE, draftHeadTokenVar, staleVersionNotificationVar } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

export type CreateEdgeArgs = {
  /** Source node *identifier* (not the GraphQL global id). */
  fromNodeId: string;
  /** Target node *identifier* (not the GraphQL global id). */
  toNodeId: string;
  /** Source output port id; defaults to "output" (single-output nodes). */
  fromPort?: string;
  /** Target input port id; null lets the backend resolve/append one. */
  toPort?: string | null;
};

/**
 * Create a node→node edge. `createEdge` resolves nodes by identifier, so the
 * caller must pass identifiers, not global ids. The NodeGraph query is
 * `no-cache`, so we refetch it (and the publish state) to surface the new edge.
 */
export function useCreateEdge() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation<CreateEdgeMutation, CreateEdgeMutationVariables>(CREATE_EDGE);

  return useCallback(
    async ({ fromNodeId, toNodeId, fromPort = 'output', toPort = null }: CreateEdgeArgs) => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            input: {
              instanceId: instance.id,
              fromNodeId,
              toNodeId,
              fromPort,
              toPort,
              // Optional in the schema (defaults to null), but codegen types it
              // as required — send it explicitly.
              transformations: null,
            },
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries: ['NodeGraph', 'EditorPublishState'],
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.createEdge;
        if (payload?.__typename === 'OperationInfo') {
          const message = payload.messages.map((m) => m.message).join('; ');
          throw new Error(message || 'Failed to create edge');
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
