import { gql } from '@apollo/client';

/*
  This is a placeholder.
  With current locale implementation the fragments are not working.
*/

export const ALL_METRIC_FIELDS = gql`
  fragment AllMetricFields on ForecastMetricType {
    name
    id
    unit {
      htmlShort
    }
    historicalValues {
      year
      value
    }
    forecastValues {
      value
      year
    }
    baselineForecastValues {
      year
      value
    }
  }
`;
