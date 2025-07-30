import { gql } from '@apollo/client';

export const GET_IMPACT_OVERVIEWS = gql`
  query GetImpactOverviews {
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
        costDim {
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
