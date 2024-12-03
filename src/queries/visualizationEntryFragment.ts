import { gql } from '@apollo/client';
import { DimensionalMetric } from 'data/metric';

const visualizationEntryFragment = gql`
  fragment VisualizationEntryFragment on VisualizationEntry {
    label
    ... on VisualizationNodeOutput {
      label
      nodeId
      scenarios
      dimensions {
        id
        categories
        flatten
      }
      desiredOutcome
      metricDim {
        ...DimensionalMetric
      }
    }
  }

  ${DimensionalMetric.fragment}
`;

export default visualizationEntryFragment;
