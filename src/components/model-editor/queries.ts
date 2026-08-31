import { type TypedDocumentNode, gql, makeVar } from '@apollo/client';

import type {
  AddInputPortMutation,
  AddInputPortMutationVariables,
  AvailableDatasetsQuery,
  AvailableDatasetsQueryVariables,
  BindDatasetMutation,
  BindDatasetMutationVariables,
  ClearNodeLayoutsMutation,
  ClearNodeLayoutsMutationVariables,
  CreateEdgeMutation,
  CreateEdgeMutationVariables,
  CreateNodeMutation,
  CreateNodeMutationVariables,
  DeleteBindingMutation,
  DeleteBindingMutationVariables,
  DeleteEdgeMutation,
  DeleteEdgeMutationVariables,
  DeleteNodeMutation,
  DeleteNodeMutationVariables,
  EditorPublishStateQuery,
  EditorPublishStateQueryVariables,
  NodeChangeHistoryQuery,
  NodeChangeHistoryQueryVariables,
  NodeErrorPhase,
  NodeGraphQuery,
  NodeGraphQueryVariables,
  NodeParametersQuery,
  NodeParametersQueryVariables,
  NodeStatus,
  NodeStatusesQuery,
  NodeStatusesQueryVariables,
  NodeTranslationQuery,
  NodeTranslationQueryVariables,
  PublishModelInstanceMutation,
  PublishModelInstanceMutationVariables,
  UpdateDatasetBindingMutation,
  UpdateDatasetBindingMutationVariables,
  UpdateEdgeBindingMutation,
  UpdateEdgeBindingMutationVariables,
  UpdateInputPortMutation,
  UpdateInputPortMutationVariables,
  UpdateNodeLayoutsMutation,
  UpdateNodeLayoutsMutationVariables,
  UpdateNodeMutation,
  UpdateNodeMutationVariables,
  UpdateOutputPortMutation,
  UpdateOutputPortMutationVariables,
} from '@/common/__generated__/graphql';

// NodeGraph uses fetchPolicy: 'no-cache' for size reasons, so Apollo's
// normalized cache updates from the updateNode mutation don't reach it.
// This reactive var lets NodeDetailsSection push updated fields to any
// consumer that renders nodes from the NodeGraph query.
export type NodeFieldOverrides = {
  name?: string;
  shortName?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  color?: string | null;
  isVisible?: boolean;
  isOutcome?: boolean;
  nodeGroup?: string | null;
  actionGroup?: { id: string; uuid: string; name: string; color: string | null } | null;
};

export const nodeGraphOverridesVar = makeVar<Record<string, NodeFieldOverrides>>({});

export function patchNodeGraphOverride(nodeId: string, patch: NodeFieldOverrides): void {
  const current = nodeGraphOverridesVar();
  nodeGraphOverridesVar({
    ...current,
    [nodeId]: { ...(current[nodeId] ?? {}), ...patch },
  });
}

/**
 * Per-node fault-tolerance status, surfaced in the editor's node cards and
 * details panel. Lives in a reactive var (not the Apollo cache) because the
 * NodeGraph query runs `fetchPolicy: 'no-cache'`, so the async compute-status
 * passes can't reach graph consumers through normalized cache updates.
 *
 * Lifecycle:
 *  - Phase 1 (structural NodeGraph query, compute: false) seeds init-time
 *    status with `pending: true` — compute-phase status is not yet known.
 *  - Phase 2 (NodeStatuses query, compute: true) replaces each entry and
 *    clears `pending`.
 *  - After an edit, the edited node + its downstream cone are marked pending
 *    and re-fetched via NodeStatusDownstream.
 */
export type NodeStatusError = { phase: NodeErrorPhase; message: string };
export type NodeStatusEntry = {
  status: NodeStatus;
  errors: NodeStatusError[];
  /** True while a compute-phase result for this node is still in flight. */
  pending: boolean;
};

