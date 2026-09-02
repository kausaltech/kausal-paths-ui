import { type TypedDocumentNode, gql } from '@apollo/client';

import type {
  CreateDataPointCommentMutation,
  CreateDataPointCommentMutationVariables,
  CreateDataPointsMutation,
  CreateDataPointsMutationVariables,
  CreateDataSourceMutation,
  CreateDataSourceMutationVariables,
  CreateDatasetMetricMutation,
  CreateDatasetMetricMutationVariables,
  CreateDatasetMutation,
  CreateDatasetMutationVariables,
  CreateSourceReferenceMutation,
  CreateSourceReferenceMutationVariables,
  DatasetConnectedNodesQuery,
  DatasetConnectedNodesQueryVariables,
  DeleteDataPointsMutation,
  DeleteDataPointsMutationVariables,
  DeleteDatasetMetricMutation,
  DeleteDatasetMetricMutationVariables,
  DeleteDatasetMutation,
  DeleteDatasetMutationVariables,
  DeleteSourceReferenceMutation,
  DeleteSourceReferenceMutationVariables,
  InstanceDatasetQuery,
  InstanceDatasetQueryVariables,
  InstanceDatasetsQuery,
  InstanceDatasetsQueryVariables,
  ResolveDataPointCommentMutation,
  ResolveDataPointCommentMutationVariables,
  UnresolveDataPointCommentMutation,
  UnresolveDataPointCommentMutationVariables,
  UpdateDataPointsMutation,
  UpdateDataPointsMutationVariables,
  UpdateDatasetMetricMutation,
  UpdateDatasetMetricMutationVariables,
  UpdateDatasetMutation,
  UpdateDatasetMutationVariables,
} from '@/common/__generated__/graphql';
import { OPERATION_INFO_FIELDS } from '../dimensions/queries';

export const DATASET_SUMMARY_FIELDS = gql`
  fragment DatasetSummaryFields on Dataset {
    id
    isEditable
    userPermissions {
      change
      delete
    }
    identifier
    name
    isExternalPlaceholder
    externalRef {
      repoUrl
      commit
      datasetId
    }
    dimensions {
      id
      name
    }
    metrics {
      id
      label
      quantity {
        id
      }
      unitInfo {
        id
        standard
      }
    }
    lastModifiedAt
    lastModifiedBy {
      id
      firstName
      lastName
      email
    }
  }
`;

export const DATA_POINT_COMMENT_FIELDS = gql`
  fragment DataPointCommentFields on DataPointComment {
    id
    text
    isSticky
    isReview
    reviewState
    resolvedAt
    resolvedBy {
      id
      firstName
      lastName
      email
    }
    createdAt
    createdBy {
      id
      firstName
      lastName
      email
    }
    lastModifiedAt
    lastModifiedBy {
      id
      firstName
      lastName
      email
    }
  }
`;

export const DATA_SOURCE_FIELDS = gql`
  fragment DataSourceFields on DataSource {
    id
    name
    label
    authority
    edition
    url
    description
  }
`;

export const DATASET_SOURCE_REFERENCE_FIELDS = gql`
  fragment DatasetSourceReferenceFields on DatasetSourceReference {
    id
    dataPoint {
      id
    }
    dataSource {
      ...DataSourceFields
    }
    createdAt
    createdBy {
      id
      firstName
      lastName
      email
    }
    lastModifiedAt
    lastModifiedBy {
      id
      firstName
      lastName
      email
    }
  }
  ${DATA_SOURCE_FIELDS}
`;

