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
      stakeholderDimension
      outcomeDimension
      plotLimitForIndicator
      effectNode {
        id
        name
        shortDescription
        unit {
          id
          short
        }
      }
      costNode {
        id
        name
        shortDescription
        unit {
          id
          short
        }
      }
      effectUnit {
        id
        short
        long
        htmlShort
      }
      indicatorUnit {
        id
        short
        long
        htmlShort
      }
      costUnit {
        id
        short
        long
        htmlShort
      }
      actions {
        action {
          id
          name
          group {
            id
            name
            color
          }
        }
        unitAdjustmentMultiplier
        # eslint-disable-next-line @graphql-eslint/no-deprecated -- TODO: migrate to new properties
        costValues {
          value
          year
        }
        # eslint-disable-next-line @graphql-eslint/no-deprecated -- TODO: migrate to new properties
        impactValues {
          value
          year
        }
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
            id
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
      wedge {
        id
        label
        isScenario
        # eslint-disable-next-line @graphql-eslint/require-selections -- id omitted intentionally to avoid cache issues
        metric {
          years
          values
          unit {
            id
            short
          }
          stackable
          forecastFrom
        }
      }
    }
  }
`;
