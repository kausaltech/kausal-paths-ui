import { gql } from '@apollo/client';

// import { DimensionalMetric } from 'data/metric';
// ${DimensionalMetric.fragment}

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
    }
  }
`;

export default visualizationEntryFragment;
