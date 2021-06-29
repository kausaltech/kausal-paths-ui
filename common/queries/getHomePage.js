import { gql } from '@apollo/client';

const GET_HOME_PAGE = gql`
  query GetHomePage {
    instance {
      id
      name
      leadTitle
      leadParagraph
    }
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
          node {
            id
            shortDescription
            targetYearGoal
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
