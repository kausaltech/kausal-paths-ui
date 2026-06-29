import { gql, makeVar } from '@apollo/client';

import type { NodeErrorPhase, NodeStatus } from '@/common/__generated__/graphql';

// NodeGraph uses fetchPolicy: 'no-cache' for size reasons, so Apollo's
// normalized cache updates from the updateNode mutation don't reach it.
// This reactive var lets NodeDetailsSection push updated fields to any
// consumer that renders nodes from the NodeGraph query.
export type NodeFieldOverrides = {
  name?: string;
  shortName?: string | null;
  description?: string | null;
  color?: string | null;
  isVisible?: boolean;
  isOutcome?: boolean;
  nodeGroup?: string | null;
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
 * PUBLISHED is whatever is currently live (read-only preview). The Apollo
 * link reads this on every operation — toggling re-runs any refetched query
 * against the new slice.
 *
 * Currently pinned to PUBLISHED because preview-mode routing is gated off
 * in `ApolloWrapper.detectPreviewMode` while the backend DRAFT hydrate bug
 * is being fixed. All edits land on the published revision in place. Flip
 * the default back to DRAFT once the backend is repaired.
 */
export type EditorPreviewMode = 'DRAFT' | 'PUBLISHED';
export const editorPreviewModeVar = makeVar<EditorPreviewMode>('PUBLISHED');

/**
 * Set to true when a mutation is rejected with a `stale_version` error —
 * another tab (or user) has edited this instance since we last read the
 * token. A top-level `StaleVersionNotice` snackbar subscribes and prompts
 * the user to reload. Cleared on reload or when the user dismisses.
 */
export const staleVersionNotificationVar = makeVar<boolean>(false);

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

export const INSTANCE_EDITOR_PUBLISH_STATE = gql`
  fragment InstanceEditorPublishState on InstanceEditor {
    live
    hasUnpublishedChanges
    firstPublishedAt
    lastPublishedAt
    draftHeadToken
  }
`;

export const GET_INSTANCE_EDITOR_PUBLISH_STATE = gql`
  query EditorPublishState {
    instance {
      id
      editor {
        ...InstanceEditorPublishState
      }
    }
  }
  ${INSTANCE_EDITOR_PUBLISH_STATE}
`;

export const PUBLISH_MODEL_INSTANCE = gql`
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
      }
    }
  }
  ${INSTANCE_EDITOR_PUBLISH_STATE}
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const CREATE_NODE = gql`
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
export const NODE_PARAMETERS = gql`
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

export const CREATE_EDGE = gql`
  mutation CreateEdge($instanceId: ID!, $input: CreateEdgeInput!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      createEdge(input: $input) {
        __typename
        ... on NodeEdgeType {
          id
          fromRef {
            nodeId
            portId
          }
          toRef {
            nodeId
            portId
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

export const DELETE_EDGE = gql`
  mutation DeleteEdge($instanceId: ID!, $edgeId: ID!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      deleteEdge(edgeId: $edgeId) {
        ...EditorOperationInfoFields
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const DELETE_NODE = gql`
  mutation DeleteNode($instanceId: ID!, $nodeId: ID!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      deleteNode(nodeId: $nodeId) {
        ...EditorOperationInfoFields
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

export const UPDATE_NODE = gql`
  mutation UpdateNode($instanceId: ID!, $nodeId: ID!, $input: UpdateNodeInput!, $version: UUID) {
    instanceEditor(instanceId: $instanceId, version: $version) {
      updateNode(nodeId: $nodeId, input: $input) {
        __typename
        ... on Node {
          id
          name
          shortName
          description
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
          color
          isVisible
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
  ${EDITOR_OPERATION_INFO_FIELDS}
`;

/**
 * Translatable node fields for a single node, resolved in the active request
 * locale. The model editor uses this with `context: { locale }` to preview the
 * translation in a non-default language; the resolver returns the matching
 * `*_i18n` value with fallback to the default-language column.
 */
export const NODE_TRANSLATION = gql`
  query NodeTranslation($nodeId: ID!) {
    node(id: $nodeId) {
      id
      name
      description
      shortDescription
    }
  }
`;

export const AVAILABLE_DATASETS = gql`
  query AvailableDatasets {
    instance {
      id
      editor {
        datasets {
          id
          identifier
          name
          metrics {
            id
            label
            unit
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
export const NODE_STATUSES = gql`
  query NodeStatuses {
    instance {
      id
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

export const NODE_CHANGE_HISTORY = gql`
  query NodeChangeHistory($nodeId: ID!, $limit: Int! = 10) {
    node(id: $nodeId) {
      id
      ... on Node {
        uuid
        changeHistory(limit: $limit) {
          ...NodeHistoryEntry
        }
      }
      ... on ActionNode {
        uuid
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