export const DATASET_DETAIL_FIELDS = gql`
  fragment DatasetDetailFields on Dataset {
    id
    isEditable
    userPermissions {
      change
      delete
    }
    identifier
    name
    isExternalPlaceholder
    externalRef {
      repoUrl
      commit
      datasetId
    }
    dimensions {
      id
      name
      categories {
        uuid
        identifier
        label
      }
    }
    metrics {
      id
      name
      label
      unitInfo {
        id
        standard
      }
      quantity {
        id
        label
      }
      previousSibling
      nextSibling
    }
    dataPoints {
      id
      date
      value
      metric {
        id
      }
      dimensionCategories {
        uuid
      }
      comments {
        ...DataPointCommentFields
      }
    }
    portBindings {
      id
      portRef {
        nodeUuid
        # Deliberate: model.nodes(id:) resolves node identifiers, not UUIDs, so
        # the connected-nodes lookup needs nodeId until the backend accepts
        # UUIDs there.
        # eslint-disable-next-line @graphql-eslint/no-deprecated
        nodeId
        portId
      }
    }
    sourceReferences(target: ALL) {
      ...DatasetSourceReferenceFields
    }
    validationViolations {
      code
      message
      severity
      enforcement
      metric
      years
      requirementGroup
      combinationIds
      coordinates {
        dimension
        category
      }
    }
  }
  ${DATA_POINT_COMMENT_FIELDS}
  ${DATASET_SOURCE_REFERENCE_FIELDS}
`;

export const GET_INSTANCE_DATASETS: TypedDocumentNode<
  InstanceDatasetsQuery,
  InstanceDatasetsQueryVariables
> = gql`
  query InstanceDatasets {
    instance {
      id
      editor {
        datasets {
          ...DatasetSummaryFields
          dataPointComments {
            id
          }
        }
      }
    }
  }
  ${DATASET_SUMMARY_FIELDS}
`;

export const GET_INSTANCE_DATASET: TypedDocumentNode<
  InstanceDatasetQuery,
  InstanceDatasetQueryVariables
> = gql`
  query InstanceDataset($datasetId: ID!) {
    instance {
      id
      editor {
        dataset(id: $datasetId) {
          ...DatasetDetailFields
        }
        dataSources {
          ...DataSourceFields
        }
      }
    }
  }
  ${DATASET_DETAIL_FIELDS}
  ${DATA_SOURCE_FIELDS}
`;

export const CREATE_DATASET: TypedDocumentNode<
  CreateDatasetMutation,
  CreateDatasetMutationVariables
> = gql`
  mutation CreateDataset($instanceId: ID!, $input: CreateDatasetInput!) {
    instanceEditor(instanceId: $instanceId) {
      createDataset(input: $input) {
        __typename
        ... on Dataset {
          ...DatasetSummaryFields
        }
        ... on OperationInfo {
          ...OperationInfoFields
        }
      }
    }
  }
  ${DATASET_SUMMARY_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const DELETE_DATASET: TypedDocumentNode<
  DeleteDatasetMutation,
  DeleteDatasetMutationVariables
> = gql`
  mutation DeleteDataset($instanceId: ID!, $datasetId: UUID!, $force: Boolean!) {
    instanceEditor(instanceId: $instanceId) {
      deleteDataset(datasetId: $datasetId, force: $force) {
        __typename
        ... on ModelDeletePayload {
          ok
        }
        ... on OperationInfo {
          ...OperationInfoFields
        }
      }
    }
  }
  ${OPERATION_INFO_FIELDS}
`;

export const CREATE_METRIC: TypedDocumentNode<
  CreateDatasetMetricMutation,
  CreateDatasetMetricMutationVariables
> = gql`
  mutation CreateDatasetMetric(
    $instanceId: ID!
    $datasetId: ID!
    $input: CreateDatasetMetricInput!
  ) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        createMetric(input: $input) {
          __typename
          ... on DatasetMetric {
            id
            name
            label
            unitInfo {
              id
              standard
            }
            quantity {
              id
              label
            }
            previousSibling
            nextSibling
          }
          ... on OperationInfo {
            ...OperationInfoFields
          }
        }
      }
    }
  }
  ${OPERATION_INFO_FIELDS}
