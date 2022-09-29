import { gql } from '@apollo/client';

const GET_ACTION_EFFICIENCY = gql`
  query GetActionEfficiency { 
    actionEfficiencyPairs {
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
        }
        cumulativeImpact
        cumulativeEfficiency
        cumulativeCost
      }
    }
  }
`;

export { GET_ACTION_EFFICIENCY };