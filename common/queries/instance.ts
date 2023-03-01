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
      }
    }
    scenarios {
      ...ScenarioFragment
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
      ... on NumberParameterType {
        label
        description
        minValue
        maxValue
        isCustomized
        isCustomizable
        numberDefault:defaultValue
        numberValue: value
        node {
          id
        }
      }
      ... on BoolParameterType {
        label
        description
        isCustomized
        isCustomizable
        boolDefault: defaultValue
        boolValue: value
        node {
          id
        }
      }
      ... on StringParameterType {
        label
        description
        isCustomized
        isCustomizable
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
