import { gql } from '@apollo/client';

/** The fields of a dimensional metric that kausal_common's metric utilities read */
export const DIMENSIONAL_METRIC_FRAGMENT = gql`
  fragment DimensionalMetric on DimensionalMetricType {
    # eslint-disable-next-line @graphql-eslint/no-deprecated -- TODO: drop this id once the API removes it (Watch UI still selects it); nothing reads it, and the cache does not normalize by it (keyFields: false)
    id
    name
    measureDatapointYears
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
      htmlLong
      long
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
`;
