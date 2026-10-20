import { type TypedDocumentNode, gql } from '@apollo/client';

import type {
  NodeVisualizationsQuery,
  NodeVisualizationsQueryVariables,
} from '@/common/__generated__/graphql';
import { DIMENSIONAL_METRIC_FRAGMENT } from '@/queries/dimensionalMetric';
import { scenarioFragment } from './instance';
import visualizationEntryFragment from './visualizationEntryFragment';

export const GET_NODE_VISUALIZATIONS: TypedDocumentNode<
  NodeVisualizationsQuery,
  NodeVisualizationsQueryVariables
> = gql`
  ${visualizationEntryFragment}
  ${DIMENSIONAL_METRIC_FRAGMENT}
  ${scenarioFragment}

  query NodeVisualizations($nodeId: ID!) {
    # Ensure we get the latest actualHistoricalYears for the progress tracking scenario
    scenarios {
      ...Scenario
    }
    node(id: $nodeId) {
      id
      metricDim(withScenarios: ["default", "progress_tracking"]) {
        ...DimensionalMetric
        measureDatapointYears
      }
      visualizations {
        id
        label
        ... on VisualizationGroup {
          children {
            ...VisualizationEntry
          }
        }
      }
    }
  }
`;
