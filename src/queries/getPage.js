import { gql } from '@apollo/client';

import { STREAM_FIELD_FRAGMENT } from '@/components/common/StreamField';

import dimensionalNodePlotFragment from '../queries/dimensionalNodePlot';

const UNIT_FRAGMENT = gql`
  fragment UnitFields on UnitType {
    short
    htmlShort
    htmlLong
  }
`;

const DASHBOARD_PAGE_FRAGMENT = gql`
  fragment ScenarioActionImpactsFields on ScenarioActionImpacts {
    scenario {
      id
    }
    impacts {
      action {
        id
        name
        shortName
        color
        group {
          id
          name
          color
        }
      }
      value
      year
    }
  }

  fragment DashboardCardVisualizations on DashboardCardBlock {
    visualizations {
      __typename
      id
      ... on GoalProgressBarBlock {
        title
        description
        chartLabel
        color
      }
      ... on CurrentProgressBarBlock {
        title
        description
        chartLabel
        color
      }
      ... on ReferenceProgressBarBlock {
        title
        description
        chartLabel
        color
      }
      ... on ScenarioProgressBarBlock {
        title
        description
        chartLabel
        color
        scenarioId
      }
      ... on CategoryBreakdownBlock {
        title
        dimensionId
      }
      ... on ActionImpactBlock {
        title
        scenarioId
      }
    }
  }

  fragment MetricDimensionCategoryValueFields on MetricDimensionCategoryValue {
    dimension {
      kind
      label
      id
      originalId
    }
    category {
      id
      originalId
      label
      color
    }
    value
    year
  }

  fragment DashboardPageFields on DashboardPage {
    backgroundColor
    dashboardCards {
      ... on DashboardCardBlock {
        title
        description
        image {
          url
        }
        node {
          id
          name
        }
        unit {
          ...UnitFields
        }
        goalValue
        referenceYearValue
        lastHistoricalYearValue
        scenarioValues {
          scenario {
            id
            name
          }
          value
          year
        }
        metricDimensionCategoryValues {
          ...MetricDimensionCategoryValueFields
        }

        scenarioActionImpacts {
          ...ScenarioActionImpactsFields
        }

        ...DashboardCardVisualizations

        callToAction {
          ... on CallToActionBlock {
            title
            content
            linkUrl
          }
        }
      }
    }
  }

  ${UNIT_FRAGMENT}
`;

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
        ...UnitFields
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
      ...UnitFields
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
    upstreamActions(onlyRoot: true, decisionLevel: MUNICIPALITY) {
      id
      name
      goal
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
  ${UNIT_FRAGMENT}
`;

const GET_PAGE = gql`
  ${DASHBOARD_PAGE_FRAGMENT}
  ${OUTCOME_NODE_FIELDS}
  query GetPage($path: String!, $goal: ID, $scenarios: [String!]) {
    activeScenario {
      id
    }
    page(path: $path) {
      id
      __typename
      title
      ... on DashboardPage {
        ...DashboardPageFields
      }
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
        showOnlyMunicipalActions
        defaultSortOrder
      }
      ... on StaticPage {
        body {
          ...StreamFieldFragment
        }
      }
    }
  }
  ${STREAM_FIELD_FRAGMENT}
`;

export default GET_PAGE;
