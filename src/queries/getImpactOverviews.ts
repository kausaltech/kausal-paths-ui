import { DimensionalMetric } from '@/data/metric';
import { gql } from '@apollo/client';

export const GET_IMPACT_OVERVIEWS = gql`
  query GetImpactOverviews {
    impactOverviews {
      id
      label
      graphType
      costNode {
        id
      }
      costUnit {
        short
        long
      }
      actions {
        action {
          id
          name
        }
        costDim {
          ...DimensionalMetric
          id
          unit {
            short
          }
          dimensions {
            originalId
            label
            categories {
              originalId
              label
            }
          }
          years
          values
        }
        impactDim {
          dimensions {
            id
          }
          years
          values
        }
      }
    }
  }

  ${DimensionalMetric.fragment}
`;
