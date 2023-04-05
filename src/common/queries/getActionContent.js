import { gql } from '@apollo/client';
import DimensionalFlow from 'components/graphs/DimensionalFlow';


const GET_ACTION_CONTENT = gql`
  query GetActionContent($node: ID!) {
    node(id: $node) {
      id
      name
      shortDescription
      description
      color
      decisionLevel
      targetYearGoal
      unit {
        htmlShort
      }
      quantity
      isAction
      outputNodes{
        id
      }
      inputNodes{
        id
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
          unit {
            htmlShort
          }
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
      dimensionalFlow {
        ...DimensionalPlot
      }
      impactMetric {
        id
        unit {
          htmlShort
        }
        cumulativeForecastValue
        yearlyCumulativeUnit {
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
      downstreamNodes {
        id
        name
        shortDescription
        color
        targetYearGoal
        unit {
          htmlShort
        }
        inputNodes{
          id
        }
        outputNodes{
          id
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
          description
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
  ${DimensionalFlow.fragment}
`;

export { GET_ACTION_CONTENT };
