import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import { useInstance } from '@/common/instance';
import { constraintViolationError } from './constraintViolations';
import { CREATE_EDGE, draftHeadTokenVar, staleVersionNotificationVar } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

export type CreateEdgeArgs = {
  fromNodeUuid: string;
  toNodeUuid: string;
  fromPort: string;
  toPort: string;
  /** Atomically displace the current binding on an occupied non-multi port. */
  replace?: boolean;
};

/**
 * Create a node→node edge using canonical node and port UUIDs. The NodeGraph
 * query is `no-cache`, so we refetch it (and the publish state) to surface the
 * new edge.
 */
export function useCreateEdge() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation(CREATE_EDGE);

  return useCallback(
    async ({ fromNodeUuid, toNodeUuid, fromPort, toPort, replace = false }: CreateEdgeArgs) => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            input: {
              instanceId: instance.id,
              fromRef: { nodeUuid: fromNodeUuid, portId: fromPort },
              portRef: { nodeUuid: toNodeUuid, portId: toPort },
              replace,
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
        if (payload?.__typename === 'ConstraintViolations') {
          constraintViolationError(payload);
        }
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
