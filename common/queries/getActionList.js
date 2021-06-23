import { gql } from '@apollo/client';

const GET_ACTION_LIST = gql`
  query GetActionList {
    actions {
      id
      name
      shortDescription
      color
      unit {
        htmlShort
      }
      parameters {
        __typename
        id
        description
        nodeRelativeId
        node {
          id
        }
        isCustomized
        ... on NumberParameterType {
          numberValue: value
          numberDefaultValue: defaultValue
          minValue
          maxValue
        }
        ... on BoolParameterType {
          boolValue: value
          boolDefaultValue: defaultValue
        }
        ... on StringParameterType {
          stringValue: value
          stringDefaultValue: defaultValue
        }
      }
      quantity
      inputNodes {
        id
      }
      outputNodes {
        id
      }
      impactMetric {
        id
        unit {
          htmlShort
        }
        historicalValues {
          year
          value
        }
        forecastValues {
          value
          year
        }
      }
    }
  }
`;

export { GET_ACTION_LIST };
