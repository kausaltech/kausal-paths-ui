import { gql } from '@apollo/client';

const GET_ACTION_IMPACTS = gql`
  query GetActionImpacts($impact1: ID!, $impact2: ID!) {
    energyNode: node(id: $impact1) {
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
        cumulativeForecastValue
      }
      cost: impactMetric(targetNodeId: $impact2) {
        cumulativeForecastValue
      }
    }
  }
`;

export { GET_ACTION_IMPACTS };
