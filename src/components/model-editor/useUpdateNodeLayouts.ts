import { useCallback } from 'react';

import { useMutation } from '@apollo/client/react';

import type {
  ClearNodeLayoutsMutation,
  ClearNodeLayoutsMutationVariables,
  UpdateNodeLayoutInput,
  UpdateNodeLayoutsMutation,
  UpdateNodeLayoutsMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { CLEAR_NODE_LAYOUTS, UPDATE_NODE_LAYOUTS } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

export function useUpdateNodeLayouts() {
  const instance = useInstance();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation<UpdateNodeLayoutsMutation, UpdateNodeLayoutsMutationVariables>(
    UPDATE_NODE_LAYOUTS
  );

  return useCallback(
    async (input: readonly UpdateNodeLayoutInput[]): Promise<void> => {
      if (input.length === 0) return;
      const result = await mutate({
        variables: { instanceId: instance.id, input: [...input] },
        context: editorContext,
      });
      const payload = result.data?.instanceEditor.updateNodeLayouts;
      if (payload?.__typename === 'OperationInfo') {
        const message = payload.messages.map((entry) => entry.message).join('; ');
        throw new Error(message || 'Failed to update node layouts');
      }
      if (payload?.__typename !== 'UpdateNodeLayoutsResult') {
        throw new Error('Failed to update node layouts — no result returned');
      }
    },
    [editorContext, instance.id, mutate]
  );
}

export function useClearNodeLayouts() {
  const instance = useInstance();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation<ClearNodeLayoutsMutation, ClearNodeLayoutsMutationVariables>(
    CLEAR_NODE_LAYOUTS
  );

  return useCallback(async (): Promise<void> => {
    const result = await mutate({
      variables: { instanceId: instance.id },
      context: editorContext,
    });
    const messages = result.data?.instanceEditor.clearNodeLayouts?.messages ?? [];
    if (messages.length > 0) {
      throw new Error(messages.map((entry) => entry.message).join('; '));
    }
  }, [editorContext, instance.id, mutate]);
}