`;

export const DELETE_METRIC: TypedDocumentNode<
  DeleteDatasetMetricMutation,
  DeleteDatasetMetricMutationVariables
> = gql`
  mutation DeleteDatasetMetric(
    $instanceId: ID!
    $datasetId: ID!
    $metricId: UUID!
    $force: Boolean!
  ) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        deleteMetric(metricId: $metricId, force: $force) {
          ...OperationInfoFields
        }
      }
    }
  }
  ${OPERATION_INFO_FIELDS}
`;

export const UPDATE_METRIC: TypedDocumentNode<
  UpdateDatasetMetricMutation,
  UpdateDatasetMetricMutationVariables
> = gql`
  mutation UpdateDatasetMetric(
    $instanceId: ID!
    $datasetId: ID!
    $metricId: UUID!
    $input: UpdateDatasetMetricInput!
  ) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        updateMetric(metricId: $metricId, input: $input) {
          __typename
          ... on DatasetMetric {
            id
            name
            label
            unitInfo {
              id
              standard
            }
            quantity {
              id
              label
            }
          }
          ... on OperationInfo {
            ...OperationInfoFields
          }
        }
      }
    }
  }
  ${OPERATION_INFO_FIELDS}
`;

export const UPDATE_DATASET: TypedDocumentNode<
  UpdateDatasetMutation,
  UpdateDatasetMutationVariables
> = gql`
  mutation UpdateDataset($instanceId: ID!, $input: UpdateDatasetInput!) {
    instanceEditor(instanceId: $instanceId) {
      updateDataset(input: $input) {
        __typename
        ... on Dataset {
          id
          name
          identifier
        }
        ... on OperationInfo {
          ...OperationInfoFields
        }
      }
    }
  }
  ${OPERATION_INFO_FIELDS}
