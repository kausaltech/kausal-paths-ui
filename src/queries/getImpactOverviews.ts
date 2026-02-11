import { gql } from '@apollo/client';

export const GET_IMPACT_OVERVIEWS = gql`
  query ImpactOverviews {
    impactOverviews {
      id
      graphType
      label
      costLabel
      effectLabel
      indicatorLabel
      costCategoryLabel
      effectCategoryLabel
      description
      effectNode {
        id
      }
      effectUnit {
        short
        long
      }
      indicatorUnit {
        short
        long
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
        unitAdjustmentMultiplier
        effectDim {
          id
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
        # eslint-disable-next-line @graphql-eslint/require-selections -- id omitted intentionally to avoid cache issues
        costDim {
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