export const nodeStatusVar = makeVar<Record<string, NodeStatusEntry>>({});

/**
 * Merge settled compute-phase status entries in, clearing `pending`. Used by
 * the phase-2 pass once the backend has finished computing.
 */
export function setNodeStatuses(entries: Record<string, NodeStatusEntry>): void {
  nodeStatusVar({ ...nodeStatusVar(), ...entries });
}

/**
 * Last-seen `draftHeadToken` for the current instance. Editing mutations
 * pass this as the `version` arg on `instanceEditor(instanceId, version)`;
 * the backend rejects writes with a `StaleVersionError` when the instance's
 * head has advanced past it (e.g. another tab edited first).
 *
 * Seeded from the landing-page and NodeGraph queries. Refetched after each
 * mutation so subsequent writes see the new head.
 */
export const draftHeadTokenVar = makeVar<string | null>(null);

/**
 * Which slice the editor is viewing. DRAFT is the editor's working copy;
 * PUBLISHED is whatever is currently live (read-only preview — see
 * `useIsEditorReadOnly`). `ApolloWrapper.detectPreviewMode` reads this
 * lazily on every operation issued from an editor route and attaches it as
 * the `preview` arg on the `@instance` directive; the toggle in
 * `ModelEditorNav` re-runs all active queries against the new slice.
 */
export type EditorPreviewMode = 'DRAFT' | 'PUBLISHED';
export const editorPreviewModeVar = makeVar<EditorPreviewMode>('DRAFT');

/**
 * Set to true when a mutation is rejected with a `stale_version` error —
 * another tab (or user) has edited this instance since we last read the
 * token. A top-level `StaleVersionNotice` snackbar subscribes and prompts
 * the user to reload. Cleared on reload or when the user dismisses.
 */
export const staleVersionNotificationVar = makeVar<boolean>(false);

export const EDITOR_PORT_TRANSFORMATION = gql`
  fragment EditorPortTransformation on PortTransformation {
    kind
    isSystemManaged
    ... on FilterDimensionType {
      dimension
      groups
      categories
      exclude
      flatten
    }
    ... on AssignDimensionType {
      dimension
      category
    }
    ... on FilterTemporalType {
      minYear
      maxYear
    }
    ... on FilterColumnType {
      column
      value
      values
      ref
      dropCol
      exclude
      flatten
    }
    ... on RenameColumnType {
      column
      newName
    }
    ... on RenameItemType {
      column
      oldItem
      newItem
    }
    ... on SetForecastFromType {
      year
    }
    ... on EnsureUnitType {
      unit {
        id
        short
        standard
      }
    }
    ... on TagOperationType {
      tag
    }
    ... on SelectCategoriesType {
      dimension
      categories
      flatten
      exclude
    }
    ... on AssignCategoryType {
      dimension
      category
    }
  }
`;

/**
 * The whole-model structural query behind the node graph editor. Runs with
 * `fetchPolicy: 'no-cache'` (see NodeGraphEditor) because the result spans the
 * entire model; updates reach graph consumers via the reactive vars above
 * instead of normalized-cache writes.
 */
