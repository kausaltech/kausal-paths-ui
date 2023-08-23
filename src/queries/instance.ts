import { gql } from '@apollo/client';

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
      goals {
        id
        label
        default
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
      id
      __typename
      isCustomizable
      isCustomized
      ... on NumberParameterType {
        label
        description
        minValue
        maxValue
        numberDefault: defaultValue
        numberValue: value
        node {
          id
        }
      }
      ... on BoolParameterType {
        label
        description
        boolDefault: defaultValue
        boolValue: value
        node {
          id
        }
      }
      ... on StringParameterType {
        label
        description
        stringDefault: defaultValue
        stringValue: value
        node {
          id
        }
      }
    }
  }
  ${scenarioFragment}
`;

export default GET_INSTANCE_CONTEXT;
