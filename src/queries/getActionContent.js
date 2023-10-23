import { gql } from '@apollo/client';
import DimensionalFlow from 'components/graphs/DimensionalFlow';
import { SUBACTIONS_FRAGMENT } from 'components/general/SubActions';
import { ACTION_PARAMETER_FRAGMENT } from 'components/general/ActionParameters';

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
      subactions {
        id
        name
        description
        shortDescription
        isEnabled
        parameters {
          id
        }
        downstreamNodes {
          ...CausalGridNode
        }
      }
    }
  }
  ${DimensionalFlow.fragment}
  fragment CausalGridNode on NodeInterface {
    id
    name
    shortDescription
    color
    targetYearGoal
    unit {
      htmlShort
    }
    inputNodes {
      id
    }
    outputNodes {
      id
    }
    ... on ActionNode {
      group {
        id
        name
        color
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
      ...ActionParameter
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
  ${ACTION_PARAMETER_FRAGMENT}
`;

export { GET_ACTION_CONTENT };
