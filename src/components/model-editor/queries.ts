import { gql, makeVar } from '@apollo/client';

// NodeGraph uses fetchPolicy: 'no-cache' for size reasons, so Apollo's
// normalized cache updates from the updateNode mutation don't reach it.
// This reactive var lets NodeDetailsSection push updated fields to any
// consumer that renders nodes from the NodeGraph query.
export type NodeFieldOverrides = {
  name?: string;
  color?: string | null;
  isVisible?: boolean;
  isOutcome?: boolean;
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
 * Only consulted on `/model-editor/*` routes; non-editor surfaces stay on
 * the backend default (published-first).
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
          color
          isVisible
          isOutcome
        }
        ... on ActionNode {
          id
          name
          color
          isVisible
        }
        ... on OperationInfo {
          ...EditorOperationInfoFields
        }
      }
    }
  }
  ${EDITOR_OPERATION_INFO_FIELDS}
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
    goals {
      categories
      values {
        year
        value
      }
    }
  }
  ${METRIC_DIMENSION_FIELDS}
`;
