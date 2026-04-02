import { gql } from '@apollo/client';

import { ACTION_PARAMETER_FRAGMENT } from '@/components/general/ActionParameters';

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
    impactOverviews {
      id
      label
      plotLimitForIndicator
      indicatorUnit {
        id
        htmlShort
      }
      costUnit {
        id
        htmlShort
      }
      effectUnit {
        id
        htmlShort
      }
      costNode {
        id
        name
        shortDescription
        unit {
          id
          short
        }
      }
      effectNode {
        id
        name
        shortDescription
        unit {
          id
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
        # eslint-disable-next-line @graphql-eslint/no-deprecated -- TODO: migrate to new properties
        costValues {
          value
          year
        }
        # eslint-disable-next-line @graphql-eslint/no-deprecated -- TODO: migrate to new properties
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
