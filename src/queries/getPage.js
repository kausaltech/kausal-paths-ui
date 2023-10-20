import { gql } from '@apollo/client';
import dimensionalNodePlotFragment from '../queries/dimensionalNodePlot';

const OUTCOME_NODE_FIELDS = gql`
  fragment OutcomeNodeFields on Node {
    id
    name
    color
    order
    shortName
    shortDescription
    metric(goalId: $goal) {
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
    goals(activeGoal: $goal) {
      year
      value
    }
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
      shortName
      shortDescription
      parameters {
        __typename
        id
        nodeRelativeId
        node {
          id
        }
        isCustomized
        ... on BoolParameterType {
          boolValue: value
          boolDefaultValue: defaultValue
        }
      }
      group {
        id
        name
        color
      }
    }
    ...DimensionalNodeMetric
  }
  ${dimensionalNodePlotFragment}
`;

const GET_PAGE = gql`
  ${OUTCOME_NODE_FIELDS}
  query GetPage($path: String!, $goal: ID) {
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
          upstreamNodes(
            sameQuantity: true
            sameUnit: true
            includeActions: false
          ) {
            ...OutcomeNodeFields
          }
        }
      }
      ... on ActionListPage {
        actionListLeadTitle: leadTitle
        actionListLeadParagraph: leadParagraph
        showOnlyMunicipalActions
        defaultSortOrder
      }
      ... on StaticPage {
        body {
          id
          __typename
          ... on RichTextBlock {
            value
            rawValue
          }
        }
      }
    }
  }
`;

export default GET_PAGE;
