import { gql } from '@apollo/client';
import DimensionalFlow from 'components/graphs/DimensionalFlow';
import { SUBACTIONS_FRAGMENT } from 'components/general/SubActions';

const GET_ACTION_CONTENT = gql`
  query GetActionContent($node: ID!, $goal: ID) {
    action(id: $node) {
      ...CausalGridNode
      description
      dimensionalFlow {
        ...DimensionalPlot
      }
      downstreamNodes {
        ...CausalGridNode
      }
      decisionLevel
    }
  }
  ${DimensionalFlow.fragment}
  ${SUBACTIONS_FRAGMENT}
  fragment CausalGridNode on NodeInterface {
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
    ... on ActionNode {
      group {
        id
        name
        color
      }
      subactions {
        ...SubActionCard
      }
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
        step
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
