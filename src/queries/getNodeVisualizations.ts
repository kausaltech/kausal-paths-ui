import { gql } from '@apollo/client';
import visualizationEntryFragment from './visualizationEntryFragment';

export const GET_NODE_VISUALIZATIONS = gql`
  ${visualizationEntryFragment}

  query GetNodeVisualizations($nodeId: ID!) {
    node(id: $nodeId) {
      id
      visualizations {
        label
        ... on VisualizationGroup {
          children {
            ...VisualizationEntryFragment
          }
        }
      }
    }
  }
`;
