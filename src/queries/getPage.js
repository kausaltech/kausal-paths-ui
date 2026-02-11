import { gql } from '@apollo/client';

import { STREAM_FIELD_FRAGMENT } from '@/components/common/StreamField';

import { UNIT_FRAGMENT } from './fragments';

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
        isEnabled
      }
      value
      year
    }
  }

  fragment DashboardCardVisualizations on DashboardCardBlock {
    id
    visualizations {
      __typename
      id
      ... on GoalProgressBarBlock {
        __typename
        title
        description
        chartLabel
        color
      }
      ... on CurrentProgressBarBlock {
        __typename
        title
        description
        chartLabel
        color
      }
      ... on ReferenceProgressBarBlock {
        __typename
        title
        description
        chartLabel
        color
      }
      ... on ScenarioProgressBarBlock {
        __typename
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

  fragment ScenarioValueFields on ScenarioValue {
    scenario {
      id
      name
    }
    value
    year
  }

  fragment DashboardPageFields on DashboardPage {
    id
    introTitle: leadTitle
    introParagraph: leadParagraph
    backgroundColor
    dashboardCards {
      id
      ... on DashboardCardBlock {
        title
        description
        image {
          id
          url
        }
        node {
          id
          name
        }
        unit {
          ...UnitFields
        }
        goalValues {
          year
          value
        }
        referenceYearValue
        lastHistoricalYearValue
        scenarioValues {
          ...ScenarioValueFields
        }
        metricDimensionCategoryValues {
          ...MetricDimensionCategoryValueFields
        }

        scenarioActionImpacts {
          ...ScenarioActionImpactsFields
        }

        ...DashboardCardVisualizations

        callToAction {
          id
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

const GET_PAGE = gql`
  ${DASHBOARD_PAGE_FRAGMENT}
  query Page($path: String!) {
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
          id
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
          ...StreamField
        }
      }
    }
  }
  ${STREAM_FIELD_FRAGMENT}
`;

export default GET_PAGE;
