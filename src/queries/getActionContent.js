import { gql } from '@apollo/client';
import DimensionalFlow from 'components/graphs/DimensionalFlow';
import { ACTION_PARAMETER_FRAGMENT } from 'components/general/ActionParameters';
import { DimensionalMetric } from 'data/metric';
import { STREAM_FIELD_FRAGMENT } from 'components/common/StreamField';

const CAUSAL_GRID_NODE_FRAGMENT = gql`
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
`;

/**
 * Returns the downstream nodes of a given action until a specific leaf node (outcome) is reached.
 * This is used to render the causal chain on an action page.
 */
export const GET_CAUSAL_CHAIN = gql`
  query GetCausalChain($node: ID!, $goal: ID, $untilNode: ID) {
    action(id: $node) {
      id
      downstreamNodes(untilNode: $untilNode) {
        ...CausalGridNode
      }
    }
  }

  ${DimensionalMetric.fragment}
  ${CAUSAL_GRID_NODE_FRAGMENT}
  ${ACTION_PARAMETER_FRAGMENT}
`;

const GET_ACTION_CONTENT = gql`
  query GetActionContent($node: ID!, $goal: ID, $downstreamDepth: Int) {
    action(id: $node) {
      ...CausalGridNode
      goal
      description
      dimensionalFlow {
        ...DimensionalPlot
      }
      downstreamNodes(maxDepth: $downstreamDepth, onlyOutcome: true) {
        ...CausalGridNode
      }
      decisionLevel
      body {
        ...StreamFieldFragment
      }
    }
  }
  ${CAUSAL_GRID_NODE_FRAGMENT}
  ${DimensionalFlow.fragment}
  ${STREAM_FIELD_FRAGMENT}
  ${DimensionalMetric.fragment}
  ${ACTION_PARAMETER_FRAGMENT}
`;
export { GET_ACTION_CONTENT };
