import { useCallback } from 'react';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient, useMutation } from '@apollo/client/react';

import type {
  AddInputPortMutation,
  AddInputPortMutationVariables,
  BindDatasetMutation,
  BindDatasetMutationVariables,
  DatasetTransformationInput,
  DeleteBindingMutation,
  DeleteBindingMutationVariables,
  EdgeTransformationInput,
  UpdateDatasetBindingMutation,
  UpdateDatasetBindingMutationVariables,
  UpdateEdgeBindingMutation,
  UpdateEdgeBindingMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import {
  ADD_INPUT_PORT,
  BIND_DATASET,
  DELETE_BINDING,
  UPDATE_DATASET_BINDING,
  UPDATE_EDGE_BINDING,
  draftHeadTokenVar,
  staleVersionNotificationVar,
} from './queries';
import { useEditorApolloContext } from './useEditorApolloContext';

function operationError(payload: { messages: readonly { message: string }[] } | null | undefined) {
  if (!payload) return;
  const message = payload.messages.map((entry) => entry.message).join('; ');
  throw new Error(message || 'Binding operation failed');
}

function useBindingMutationContext() {
  const instance = useInstance();
  const client = useApolloClient();
  const editorContext = useEditorApolloContext();

  const handleError = useCallback(
    (error: unknown) => {
      const stale =
        CombinedGraphQLErrors.is(error) &&
        error.errors.some((entry) => entry.extensions?.code === 'stale_version');
      if (stale) {
        staleVersionNotificationVar(true);
        void client.refetchQueries({ include: ['EditorPublishState'] });
      }
    },
    [client]
  );

  return { instanceId: instance.id, editorContext, handleError };
}

const refetchQueries = ['NodeGraph', 'EditorPublishState'];

export function useBindDataset() {
  const { instanceId, editorContext, handleError } = useBindingMutationContext();
  const [mutate] = useMutation<BindDatasetMutation, BindDatasetMutationVariables>(BIND_DATASET);

  return useCallback(
    async (args: {
      nodeId: string;
      portId: string;
      datasetId: string;
      metricId: string;
      replace: boolean;
    }) => {
      try {
        const result = await mutate({
          variables: {
            instanceId,
            nodeId: args.nodeId,
            input: {
              portId: args.portId,
              datasetId: args.datasetId,
              metricId: args.metricId,
              transformations: null,
              replace: args.replace,
            },
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries,
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.nodeEditor.bindDataset;
        if (payload?.__typename === 'OperationInfo') operationError(payload);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [editorContext, handleError, instanceId, mutate]
  );
}

/**
 * Append a bare input port to a node. All port attributes default to null
 * (any quantity/unit accepted); the port starts unbound and is wired up
 * afterward via the binding selector.
 */
export function useAddInputPort() {
  const { instanceId, editorContext, handleError } = useBindingMutationContext();
  const [mutate] = useMutation<AddInputPortMutation, AddInputPortMutationVariables>(ADD_INPUT_PORT);

  return useCallback(
    async (args: { nodeId: string; label?: string; multi?: boolean }) => {
      try {
        const result = await mutate({
          variables: {
            instanceId,
            nodeId: args.nodeId,
            input: {
              id: null,
              identifier: null,
              label: args.label ?? null,
              quantity: null,
              unit: null,
              multi: args.multi ?? false,
              requiredDimensions: null,
              supportedDimensions: null,
            },
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries,
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.nodeEditor.addInputPort;
        if (payload?.__typename === 'OperationInfo') operationError(payload);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [editorContext, handleError, instanceId, mutate]
  );
}

export function useUpdateDatasetBinding() {
  const { instanceId, editorContext, handleError } = useBindingMutationContext();
  const [mutate] = useMutation<UpdateDatasetBindingMutation, UpdateDatasetBindingMutationVariables>(
    UPDATE_DATASET_BINDING
  );

  return useCallback(
    async (args: {
      bindingId: string;
      transformations?: DatasetTransformationInput[];
      tags?: string[];
      metricId?: string;
    }) => {
      try {
        const result = await mutate({
          variables: {
            instanceId,
            bindingId: args.bindingId,
            input: {
              metricId: args.metricId,
              transformations: args.transformations,
              tags: args.tags,
            },
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries,
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.bindingEditor.updateDatasetBinding;
        if (payload?.__typename === 'OperationInfo') operationError(payload);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [editorContext, handleError, instanceId, mutate]
  );
}

export function useUpdateEdgeBinding() {
  const { instanceId, editorContext, handleError } = useBindingMutationContext();
  const [mutate] = useMutation<UpdateEdgeBindingMutation, UpdateEdgeBindingMutationVariables>(
    UPDATE_EDGE_BINDING
  );

  return useCallback(
    async (args: {
      bindingId: string;
      transformations?: EdgeTransformationInput[];
      tags?: string[];
    }) => {
      try {
        const result = await mutate({
          variables: {
            instanceId,
            bindingId: args.bindingId,
            input: {
              transformations: args.transformations,
              tags: args.tags,
            },
            version: draftHeadTokenVar(),
          },
          context: editorContext,
          refetchQueries,
          awaitRefetchQueries: true,
        });
        const payload = result.data?.instanceEditor.bindingEditor.updateEdgeBinding;
        if (payload?.__typename === 'OperationInfo') operationError(payload);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [editorContext, handleError, instanceId, mutate]
  );
}

export function useDeleteBinding() {
  const { instanceId, editorContext, handleError } = useBindingMutationContext();
  const [mutate] = useMutation<DeleteBindingMutation, DeleteBindingMutationVariables>(
    DELETE_BINDING
  );

  return useCallback(
    async (bindingId: string) => {
      try {
        const result = await mutate({
          variables: { instanceId, bindingId, version: draftHeadTokenVar() },
          context: editorContext,
          refetchQueries,
          awaitRefetchQueries: true,
        });
        operationError(result.data?.instanceEditor.bindingEditor.deleteBinding);
      } catch (error) {
        handleError(error);
        throw error;
      }
    },
    [editorContext, handleError, instanceId, mutate]
  );
}
