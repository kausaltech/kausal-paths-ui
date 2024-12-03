import { gql } from '@apollo/client';
import visualizationEntryFragment from './visualizationEntryFragment';
import { DimensionalMetric } from '@/data/metric';

export const GET_NODE_VISUALIZATIONS = gql`
  ${visualizationEntryFragment}
  ${DimensionalMetric.fragment}

  query GetNodeVisualizations($nodeId: ID!) {
    node(id: $nodeId) {
      id
      metricDim(withScenarios: ["default", "progress_tracking"]) {
        ...DimensionalMetric
      }
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
