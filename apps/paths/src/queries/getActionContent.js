import { gql } from '@apollo/client';
import DimensionalFlow from 'components/graphs/DimensionalFlow';
import { SUBACTIONS_FRAGMENT } from 'components/general/SubActions';
import { ACTION_PARAMETER_FRAGMENT } from 'components/general/ActionParameters';
import { DimensionalMetric } from 'data/metric';
import { STREAM_FIELD_FRAGMENT } from 'components/common/StreamField';

const GET_ACTION_CONTENT = gql`
  query GetActionContent($node: ID!, $goal: ID, $downstreamDepth: Int) {
    action(id: $node) {
      ...CausalGridNode
      goal
      description
      dimensionalFlow {
        ...DimensionalPlot
      }
      downstreamNodes(maxDepth: $downstreamDepth) {
        ...CausalGridNode
      }
      decisionLevel
      body {
        ...StreamFieldFragment
      }
      subactions {
        id
        name
        description
        goal
        shortDescription
        isEnabled
        isVisible
        parameters {
          id
        }
        downstreamNodes(maxDepth: 1) {
          ...CausalGridNode
        }
        body {
          ...StreamFieldFragment
        }
      }
    }
  }
  ${DimensionalFlow.fragment}
  ${STREAM_FIELD_FRAGMENT}

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
      ...DimensionalMetric
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
  ${DimensionalMetric.fragment}
  ${ACTION_PARAMETER_FRAGMENT}
`;

export { GET_ACTION_CONTENT };
