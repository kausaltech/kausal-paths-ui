import { gql } from '@apollo/client';

const GET_ACTION_IMPACTS = gql`
  query ActionImpacts($impact1: ID!, $impact2: ID!) {
    energyNode: node(id: $impact1) {
      id
      metric {
        id
        unit {
          short
        }
        yearlyCumulativeUnit {
          short
        }
      }
    }
    costNode: node(id: $impact2) {
      id
      metric {
        id
        unit {
          short
        }
        yearlyCumulativeUnit {
          short
        }
      }
    }
    actions {
      name
      id
      energy: impactMetric(targetNodeId: $impact1) {
        id
        cumulativeForecastValue
      }
      cost: impactMetric(targetNodeId: $impact2) {
        id
        cumulativeForecastValue
      }
    }
  }
`;

export { GET_ACTION_IMPACTS };