`;

export const GET_DATASET_CONNECTED_NODES: TypedDocumentNode<
  DatasetConnectedNodesQuery,
  DatasetConnectedNodesQueryVariables
> = gql`
  query DatasetConnectedNodes($ids: [ID!]!) {
    instance {
      id
      model {
        nodes(id: $ids) {
          __typename
          id
          name
          kind
          ... on Node {
            isOutcome
          }
          editor {
            nodeType
            spec {
              typeConfig {
                __typename
                ... on SimpleConfigType {
                  nodeClass
                }
                ... on ActionConfigType {
                  nodeClass
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const DATA_POINT_FIELDS = gql`
  fragment DataPointFields on DataPoint {
    id
    date
    value
    metric {
      id
    }
    dimensionCategories {
      uuid
    }
  }
`;

export const CREATE_DATA_POINTS: TypedDocumentNode<
  CreateDataPointsMutation,
  CreateDataPointsMutationVariables
> = gql`
  mutation CreateDataPoints($instanceId: ID!, $datasetId: ID!, $input: [CreateDataPointInput!]!) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        createDataPoints(input: $input) {
          __typename
          ... on DataPointsMutationResult {
            dataPoints {
              ...DataPointFields
            }
          }
          ... on OperationInfo {
            ...OperationInfoFields
          }
        }
      }
    }
  }
  ${DATA_POINT_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const UPDATE_DATA_POINTS: TypedDocumentNode<
  UpdateDataPointsMutation,
  UpdateDataPointsMutationVariables
> = gql`
  mutation UpdateDataPoints(
    $instanceId: ID!
    $datasetId: ID!
    $input: [UpdateDataPointItemInput!]!
  ) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        updateDataPoints(input: $input) {
          __typename
          ... on DataPointsMutationResult {
            dataPoints {
              ...DataPointFields
            }
          }
          ... on OperationInfo {
            ...OperationInfoFields
          }
        }
      }
    }
  }
  ${DATA_POINT_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const DELETE_DATA_POINTS: TypedDocumentNode<
  DeleteDataPointsMutation,
  DeleteDataPointsMutationVariables
> = gql`
  mutation DeleteDataPoints($instanceId: ID!, $datasetId: ID!, $dataPointIds: [ID!]!) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        deleteDataPoints(dataPointIds: $dataPointIds) {
          __typename
          ... on DeleteDataPointsResult {
            deletedDataPointIds
          }
          ... on OperationInfo {
            ...OperationInfoFields
          }
        }
      }
    }
  }
  ${OPERATION_INFO_FIELDS}
`;

export const CREATE_DATA_POINT_COMMENT: TypedDocumentNode<
  CreateDataPointCommentMutation,
  CreateDataPointCommentMutationVariables
> = gql`
  mutation CreateDataPointComment(
    $instanceId: ID!
    $datasetId: ID!
    $dataPointId: ID!
    $input: CreateDataPointCommentInput!
  ) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        createDataPointComment(dataPointId: $dataPointId, input: $input) {
          __typename
          ... on DataPointComment {
            ...DataPointCommentFields
          }
          ... on OperationInfo {
            ...OperationInfoFields
          }
        }
      }
    }
  }
  ${DATA_POINT_COMMENT_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const RESOLVE_DATA_POINT_COMMENT: TypedDocumentNode<
  ResolveDataPointCommentMutation,
  ResolveDataPointCommentMutationVariables
> = gql`
  mutation ResolveDataPointComment($instanceId: ID!, $datasetId: ID!, $commentId: ID!) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        resolveDataPointComment(commentId: $commentId) {
          __typename
          ... on DataPointComment {
            ...DataPointCommentFields
          }
          ... on OperationInfo {
            ...OperationInfoFields
          }
        }
      }
    }
  }
  ${DATA_POINT_COMMENT_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const UNRESOLVE_DATA_POINT_COMMENT: TypedDocumentNode<
  UnresolveDataPointCommentMutation,
  UnresolveDataPointCommentMutationVariables
> = gql`
  mutation UnresolveDataPointComment($instanceId: ID!, $datasetId: ID!, $commentId: ID!) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        unresolveDataPointComment(commentId: $commentId) {
          __typename
          ... on DataPointComment {
            ...DataPointCommentFields
          }
          ... on OperationInfo {
            ...OperationInfoFields
          }
        }
      }
    }
  }
  ${DATA_POINT_COMMENT_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const CREATE_SOURCE_REFERENCE: TypedDocumentNode<
  CreateSourceReferenceMutation,
  CreateSourceReferenceMutationVariables
> = gql`
  mutation CreateSourceReference(
    $instanceId: ID!
    $datasetId: ID!
    $input: CreateDatasetSourceReferenceInput!
  ) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        createSourceReference(input: $input) {
          __typename
          ... on DatasetSourceReference {
            ...DatasetSourceReferenceFields
          }
          ... on OperationInfo {
            ...OperationInfoFields
          }
        }
      }
    }
  }
  ${DATASET_SOURCE_REFERENCE_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const CREATE_DATA_SOURCE: TypedDocumentNode<
  CreateDataSourceMutation,
  CreateDataSourceMutationVariables
> = gql`
  mutation CreateDataSource($instanceId: ID!, $input: CreateDataSourceInput!) {
    instanceEditor(instanceId: $instanceId) {
      createDataSource(input: $input) {
        __typename
        ... on DataSource {
          ...DataSourceFields
        }
        ... on OperationInfo {
          ...OperationInfoFields
        }
      }
    }
  }
  ${DATA_SOURCE_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const DELETE_SOURCE_REFERENCE: TypedDocumentNode<
  DeleteSourceReferenceMutation,
  DeleteSourceReferenceMutationVariables
> = gql`
  mutation DeleteSourceReference($instanceId: ID!, $datasetId: ID!, $referenceId: ID!) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        deleteSourceReference(referenceId: $referenceId) {
          ...OperationInfoFields
        }
      }
    }
  }
  ${OPERATION_INFO_FIELDS}
`;
