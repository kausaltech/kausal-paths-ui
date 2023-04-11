import { gql } from '@apollo/client';
import DimensionalFlow from 'components/graphs/DimensionalFlow';


const GET_ACTION_CONTENT = gql`
  query GetActionContent($node: ID!, $goal: ID) {
    node(id: $node) {
      ...CausalGridNode
      description
      decisionLevel
      dimensionalFlow {
        ...DimensionalPlot
      }
      downstreamNodes {
        ...CausalGridNode
      }
    }
  }
  ${DimensionalFlow.fragment}
  fragment CausalGridNode on NodeType {
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
    impactMetric(goalId: $goal) {
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
      yearlyCumulativeUnit {
        htmlShort
      }
    }
    metricDim {
      dimensions {
        id
        categories {
          id
        }
      }
      stackable
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
    metric(goalId: $goal) {
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
`;

export { GET_ACTION_CONTENT };
