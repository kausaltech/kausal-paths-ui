import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type {
  UpdateInputPortInput,
  UpdateInputPortMutation,
  UpdateOutputPortInput,
  UpdateOutputPortMutation,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import {
  UPDATE_INPUT_PORT,
  UPDATE_OUTPUT_PORT,
  draftHeadTokenVar,
  staleVersionNotificationVar,
} from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

// Backend Maybe semantics: an omitted field is untouched. Codegen input types
// require every field, so we strip unset ones and cast (see
// useUpdateNodeMutation for the same convention).
function stripUnset<T>(input: Partial<T>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== null && v !== undefined) out[k] = v;
  }
  return out as T;
}

export type InputPortUpdateResult = Extract<
  UpdateInputPortMutation['instanceEditor']['nodeEditor']['updateInputPort'],
  { __typename: 'UpdateInputPortResult' }
>;

export type OutputPortUpdateResult = Extract<
  UpdateOutputPortMutation['instanceEditor']['nodeEditor']['updateOutputPort'],
  { __typename: 'UpdateOutputPortResult' }
>;

function useStaleVersionHandler() {
  const client = useApolloClient();
  return useCallback(
    (err: unknown) => {
      const isStale =
        CombinedGraphQLErrors.is(err) &&
        err.errors.some((e) => e.extensions?.code === 'stale_version');
      if (isStale) {
        staleVersionNotificationVar(true);
        void client.refetchQueries({ include: ['EditorPublishState'] });
      }
    },
    [client]
  );
}

/**
 * Update fields of one input port in place; fields left out of `input` are
 * untouched, so bindings and label translations survive the edit. Handles the
 * editor's write plumbing (draft-head version token, stale-version notice) and
 * refetches the no-cache NodeGraph so the changed port is visible. Resolves to
 * the success payload — the updated port plus the structural conflicts still
 * touching the node — or throws with the backend's failure message.
 */
export function useUpdateInputPort() {
  const instance = useInstance();
  const editorContext = useEditorApolloContext();
  const handleStale = useStaleVersionHandler();
  const [mutate] = useMutation(UPDATE_INPUT_PORT);
  return useCallback(
    async (nodeId: string, portId: string, input: Partial<UpdateInputPortInput>) => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            nodeId,
            portId,
            input: stripUnset(input),
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries: ['NodeGraph', 'EditorPublishState'],
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.nodeEditor.updateInputPort;
        if (payload?.__typename !== 'UpdateInputPortResult') {
          const message =
            payload?.__typename === 'OperationInfo'
              ? payload.messages.map((m) => m.message).join('; ')
              : null;
          throw new Error(message || 'Failed to update input port');
        }
        return payload;
      } catch (err) {
        handleStale(err);
        throw err;
      }
    },
    [instance.id, mutate, editorContext, handleStale]
  );
}

/** Output-port counterpart of {@link useUpdateInputPort}. */
export function useUpdateOutputPort() {
  const instance = useInstance();
  const editorContext = useEditorApolloContext();
  const handleStale = useStaleVersionHandler();
  const [mutate] = useMutation(UPDATE_OUTPUT_PORT);
  return useCallback(
    async (nodeId: string, portId: string, input: Partial<UpdateOutputPortInput>) => {
      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            nodeId,
            portId,
            input: stripUnset(input),
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries: ['NodeGraph', 'EditorPublishState'],
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.nodeEditor.updateOutputPort;
        if (payload?.__typename !== 'UpdateOutputPortResult') {
          const message =
            payload?.__typename === 'OperationInfo'
              ? payload.messages.map((m) => m.message).join('; ')
              : null;
          throw new Error(message || 'Failed to update output port');
        }
        return payload;
      } catch (err) {
        handleStale(err);
        throw err;
      }
    },
    [instance.id, mutate, editorContext, handleStale]
  );
}
