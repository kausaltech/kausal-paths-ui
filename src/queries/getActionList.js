import { gql } from '@apollo/client';

import { ACTION_PARAMETER_FRAGMENT } from '@/components/general/ActionParameters';

const GET_ACTION_LIST = gql`
  query GetActionList($goal: ID) {
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
      group {
        id
        name
        color
      }
    }
    impactOverviews {
      id
      label
      plotLimitForIndicator
      indicatorUnit {
        htmlShort
      }
      costUnit {
        htmlShort
      }
      effectUnit {
        htmlShort
      }
      costNode {
        id
        name
        shortDescription
        unit {
          short
        }
      }
      effectNode {
        id
        name
        shortDescription
        unit {
          short
        }
      }
      actions {
        action {
          id
          group {
            id
            name
            color
          }
        }
        unitAdjustmentMultiplier
        costValues {
          value
          year
        }
        impactValues {
          value
          year
        }
      }
    }
  }
  ${ACTION_PARAMETER_FRAGMENT}
`;

export { GET_ACTION_LIST };
