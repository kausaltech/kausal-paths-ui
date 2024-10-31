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
          # TODO: There's an issue with the API where dimension ids
          #       are the same as action ids and causes cache issues.
          #       Once fixed, we should use the DimensionalMetric fragment here.
          # id
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
          # id
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