export const GET_NODE_GRAPH: TypedDocumentNode<NodeGraphQuery, NodeGraphQueryVariables> = gql`
  # eslint-disable @graphql-eslint/selection-set-depth -- editor/spec/binding transformation nesting exceeds the generic limit.
  query NodeGraph {
    instance {
      id
      identifier
      actionGroups {
        id
        uuid
        name
        color
      }
      editor {
        nodeLayouts {
          nodeId
          x
          y
          source
        }
        graphLayout {
          thresholds {
            hubDegree
            ghostableOutDegree
            ghostableTotalDegree
            ghostableAvgOutgoingSpan
          }
          coreNodeIds
          ghostableContextSourceIds
          hubIds
          actionIds
          outcomeIds
          mainGraphNodeIds
        }
        edges {
          id
          ...EditorNodeEdge
        }
      }
      model {
        nodes {
          id
          ...EditorNodeFields
        }
      }
    }
  }
  fragment EditorNodeFields on NodeInterface {
    id
    isEditable
    userPermissions {
      change
      delete
    }
    identifier
    name
    shortName
    description
    shortDescription
    color
    isVisible
    uuid
    kind
    quantityKind {
      icon
      id
      label
    }
    ... on Node {
      isOutcome
    }
    ... on ActionNode {
      isEnabled
      group {
        id
        name
        color
      }
    }
    editor {
      layout {
        nodeId
        x
        y
        source
      }
      nodeGroup
      nodeType
      tags
      inputDimensions
      outputDimensions
      # Phase 1: init-time status only (compute: false). Compute-phase status is
      # fetched asynchronously afterwards via the NodeStatuses query.
      status
      errors {
        phase
        message
      }
      layoutMeta {
        primaryClass
        isHub
        ghostable
        ghostTargets
        canonicalRail
        topologicalLayer
        inDegree
        outDegree
        totalDegree
        avgOutgoingSpan
        maxOutgoingSpan
        hasActionAncestor
      }
      spec {
        # Add-port affordances: declared semantic input roles (a repeatable
        # role can always take another port instance, a non-repeatable one at
        # most one) and whether free-form authored ports are allowed.
        supportsAuthoredPorts
        inputPortDeclarations {
          role
          label
          multi
          repeatable
          minCount
          defaultCount
          instantiatedPortIds
        }
        inputPorts {
          id
          identifier
          label
          multi
          quantity
          role
          # Solver-derived shape of the aggregate value delivered to this
          # port; null when the solver couldn't determine it.
          effectiveShape {
            quantity
            dimensionUuids
            requiredDimensionUuids
            forbiddenDimensionUuids
            unit {
              id
              short
              htmlShort
            }
          }
          unit {
            id
            short
            standard
            dimensionality {
              dimension
              value
            }
          }
          requiredDimensions
          bindings {
            __typename
            ... on DatasetPortType {
              id
              tags
              portRef {
                nodeUuid
                portId
              }
              dataset {
                id
                identifier
                name
                metrics {
                  id
                  label
                  unitInfo {
                    id
                    standard
                  }
                }
              }
              metric {
                id
                label
              }
              transformations {
                ...EditorPortTransformation
              }
            }
            ... on NodeEdgeType {
              id
              tags
              portRef {
                nodeUuid
                portId
              }
              transformations {
                ...EditorPortTransformation
              }
            }
          }
        }
        outputPorts {
          id
          identifier
          label
          quantity
          role
          columnId
          unit {
            id
            short
            standard
          }
          dimensions
        }
        typeConfig {
          __typename
          ... on SimpleConfigType {
            nodeClass
          }
          ... on ActionConfigType {
            nodeClass
            decisionLevel
            group
            parent
            noEffectValue
          }
          ... on FormulaConfigType {
            formula
          }
          ... on PipelineConfigType {
            operations
          }
        }
      }
    }
  }
  fragment EditorNodeEdge on NodeEdgeType {
    id
    tags
    fromRef {
      nodeUuid
      portId
    }
    portRef {
      nodeUuid
      portId
    }
    transformations {
      ...EditorPortTransformation
    }
  }
  ${EDITOR_PORT_TRANSFORMATION}
`;

const EDITOR_OPERATION_INFO_FIELDS = gql`
  fragment EditorOperationInfoFields on OperationInfo {
    messages {
      kind
      field
      message
      code
    }
  }
`;

/**
 * Structural conflicts the constraint solver found in a rejected write.
 * Returned instead of the success type by createEdge, bindDataset,
 * updateDatasetBinding, updateEdgeBinding and publishModelInstance; nothing
 * was written when this comes back.
 */
