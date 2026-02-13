import { gql } from '@apollo/client';

import { ACTION_PARAMETER_FRAGMENT } from '@/components/general/ActionParameters';

export const scenarioFragment = gql`
  fragment Scenario on ScenarioType {
    id
    isActive
    isDefault
    name
    actualHistoricalYears
    kind
  }
`;

const GET_INSTANCE_CONTEXT = gql`
  query InstanceContext {
    instance {
      id
      name
      themeIdentifier
      owner
      defaultLanguage
      supportedLanguages
      targetYear
      modelEndYear
      referenceYear
      minimumHistoricalYear
      maximumHistoricalYear
      leadTitle
      leadParagraph
      features {
        hideNodeDetails
        maximumFractionDigits
        baselineVisibleInGraphs
        showAccumulatedEffects
        showSignificantDigits
        showRefreshPrompt
      }
      introContent {
        id
        ... on StreamFieldInterface {
          ... on RichTextBlock {
            field
            value
          }
        }
      }
      goals {
        id
        label
        default
        disabled
        outcomeNode {
          id
        }
        dimensions {
          dimension
          categories
          groups
        }
      }
      actionListPage {
        id
        showInMenus
      }
    }
    scenarios {
      ...Scenario
    }
    availableNormalizations {
      id
      label
      isActive
    }
    menuPages: pages(inMenu: true) {
      id
      title
      urlPath
      parent {
        id
      }
    }
    footerPages: pages(inFooter: true) {
      id
      title
      urlPath
      parent {
        id
      }
    }
    additionalLinkPages: pages(inAdditionalLinks: true) {
      id
      title
      urlPath
      parent {
        id
      }
    }
    parameters {
      ...ActionParameter
    }
  }
  ${scenarioFragment}
  ${ACTION_PARAMETER_FRAGMENT}
`;

export default GET_INSTANCE_CONTEXT;
