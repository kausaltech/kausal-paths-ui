import { gql } from '@apollo/client';

const OUTCOME_NODE_FIELDS = gql`
  fragment OutcomeNodeFields on NodeType {
    id
    name
    color
    shortDescription
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
    targetYearGoal
    unit {
      short
      htmlShort
    }
    quantity
    shortDescription
    inputNodes {
      id
      name
    }
    outputNodes {
      id
    }
    upstreamActions {
      id
      name
      parameters {
        isCustomized
      }
    }
  }
`;

const GET_PAGE = gql`
${OUTCOME_NODE_FIELDS}
query GetPage($path: String!) {
  activeScenario {
    id
  }
  page(path: $path) {
    id
    __typename
    title
    ... on OutcomePage {
      outcomeNode {
        ...OutcomeNodeFields
        upstreamNodes(sameQuantity: true, sameUnit: true) {
          ...OutcomeNodeFields
        }
      }
    }
  }
}
`;

export default GET_PAGE;
