import { gql } from '@apollo/client';

import { OPERATION_INFO_FIELDS } from '../dimensions/queries';

export const DATASET_SUMMARY_FIELDS = gql`
  fragment DatasetSummaryFields on Dataset {
    id
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
      unit
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
      nodeRef {
        nodeId
        portId
      }
    }
    sourceReferences(target: ALL) {
      ...DatasetSourceReferenceFields
    }
  }
  ${DATA_POINT_COMMENT_FIELDS}
  ${DATASET_SOURCE_REFERENCE_FIELDS}
`;

export const GET_INSTANCE_DATASETS = gql`
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

export const GET_INSTANCE_DATASET = gql`
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

export const GET_DATASET_CONNECTED_NODES = gql`
  query DatasetConnectedNodes($ids: [ID!]!) {
    instance {
      id
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

export const CREATE_DATA_POINT = gql`
  mutation CreateDataPoint($instanceId: ID!, $datasetId: ID!, $input: CreateDataPointInput!) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        createDataPoint(input: $input) {
          __typename
          ... on DataPoint {
            ...DataPointFields
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

export const UPDATE_DATA_POINT = gql`
  mutation UpdateDataPoint(
    $instanceId: ID!
    $datasetId: ID!
    $dataPointId: ID!
    $input: UpdateDataPointInput!
  ) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        updateDataPoint(dataPointId: $dataPointId, input: $input) {
          __typename
          ... on DataPoint {
            ...DataPointFields
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

export const DELETE_DATA_POINT = gql`
  mutation DeleteDataPoint($instanceId: ID!, $datasetId: ID!, $dataPointId: ID!) {
    instanceEditor(instanceId: $instanceId) {
      datasetEditor(datasetId: $datasetId) {
        deleteDataPoint(dataPointId: $dataPointId) {
          ...OperationInfoFields
        }
      }
    }
  }
  ${OPERATION_INFO_FIELDS}
`;

export const CREATE_DATA_POINT_COMMENT = gql`
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

export const RESOLVE_DATA_POINT_COMMENT = gql`
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

export const UNRESOLVE_DATA_POINT_COMMENT = gql`
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

export const CREATE_SOURCE_REFERENCE = gql`
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

export const CREATE_DATA_SOURCE = gql`
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

export const DELETE_SOURCE_REFERENCE = gql`
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
