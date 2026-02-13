import { gql } from '@apollo/client';

import dimensionalNodePlotFragment from '../queries/dimensionalNodePlot';
import { UNIT_FRAGMENT } from './fragments';

const OUTCOME_NODE_FIELDS = gql`
  fragment OutcomeNodeFields on Node {
    id
    name
    color
    order
    shortName
    shortDescription
    metric(goalId: $goal) {
      id
      name
      unit {
        ...UnitFields
      }
      forecastValues {
        year
        value
      }
      baselineForecastValues {
        year
        value
      }
      historicalValues {
        year
        value
      }
    }
    goals(activeGoal: $goal) {
      year
      value
    }
    unit {
      ...UnitFields
    }
    quantity
    inputNodes {
      id
      name
    }
    outputNodes {
      id
    }
    upstreamActions(onlyRoot: true, decisionLevel: MUNICIPALITY) {
      id
      name
      goal
      shortName
      shortDescription
      parameters {
        __typename
        id
        nodeRelativeId
        node {
          id
        }
        isCustomized
        ... on BoolParameterType {
          boolValue: value
          boolDefaultValue: defaultValue
        }
      }
      group {
        id
        name
        color
      }
    }
    ...DimensionalNodeMetric
  }
  ${dimensionalNodePlotFragment}
  ${UNIT_FRAGMENT}
`;

const GET_OUTCOME_NODE = gql`
  ${OUTCOME_NODE_FIELDS}
  query OutcomeNode($id: ID!, $goal: ID, $scenarios: [String!]) {
    node(id: $id) {
      ...OutcomeNodeFields
      upstreamNodes(sameQuantity: true, sameUnit: true, includeActions: false) {
        ...OutcomeNodeFields
      }
    }
  }
`;

export default GET_OUTCOME_NODE;
