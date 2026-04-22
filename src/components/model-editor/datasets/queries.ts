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
    }
  }
`;

export const GET_INSTANCE_DATASETS = gql`
  query InstanceDatasets {
    instance {
      id
      editor {
        datasets {
          ...DatasetSummaryFields
          dataPoints {
            id
          }
        }
      }
    }
  }
  ${DATASET_SUMMARY_FIELDS}
`;

export const GET_INSTANCE_DATASET = gql`
  query InstanceDataset {
    instance {
      id
      editor {
        datasets {
          ...DatasetDetailFields
        }
      }
    }
  }
  ${DATASET_DETAIL_FIELDS}
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