export const CONSTRAINT_VIOLATIONS_FIELDS = gql`
  fragment ConstraintViolationsFields on ConstraintViolations {
    conflicts {
      code
      message
      origins {
        kind
        nodeUuid
        portId
        bindingId
        transformationIndex
      }
      value {
        kind
        direction
        nodeUuid
        portId
        bindingId
      }
    }
  }
`;

/**
 * One structural conflict as reported back by the in-place port update
 * mutations. Same shape as the conflicts inside ConstraintViolationsFields,
 * but selected on the bare ConstraintConflict list of the success payload.
 */
export const PORT_UPDATE_CONFLICT_FIELDS = gql`
  fragment PortUpdateConflictFields on ConstraintConflict {
    code
    message
    origins {
      kind
      nodeUuid
      portId
      bindingId
    }
    value {
      kind
      direction
      nodeUuid
      portId
      bindingId
    }
  }
`;

export const INSTANCE_EDITOR_PUBLISH_STATE = gql`
  fragment InstanceEditorPublishState on InstanceEditor {
    live
    hasUnpublishedChanges
    firstPublishedAt
    lastPublishedAt
    draftHeadToken
  }
`;

export const GET_INSTANCE_EDITOR_PUBLISH_STATE: TypedDocumentNode<
  EditorPublishStateQuery,
  EditorPublishStateQueryVariables
> = gql`
  query EditorPublishState {
    instance {
      id
      siteTitle
      editor {
        ...InstanceEditorPublishState
      }
    }
  }
  ${INSTANCE_EDITOR_PUBLISH_STATE}
`;

export const PUBLISH_MODEL_INSTANCE: TypedDocumentNode<
  PublishModelInstanceMutation,
  PublishModelInstanceMutationVariables
> = gql`
  mutation PublishModelInstance($instanceId: ID!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      publishModelInstance(instanceId: $instanceId) {
        __typename
        ... on InstanceType {
          id
          editor {
            ...InstanceEditorPublishState
          }
        }
        ... on OperationInfo {
          ...EditorOperationInfoFields
        }
        ... on ConstraintViolations {
          ...ConstraintViolationsFields
        }
      }
    }
  }
  ${INSTANCE_EDITOR_PUBLISH_STATE}
  ${EDITOR_OPERATION_INFO_FIELDS}
  ${CONSTRAINT_VIOLATIONS_FIELDS}
`;

export const CREATE_NODE: TypedDocumentNode<CreateNodeMutation, CreateNodeMutationVariables> = gql`
  mutation CreateNode($instanceId: ID!, $input: CreateNodeInput!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      createNode(input: $input) {
        __typename
        ... on Node {
          id
          identifier
          name
          uuid
        }
        ... on ActionNode {
          id
          identifier
          name
          uuid
        }
        ... on OperationInfo {
          ...EditorOperationInfoFields
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

/**
 * A node's parameter values, resolved in the editor slice. Used by node
 * duplication to carry the source node's parameters (e.g. a `formula` string,
 * numeric constants) — these hold node logic that isn't part of `typeConfig`.
 * Fetched on demand rather than in the NodeGraph query, which spans the whole
 * model and would bloat with per-node parameter lists.
 */
type NodeParametersDocument = TypedDocumentNode<NodeParametersQuery, NodeParametersQueryVariables>;

export const NODE_PARAMETERS: NodeParametersDocument = gql`
  query NodeParameters($nodeId: ID!) {
    node(id: $nodeId) {
      id
      parameters {
        __typename
        id
        nodeRelativeId
        isCustomizable
        ... on BoolParameterType {
          boolValue: value
        }
        ... on NumberParameterType {
          numberValue: value
        }
        ... on StringParameterType {
          stringValue: value
        }
      }
    }
  }
