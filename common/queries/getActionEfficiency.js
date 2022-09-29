import { gql } from '@apollo/client';

const GET_ACTION_EFFICIENCY = gql`
  query GetActionEfficiency { 
    instance {
      actionGroups {
        id
        name
        color
        actions {
          id
        }
      }
    }
    actionEfficiencyPairs {
      label
      efficiencyUnit {
        short
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
          name
          group {
            id
          }
        }
        cumulativeImpact
        cumulativeEfficiency
        cumulativeCost
      }
    }
  }
`;

export { GET_ACTION_EFFICIENCY };