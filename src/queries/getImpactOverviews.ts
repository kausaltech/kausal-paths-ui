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
          # id # TODO: prevents ROI from rendering
          name
          dimensions {
            id
            label
            originalId
            helpText
            categories {
              id
              originalId
              label
              color
              order
              group
            }
            groups {
              id
              originalId
              label
              color
              order
            }
          }
          goals {
            categories
            groups
            values {
              year
              value
              isInterpolated
            }
          }
          unit {
            htmlShort
            short
          }
          stackable
          normalizedBy {
            id
            name
          }
          forecastFrom
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
`;
