import { gql } from '@apollo/client';

const GET_PARAMETERS = gql`
  query GetParameters {
    availableNormalizations {
      id
      label
      isActive
    }
    parameters {
      id
      label
      description
      isCustomized
      isCustomizable
      __typename
      ... on NumberParameterType {
        minValue
        maxValue
        numberDefault:defaultValue
        numberValue: value
        node {
          id
        }
      }
      ... on BoolParameterType {
        boolDefault: defaultValue
        boolValue: value
        node {
          id
        }
      }
      ... on StringParameterType {
        stringDefault: defaultValue
        stringValue: value
        node {
          id
        }
      }
    }
  }
`;

export { GET_PARAMETERS };
