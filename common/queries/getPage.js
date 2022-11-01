import { gql } from '@apollo/client';

const OUTCOME_NODE_FIELDS = gql`
  fragment OutcomeNodeFields on NodeType {
    id
    name
    color
    order
    shortDescription
    metric {
      id
      name
      unit {
        short
        htmlShort
        htmlLong
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
      htmlLong
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
      leadTitle
      leadParagraph
      outcomeNode {
        ...OutcomeNodeFields
        upstreamNodes(sameQuantity: true, sameUnit: true, includeActions: false) {
          ...OutcomeNodeFields
        }
      }
    }
    ... on ActionListPage {
      actionListLeadTitle: leadTitle
      actionListLeadParagraph: leadParagraph
    }
  }
}
`;

export default GET_PAGE;
