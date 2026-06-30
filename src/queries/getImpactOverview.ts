import { gql } from '@apollo/client';

export const IMPACT_OVERVIEW_DETAIL_FRAGMENT = gql`
  fragment ImpactOverviewDetail on ImpactOverviewType {
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
    goal {
      year
      value
    }
    effectNode {
      id
      name
      shortDescription
      unit {
        id
        short
      }
      goals {
        year
        value
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
        goals {
          categories
          groups
          values {
            year
            value
            isInterpolated
          }
        }
        stackable
        forecastFrom
      }
    }
  }
`;

export const GET_IMPACT_OVERVIEW = gql`
  query ImpactOverview($id: ID!) {
    impactOverview(id: $id) {
      # eslint-disable-next-line @graphql-eslint/require-selections -- costDim/metric ids omitted intentionally to avoid cache issues (see fragment)
      ...ImpactOverviewDetail
    }
  }

  ${IMPACT_OVERVIEW_DETAIL_FRAGMENT}
`;
