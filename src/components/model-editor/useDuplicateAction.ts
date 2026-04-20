import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type {
  CreateNodeInput,
  CreateNodeMutation,
  CreateNodeMutationVariables,
  EditorNodeFieldsFragment,
  InputPortInput,
  NodeConfigInput,
  OutputPortInput,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { CREATE_NODE, draftHeadTokenVar, staleVersionNotificationVar } from './queries';

function pickUniqueIdentifier(
  sourceIdentifier: string,
  existingIdentifiers: ReadonlySet<string>
): string {
  const base = `${sourceIdentifier}_copy`;
  if (!existingIdentifiers.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}_${i}`;
    if (!existingIdentifiers.has(candidate)) return candidate;
  }
  throw new Error(`Could not find a unique identifier for "${sourceIdentifier}"`);
}

function buildPortInputs(source: EditorNodeFieldsFragment): {
  inputPorts: InputPortInput[];
  outputPorts: OutputPortInput[];
} {
  const spec = source.editor?.spec;
  const inputPorts: InputPortInput[] = (spec?.inputPorts ?? []).map((port) => ({
    id: null,
    label: port.label ?? null,
    multi: port.multi,
    quantity: port.quantity ?? null,
    unit: port.unit?.standard ?? null,
    requiredDimensions: [...port.requiredDimensions],
    supportedDimensions: [...port.supportedDimensions],
  }));
  const outputPorts: OutputPortInput[] = (spec?.outputPorts ?? []).map((port) => ({
    id: null,
    columnId: port.columnId ?? null,
    label: port.label ?? null,
    quantity: port.quantity ?? null,
    unit: port.unit?.standard ?? '',
    dimensions: [...port.dimensions],
    isEditable: true,
  }));
  return { inputPorts, outputPorts };
}

function buildConfig(source: EditorNodeFieldsFragment): NodeConfigInput | null {
  const typeConfig = source.editor?.spec?.typeConfig;
  if (!typeConfig) return null;
  switch (typeConfig.__typename) {
    case 'ActionConfigType':
      return {
        action: {
          nodeClass: typeConfig.nodeClass,
          decisionLevel: typeConfig.decisionLevel ?? null,
          group: typeConfig.group ?? null,
          parent: typeConfig.parent ?? null,
          noEffectValue: typeConfig.noEffectValue ?? null,
        },
      } as NodeConfigInput;
    case 'SimpleConfigType':
      return { simple: { nodeClass: typeConfig.nodeClass } } as NodeConfigInput;
    default:
      return null;
  }
}

export type DuplicateActionResult = {
  ok: true;
  newIdentifier: string;
  newName: string;
};

export function useDuplicateAction() {
  const instance = useInstance();
  const client = useApolloClient();
  const [mutate] = useMutation<CreateNodeMutation, CreateNodeMutationVariables>(CREATE_NODE);

  return useCallback(
    async (
      source: EditorNodeFieldsFragment,
      allNodes: readonly EditorNodeFieldsFragment[]
    ): Promise<DuplicateActionResult> => {
      if (source.kind == null) {
        throw new Error(`Cannot duplicate node "${source.identifier}" — missing kind`);
      }
      const config = buildConfig(source);
      if (config === null) {
        throw new Error(
          `Cannot duplicate node "${source.identifier}" — unsupported typeConfig "${
            source.editor?.spec?.typeConfig?.__typename ?? 'unknown'
          }"`
        );
      }
      const existingIdentifiers = new Set(allNodes.map((n) => n.identifier));
      const newIdentifier = pickUniqueIdentifier(source.identifier, existingIdentifiers);
      const newName = `Copy of ${source.name}`;
      const { inputPorts, outputPorts } = buildPortInputs(source);
      const input: CreateNodeInput = {
        identifier: newIdentifier,
        name: newName,
        kind: source.kind,
        color: source.color ?? null,
        isVisible: source.isVisible,
        isOutcome: source.__typename === 'Node' ? source.isOutcome : false,
        shortName: source.shortName ?? null,
        description: source.description ?? null,
        nodeGroup: source.editor?.nodeGroup ?? null,
        inputPorts,
        outputPorts,
        inputDimensions: source.editor?.inputDimensions ?? null,
        outputDimensions: source.editor?.outputDimensions ?? null,
        tags: source.editor?.tags ?? null,
        config,
        allowNulls: false,
        order: null,
        i18n: null,
        inputDatasets: null,
        minimumYear: null,
        outputMetrics: null,
        params: null,
      };

      try {
        const result = await mutate({
          variables: {
            instanceId: instance.id,
            input,
            version: draftHeadTokenVar(),
          },
          refetchQueries: ['NodeGraph', 'EditorPublishState'],
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.createNode;
        if (payload?.__typename === 'OperationInfo') {
          const message = payload.messages.map((m) => m.message).join('; ');
          throw new Error(message || 'Failed to duplicate action');
        }
        return { ok: true, newIdentifier, newName };
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
