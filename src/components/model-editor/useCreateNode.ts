import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import {
  type CreateNodeInput,
  type CreateNodeMutation,
  type CreateNodeMutationVariables,
  type NodeConfigInput,
  NodeKind,
  type OutputPortInput,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { CREATE_NODE, draftHeadTokenVar, staleVersionNotificationVar } from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

/** Slugify a name into an identifier seed; falls back to "node". */
function toIdentifierBase(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug || 'node';
}

function pickUniqueIdentifier(base: string, existing: ReadonlySet<string>): string {
  if (!existing.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}_${i}`;
    if (!existing.has(candidate)) return candidate;
  }
  throw new Error(`Could not find a unique identifier for "${base}"`);
}

/** Which kind of node the "New …" flow creates. */
export type NewNodeKind = 'formula' | 'action';

// Generic action node class (nodes.actions.simple.GenericAction) — the most
// general action; the user refines its behavior afterward.
const GENERIC_ACTION_CLASS = 'simple.GenericAction';

export type CreateNodeArgs = {
  name: string;
  /** Output unit string, parsed by the backend (e.g. "kt/a"). */
  unit: string;
  /** Output quantity; must be one of the backend's known quantities. */
  quantity: string;
  /** Formula node or action node. */
  kind: NewNodeKind;
  /** Existing node identifiers, to derive a unique one from the name. */
  existingIdentifiers: ReadonlySet<string>;
};

export type CreateNodeResult = {
  ok: true;
  newId: string;
  newIdentifier: string;
};

/**
 * Create a new node with a single output port. A `formula` node defaults to the
 * formula "0" (a valid no-input computation, so the model still computes before
 * the user fills in the real expression — an empty formula would crash compute);
 * an `action` node uses the generic action class. Both are refined afterward.
 *
 * Mirrors `useDuplicateNode`: the create and the NodeGraph refetch are split by
 * an `onCreated` callback so the caller can seed layout state (the node's
 * position) before the copy appears, avoiding a race with the refetch.
 */
export function useCreateNode() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();
  const [mutate] = useMutation<CreateNodeMutation, CreateNodeMutationVariables>(CREATE_NODE);

  return useCallback(
    async (
      { name, unit, quantity, kind, existingIdentifiers }: CreateNodeArgs,
      onCreated?: (newId: string) => void
    ): Promise<CreateNodeResult> => {
      const newIdentifier = pickUniqueIdentifier(toIdentifierBase(name), existingIdentifiers);
      const outputPort: OutputPortInput = {
        id: crypto.randomUUID(),
        unit,
        columnId: null,
        label: null,
        quantity,
        dimensions: [],
        isEditable: true,
      };
      const isAction = kind === 'action';
      const config: NodeConfigInput = isAction
        ? ({ action: { nodeClass: GENERIC_ACTION_CLASS } } as NodeConfigInput)
        : ({ formula: { formula: '0' } } as NodeConfigInput);
      const input: CreateNodeInput = {
        identifier: newIdentifier,
        name,
        kind: isAction ? NodeKind.Action : NodeKind.Formula,
        config,
        color: null,
        isVisible: true,
        isOutcome: false,
        shortName: null,
        description: null,
        nodeGroup: null,
        inputPorts: [],
        outputPorts: [outputPort],
        inputDimensions: null,
        outputDimensions: null,
        tags: null,
        allowNulls: false,
        order: null,
        i18n: null,
        minimumYear: null,
        outputMetrics: null,
        params: null,
      };

      try {
        const result = await mutate({
          variables: { instanceId: instance.id, input, version: draftHeadTokenVar() },
          context: editorContext,
        });
        const payload = result.data?.instanceEditor.createNode;
        if (payload?.__typename === 'OperationInfo') {
          const message = payload.messages.map((m) => m.message).join('; ');
          throw new Error(message || 'Failed to create node');
        }
        if (!payload?.id) {
          throw new Error('Failed to create node — no id returned');
        }
        onCreated?.(payload.id);
        await client.refetchQueries({ include: ['NodeGraph', 'EditorPublishState'] });
        return { ok: true, newId: payload.id, newIdentifier };
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
