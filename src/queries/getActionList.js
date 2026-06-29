import { gql } from '@apollo/client';

import { ACTION_PARAMETER_FRAGMENT } from './actionParameterFragment';

const GET_ACTION_LIST = gql`
  query ActionList($goal: ID) {
    instance {
      id
      actionGroups {
        id
        name
        color
        actions {
          id
        }
      }
    }
    actions(onlyRoot: true) {
      id
      name
      goal
      shortDescription
      color
      decisionLevel
      unit {
        id
        htmlShort
      }
      parameters {
        ...ActionParameter
      }
      quantity
      inputNodes {
        id
      }
      outputNodes {
        id
      }
      impactMetric(goalId: $goal) {
        id
        name
        unit {
          id
          htmlShort
        }
        cumulativeForecastValue
        yearlyCumulativeUnit {
          id
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
      group {
        id
        name
        color
      }
    }
  }

  ${ACTION_PARAMETER_FRAGMENT}
`;

export { GET_ACTION_LIST };
