import { type TypedDocumentNode, gql } from '@apollo/client';

import type {
  InstanceContextQuery,
  InstanceContextQueryVariables,
} from '@/common/__generated__/graphql';
import { ACTION_PARAMETER_FRAGMENT } from '@/queries/actionParameterFragment';

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

type InstanceContextDocument = TypedDocumentNode<
  InstanceContextQuery,
  InstanceContextQueryVariables
>;

const GET_INSTANCE_CONTEXT: InstanceContextDocument = gql`
  query InstanceContext {
    instance {
      id
      name
      siteTitle
      themeIdentifier
      frameworkConfig {
        id
        framework {
          id
          identifier
          name
        }
      }
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
      model {
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
      menuLabel
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
