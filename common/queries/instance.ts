import { gql } from '@apollo/client';


const GET_INSTANCE_CONTEXT = gql`
query GetInstanceContext {
    instance {
      id
      name
      owner
      defaultLanguage
      supportedLanguages
      targetYear
      referenceYear
      minimumHistoricalYear
      maximumHistoricalYear
      leadTitle
      leadParagraph
    }
    scenarios {
      id
      isActive
      isDefault
      name
    }
    menuPages: pages(inMenu: true) {
      id
      title
      urlPath
      parent {
        id
      }
    }
}
`;


export default GET_INSTANCE_CONTEXT;
