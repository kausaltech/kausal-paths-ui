import { gql } from '@apollo/client';
import { ACTION_PARAMETER_FRAGMENT } from 'components/general/ActionParameters';

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
    actionEfficiencyPairs {
      id
      label
      plotLimitEfficiency
      invertCost
      invertImpact
      efficiencyUnit {
        htmlShort
      }
      costUnit {
        htmlShort
      }
      impactUnit {
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
      impactNode {
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
        efficiencyDivisor
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
