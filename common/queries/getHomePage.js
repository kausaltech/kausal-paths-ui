import { gql } from '@apollo/client';

const GET_HOME_PAGE = gql`
  query GetHomePage {
    page(path: "/") {
      id
      name
      ... on EmissionPageType {
        emissionSectors {
          id
          name
          color
          parent {
            id
          }
          metric {
            id
            name
            unit {
              htmlShort
            }
            forecastValues {
              year
              value
            }
            baselineForecastValues {
              year
              value
            }
            historicalValues {
              year
              value
            }
          }
          node {
            id
            description
            upstreamActions {
              id
              name
              parameters {
                isCustomized
              }
            }
          }
        }
      }
    }
  }
`;

export { GET_HOME_PAGE };
