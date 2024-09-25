import { gql } from '@apollo/client';
import { ACTION_PARAMETER_FRAGMENT } from 'components/general/ActionParameters';

export const scenarioFragment = gql`
  fragment ScenarioFragment on ScenarioType {
    id
    isActive
    isDefault
    name
  }
`;

const GET_INSTANCE_CONTEXT = gql`
  query GetInstanceContext {
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
        baselineVisibleInGraphs
        showAccumulatedEffects
        showSignificantDigits
      }
      introContent {
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
        showInMenus
      }
    }
    scenarios {
      ...ScenarioFragment
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
    parameters {
      ...ActionParameter
    }
  }
  ${scenarioFragment}
  ${ACTION_PARAMETER_FRAGMENT}
`;

export default GET_INSTANCE_CONTEXT;
