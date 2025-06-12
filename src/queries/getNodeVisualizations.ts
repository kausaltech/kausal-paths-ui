import { gql } from '@apollo/client';
import visualizationEntryFragment from './visualizationEntryFragment';
import { DimensionalMetric } from '@/data/metric';
import { scenarioFragment } from './instance';

export const GET_NODE_VISUALIZATIONS = gql`
  ${visualizationEntryFragment}
  ${DimensionalMetric.fragment}
  ${scenarioFragment}

  query GetNodeVisualizations($nodeId: ID!) {
    # Ensure we get the latest actualHistoricalYears for the progress tracking scenario
    scenarios {
      ...ScenarioFragment
    }
    node(id: $nodeId) {
      id
      metricDim(withScenarios: ["default", "progress_tracking"]) {
        ...DimensionalMetric
        measureDatapointYears
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
