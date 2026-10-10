import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type { CreateActionFromPortsInput } from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { constraintViolationError } from '../constraintViolations';
import { draftHeadTokenVar, staleVersionNotificationVar } from '../queries';
import { useEditorApolloContext } from '../useEditorApolloContext';
import { CREATE_ACTION_FROM_PORTS } from './queries';

export type CreatedAction = {
  /** NodeInterface.id of the new action. */
  actionId: string;
  /** The datasets the action owns, for the modeller to fill in; empty when every effect has an existing source. */
  datasetIds: string[];
};

/**
 * Create an action and all its effects in one mutation; the backend refuses
 * the whole set or writes all of it. Refetches the node graph afterwards, as
 * `useCreateNode` does.
 */
export function useCreateActionFromPorts() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation(CREATE_ACTION_FROM_PORTS);

  return useCallback(
    async (input: CreateActionFromPortsInput): Promise<CreatedAction> => {
      try {
        const result = await mutate({
          variables: { instanceId: instance.id, input, version: draftHeadTokenVar() },
          context: editorContext,
        });
        const payload = result.data?.instanceEditor.createActionFromPorts;
        if (payload?.__typename === 'OperationInfo') {
          throw new Error(
            payload.messages.map((m) => m.message).join('; ') || 'Failed to create action'
          );
        }
        if (payload?.__typename === 'ConstraintViolations') constraintViolationError(payload);
        if (payload?.__typename !== 'CreateActionFromPortsResult' || !payload.action) {
          throw new Error('Failed to create action');
        }
        await client.refetchQueries({ include: ['NodeGraph', 'EditorPublishState'] });
        return { actionId: payload.action.id, datasetIds: payload.datasets.map((d) => d.id) };
      } catch (err) {
        if (
          CombinedGraphQLErrors.is(err) &&
          err.errors.some((e) => e.extensions?.code === 'stale_version')
        ) {
          staleVersionNotificationVar(true);
          void client.refetchQueries({ include: ['EditorPublishState'] });
        }
        throw err;
      }
    },
    [client, editorContext, instance.id, mutate]
  );
}
