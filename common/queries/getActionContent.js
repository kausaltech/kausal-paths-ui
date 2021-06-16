import { gql } from '@apollo/client';

const GET_ACTION_CONTENT = gql`
  query GetActionContent($node: ID!) {
    node(id: $node) {
      id
      name 
      description
      color
      unit {
        htmlShort
      }
      quantity
      isAction
      parameters {
        __typename
        id
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
      metric {
        name
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
        baselineForecastValues {
          year
          value
        }
      }
      descendantNodes {
        id
        name
        description
        color	
        unit {
          htmlShort
        }
        impactMetric {
          name
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
          baselineForecastValues {
            year
            value
          }
        }
        quantity
        isAction
        parameters {
          __typename
          id
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
        metric {
          name
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
          baselineForecastValues {
            year
            value
          }
        }
      }
    }
  }
`;

export { GET_ACTION_CONTENT };
