import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import { useInstance } from '@/common/instance';
import { SET_FORMULA, draftHeadTokenVar, staleVersionNotificationVar } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

/** The formula was refused; `message` is the backend's reason, meant for the user. */
export class FormulaRejectedError extends Error {}

function rejectionMessage(err: unknown): string | null {
  if (!CombinedGraphQLErrors.is(err)) return null;
  const messages = err.errors.map((e) => e.message).filter(Boolean);
  return messages.length ? messages.join('\n') : null;
}

/**
 * Replace a formula node's formula. The backend computes the node with the new
 * formula before saving, so a refusal is the normal outcome of a bad formula,
 * not a fault: it throws `FormulaRejectedError` carrying the reason (unknown
 * name, syntax error, unit mismatch, ...). Handles the editor's write plumbing
 * (draft-head version token, stale-version notice) and refetches what the new
 * formula changes: the node's parameters, the graph (which also re-runs the
 * node status check), its output data and its change history.
 */
export function useSetFormula() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation(SET_FORMULA);
  return useCallback(
    async (nodeId: string, formula: string) => {
      let result;
      try {
        result = await mutate({
          variables: {
            instanceId: instance.id,
            nodeId,
            formula,
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries: [
            'NodeParameters',
            'NodeGraph',
            'EditorPublishState',
            'NodeOutputData',
            'NodeChangeHistory',
          ],
          awaitRefetchQueries: true,
        });
      } catch (err) {
        const isStale =
          CombinedGraphQLErrors.is(err) &&
          err.errors.some((e) => e.extensions?.code === 'stale_version');
        if (isStale) {
          staleVersionNotificationVar(true);
          void client.refetchQueries({ include: ['EditorPublishState'] });
          throw err;
        }
        const message = rejectionMessage(err);
        if (message) throw new FormulaRejectedError(message);
        throw err;
      }
      const payload = result.data?.instanceEditor.nodeEditor.setFormula;
      if (payload?.__typename === 'OperationInfo') {
        throw new FormulaRejectedError(payload.messages.map((m) => m.message).join('\n'));
      }
      return payload;
    },
    [instance.id, mutate, client, editorContext]
  );
}