`;

export const CREATE_EDGE: TypedDocumentNode<CreateEdgeMutation, CreateEdgeMutationVariables> = gql`
  mutation CreateEdge($instanceId: ID!, $input: CreateEdgeInput!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      createEdge(input: $input) {
        __typename
        ... on NodeEdgeType {
          id
          fromRef {
            nodeUuid
            portId
          }
          portRef {
            nodeUuid
            portId
          }
        }
        ... on OperationInfo {
          ...EditorOperationInfoFields
        }
        ... on ConstraintViolations {
          ...ConstraintViolationsFields
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
  ${CONSTRAINT_VIOLATIONS_FIELDS}
`;

type BindDatasetDocument = TypedDocumentNode<BindDatasetMutation, BindDatasetMutationVariables>;

export const BIND_DATASET: BindDatasetDocument = gql`
  mutation BindDataset($instanceId: ID!, $nodeId: ID!, $input: BindDatasetInput!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      nodeEditor(nodeId: $nodeId) {
        bindDataset(input: $input) {
          __typename
          ... on DatasetPortType {
            id
          }
          ... on OperationInfo {
            ...EditorOperationInfoFields
          }
          ... on ConstraintViolations {
            ...ConstraintViolationsFields
          }
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
  ${CONSTRAINT_VIOLATIONS_FIELDS}
`;

export const UPDATE_DATASET_BINDING: TypedDocumentNode<
  UpdateDatasetBindingMutation,
  UpdateDatasetBindingMutationVariables
> = gql`
  mutation UpdateDatasetBinding(
    $instanceId: ID!
    $bindingId: ID!
    $input: UpdateDatasetBindingInput!
    $version: UUID
  ) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      bindingEditor(bindingId: $bindingId) {
        updateDatasetBinding(input: $input) {
          __typename
          ... on DatasetPortType {
            id
          }
          ... on OperationInfo {
            ...EditorOperationInfoFields
          }
          ... on ConstraintViolations {
            ...ConstraintViolationsFields
          }
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
  ${CONSTRAINT_VIOLATIONS_FIELDS}
`;

export const UPDATE_EDGE_BINDING: TypedDocumentNode<
  UpdateEdgeBindingMutation,
  UpdateEdgeBindingMutationVariables
> = gql`
  mutation UpdateEdgeBinding(
    $instanceId: ID!
    $bindingId: ID!
    $input: UpdateEdgeBindingInput!
    $version: UUID
  ) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      bindingEditor(bindingId: $bindingId) {
        updateEdgeBinding(input: $input) {
          __typename
          ... on NodeEdgeType {
            id
          }
          ... on OperationInfo {
            ...EditorOperationInfoFields
          }
          ... on ConstraintViolations {
            ...ConstraintViolationsFields
          }
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
  ${CONSTRAINT_VIOLATIONS_FIELDS}
`;

export const ADD_INPUT_PORT: TypedDocumentNode<
  AddInputPortMutation,
  AddInputPortMutationVariables
> = gql`
  mutation AddInputPort($instanceId: ID!, $nodeId: ID!, $input: InputPortInput!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      nodeEditor(nodeId: $nodeId) {
        addInputPort(input: $input) {
          __typename
          ... on InputPortType {
            id
          }
          ... on OperationInfo {
            ...EditorOperationInfoFields
          }
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const DELETE_BINDING: TypedDocumentNode<
  DeleteBindingMutation,
  DeleteBindingMutationVariables
> = gql`
  mutation DeleteBinding($instanceId: ID!, $bindingId: ID!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      bindingEditor(bindingId: $bindingId) {
        deleteBinding {
          ...EditorOperationInfoFields
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const DELETE_EDGE: TypedDocumentNode<DeleteEdgeMutation, DeleteEdgeMutationVariables> = gql`
  mutation DeleteEdge($instanceId: ID!, $edgeId: ID!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      deleteEdge(edgeId: $edgeId) {
        ...EditorOperationInfoFields
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const DELETE_NODE: TypedDocumentNode<DeleteNodeMutation, DeleteNodeMutationVariables> = gql`
  mutation DeleteNode($instanceId: ID!, $nodeId: ID!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      nodeEditor(nodeId: $nodeId) {
        delete {
          ...EditorOperationInfoFields
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const UPDATE_NODE_LAYOUTS: TypedDocumentNode<
  UpdateNodeLayoutsMutation,
  UpdateNodeLayoutsMutationVariables
> = gql`
  mutation UpdateNodeLayouts($instanceId: ID!, $input: [UpdateNodeLayoutInput!]!) {
    instanceEditor(instanceId: $instanceId) {
      updateNodeLayouts(input: $input) {
        ... on UpdateNodeLayoutsResult {
          layouts {
            nodeId
            x
            y
            source
          }
        }
        ... on OperationInfo {
          ...EditorOperationInfoFields
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const CLEAR_NODE_LAYOUTS: TypedDocumentNode<
  ClearNodeLayoutsMutation,
  ClearNodeLayoutsMutationVariables
> = gql`
  mutation ClearNodeLayouts($instanceId: ID!) {
    instanceEditor(instanceId: $instanceId) {
      clearNodeLayouts {
        ...EditorOperationInfoFields
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const UPDATE_NODE: TypedDocumentNode<UpdateNodeMutation, UpdateNodeMutationVariables> = gql`
  mutation UpdateNode($instanceId: ID!, $nodeId: ID!, $input: UpdateNodeInput!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      nodeEditor(nodeId: $nodeId) {
        update(input: $input) {
          __typename
          ... on Node {
            id
            name
            shortName
            description
            shortDescription
            color
            isVisible
            isOutcome
            editor {
              nodeGroup
            }
          }
          ... on ActionNode {
            id
            name
            shortName
            description
            shortDescription
            color
            isVisible
            group {
              id
              uuid
              name
              color
            }
            editor {
              nodeGroup
            }
          }
          ... on OperationInfo {
            ...EditorOperationInfoFields
          }
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

/**
 * In-place update of one port; fields left unset in the input are untouched,
 * so bindings, pairing and label translations survive the edit. The success
 * payload carries the structural conflicts still touching the node after the
 * write, from a fresh post-write solve — a fix can be verified from the
 * mutation response alone.
 */
export const UPDATE_INPUT_PORT: TypedDocumentNode<
  UpdateInputPortMutation,
  UpdateInputPortMutationVariables
> = gql`
  mutation UpdateInputPort(
    $instanceId: ID!
    $nodeId: ID!
    $portId: ID!
    $input: UpdateInputPortInput!
    $version: UUID
  ) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      nodeEditor(nodeId: $nodeId) {
        updateInputPort(portId: $portId, input: $input) {
          __typename
          ... on UpdateInputPortResult {
            port {
              id
              identifier
              label
              role
              quantity
              unit {
                id
                short
              }
              multi
              isEditable
            }
            conflicts {
              ...PortUpdateConflictFields
            }
          }
          ... on OperationInfo {
            ...EditorOperationInfoFields
          }
        }
      }
    }
  }
  ${PORT_UPDATE_CONFLICT_FIELDS}
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const UPDATE_OUTPUT_PORT: TypedDocumentNode<
  UpdateOutputPortMutation,
  UpdateOutputPortMutationVariables
> = gql`
  mutation UpdateOutputPort(
    $instanceId: ID!
    $nodeId: ID!
    $portId: ID!
    $input: UpdateOutputPortInput!
    $version: UUID
  ) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      nodeEditor(nodeId: $nodeId) {
        updateOutputPort(portId: $portId, input: $input) {
          __typename
          ... on UpdateOutputPortResult {
            port {
              id
              identifier
              label
              role
              quantity
              unit {
                id
                short
              }
              columnId
              isEditable
            }
            conflicts {
              ...PortUpdateConflictFields
            }
          }
          ... on OperationInfo {
            ...EditorOperationInfoFields
          }
        }
      }
    }
  }
  ${PORT_UPDATE_CONFLICT_FIELDS}
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

/**
 * Translatable node fields for a single node, resolved in the active request
 * locale. The model editor uses this with `context: { locale }` to preview the
 * translation in a non-default language; the resolver returns the matching
 * `*_i18n` value with fallback to the default-language column.
 */
export const NODE_TRANSLATION: TypedDocumentNode<
  NodeTranslationQuery,
  NodeTranslationQueryVariables
> = gql`
  query NodeTranslation($nodeId: ID!) {
    node(id: $nodeId) {
      id
      name
      description
      shortDescription
    }
  }
`;

export const AVAILABLE_DATASETS: TypedDocumentNode<
  AvailableDatasetsQuery,
  AvailableDatasetsQueryVariables
> = gql`
  query AvailableDatasets {
    instance {
      id
      editor {
        datasets {
          id
          isEditable
          userPermissions {
            change
            delete
          }
          identifier
          name
          metrics {
            id
            name
            label
            unitInfo {
              id
              dimensionality {
                dimension
                value
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Compute-phase node status. Resolving `status`/`errors` with `compute: true`
 * forces the backend to evaluate the model in fault-tolerant mode (every editor
 * operation sets `tolerateNodeFailures`), so runtime failures surface as node
 * status rather than aborting the whole computation. Nodes that already failed
 * at init time are returned unchanged — `compute: true` can't proceed past a
 * broken initialization — so a phase-2 result wholly replaces a node's entry.
 *
 * Whole-graph pass, fired once after the structural NodeGraph query resolves.
 */
export const NODE_STATUSES: TypedDocumentNode<NodeStatusesQuery, NodeStatusesQueryVariables> = gql`
  query NodeStatuses {
    instance {
      id
      model {
        nodes {
          id
          editor {
            status(compute: true)
            errors(compute: true) {
              phase
              message
            }
          }
        }
      }
    }
  }
`;

const NODE_HISTORY_ENTRY = gql`
  fragment NodeHistoryEntry on InstanceModelLogEntryType {
    uuid
    action
    createdAt
    targetKind
    before
    after
  }
`;

export const NODE_CHANGE_HISTORY: TypedDocumentNode<
  NodeChangeHistoryQuery,
  NodeChangeHistoryQueryVariables
> = gql`
  query NodeChangeHistory($nodeId: ID!, $limit: Int! = 10) {
    node(id: $nodeId) {
      id
      editor {
        changeHistory(limit: $limit) {
          ...NodeHistoryEntry
        }
      }
    }
  }
  ${NODE_HISTORY_ENTRY}
`;

export const METRIC_CATEGORY_FIELDS = gql`
  fragment ModelEditorMetricCategoryFields on MetricDimensionCategoryType {
    id
    originalId
    label
    color
    order
    group
  }
`;

export const METRIC_DIMENSION_FIELDS = gql`
  fragment ModelEditorMetricDimensionFields on MetricDimensionType {
    id
    originalId
    label
    helpText
    kind
    categories {
      ...ModelEditorMetricCategoryFields
    }
    groups {
      id
      originalId
      label
      color
      order
    }
  }
  ${METRIC_CATEGORY_FIELDS}
`;

export const DIMENSIONAL_METRIC_FIELDS = gql`
  fragment ModelEditorDimensionalMetricFields on DimensionalMetricType {
    id
    name
    measureDatapointYears
    unit {
      id
      short
      long
      htmlShort
      htmlLong
    }
    dimensions {
      ...ModelEditorMetricDimensionFields
    }
    years
    values
    stackable
    forecastFrom
    normalizedBy {
      id
      name
    }
    goals {
      categories
      groups
      values {
        year
        value
        isInterpolated
      }
    }
  }
  ${METRIC_DIMENSION_FIELDS}
`;
