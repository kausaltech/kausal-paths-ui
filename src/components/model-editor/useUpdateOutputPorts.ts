import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type {
  InputPortInput,
  OutputPortInput,
  UpdateNodeInput,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { UPDATE_NODE, draftHeadTokenVar, staleVersionNotificationVar } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

/**
 * Shared core for whole-list port replacement via `updateNode`. The mutation
 * swaps the given port list wholesale, so callers must pass *all* ports (with
 * their existing `id`s preserved, or edges/bindings keyed on them are
 * orphaned).
 *
 * Unlike scalar field edits — which ride the `nodeGraphOverridesVar` overlay —
 * port changes aren't covered by that overlay, so we refetch the (no-cache)
 * NodeGraph to surface them.
 */
function useUpdateNodePorts() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation(UPDATE_NODE);

  return useCallback(
    async (nodeId: string, input: UpdateNodeInput, failureMessage: string) => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            nodeId,
            input,
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries: ['NodeGraph', 'EditorPublishState'],
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.updateNode;
        if (payload?.__typename === 'OperationInfo') {
          const message = payload.messages.map((m) => m.message).join('; ');
          throw new Error(message || failureMessage);
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

/**
 * Replace a node's output ports. Used to edit a port's unit/quantity/dimensions.
 *
 * `outputDimensions` rides along in the same mutation: the runtime engine
 * still enforces the node-level dimension list (ports' `dimensions` are the
 * canonical-but-not-yet-consumed representation), so callers editing port
 * dimensions pass the union here to keep the enforced contract in sync.
 */
export function useUpdateOutputPorts() {
  const updatePorts = useUpdateNodePorts();
  return useCallback(
    (nodeId: string, outputPorts: OutputPortInput[], outputDimensions?: string[]) =>
      updatePorts(
        nodeId,
        { outputPorts, outputDimensions } as UpdateNodeInput,
        'Failed to update output ports'
      ),
    [updatePorts]
  );
}

/** Replace a node's input ports. Used to edit a port's settings or delete a port. */
export function useUpdateInputPorts() {
  const updatePorts = useUpdateNodePorts();
  return useCallback(
    (nodeId: string, inputPorts: InputPortInput[]) =>
      updatePorts(nodeId, { inputPorts } as UpdateNodeInput, 'Failed to update input ports'),
    [updatePorts]
  );
}
