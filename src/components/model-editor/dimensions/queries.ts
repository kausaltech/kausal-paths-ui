import { gql } from '@apollo/client';

export const INSTANCE_DIMENSION_FIELDS = gql`
  fragment InstanceDimensionFields on InstanceDimension {
    id
    identifier
    name
    categories {
      id
      identifier
      label
      order
      previousSibling
      nextSibling
    }
  }
`;

export const OPERATION_INFO_FIELDS = gql`
  fragment OperationInfoFields on OperationInfo {
    messages {
      kind
      field
      message
      code
    }
  }
`;

export const GET_INSTANCE_DIMENSIONS = gql`
  query InstanceDimensions {
    instance {
      id
      identifier
      editor {
        dimensions {
          ...InstanceDimensionFields
        }
      }
    }
  }
  ${INSTANCE_DIMENSION_FIELDS}
`;

export const UPDATE_DIMENSION = gql`
  mutation UpdateDimension($instanceId: ID!, $input: UpdateDimensionInput!) {
    instanceEditor(instanceId: $instanceId) {
      updateDimension(input: $input) {
        __typename
        ... on InstanceDimension {
          ...InstanceDimensionFields
        }
        ... on OperationInfo {
          ...OperationInfoFields
        }
      }
    }
  }
  ${INSTANCE_DIMENSION_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const CREATE_DIMENSION_CATEGORIES = gql`
  mutation CreateDimensionCategories($instanceId: ID!, $input: [CreateDimensionCategoryInput!]!) {
    instanceEditor(instanceId: $instanceId) {
      createDimensionCategories(input: $input) {
        __typename
        ... on InstanceDimension {
          ...InstanceDimensionFields
        }
        ... on OperationInfo {
          ...OperationInfoFields
        }
      }
    }
  }
  ${INSTANCE_DIMENSION_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const UPDATE_DIMENSION_CATEGORIES = gql`
  mutation UpdateDimensionCategories($instanceId: ID!, $input: [UpdateDimensionCategoryInput!]!) {
    instanceEditor(instanceId: $instanceId) {
      updateDimensionCategories(input: $input) {
        __typename
        ... on InstanceDimension {
          ...InstanceDimensionFields
        }
        ... on OperationInfo {
          ...OperationInfoFields
        }
      }
    }
  }
  ${INSTANCE_DIMENSION_FIELDS}
  ${OPERATION_INFO_FIELDS}
`;

export const DELETE_DIMENSION_CATEGORY = gql`
  mutation DeleteDimensionCategory($instanceId: ID!, $categoryId: UUID!) {
    instanceEditor(instanceId: $instanceId) {
      deleteDimensionCategory(categoryId: $categoryId) {
        ...OperationInfoFields
      }
    }
  }
  ${OPERATION_INFO_FIELDS}
`;
