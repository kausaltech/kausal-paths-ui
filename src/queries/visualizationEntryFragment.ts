import { gql } from '@apollo/client';

import { DIMENSIONAL_METRIC_FRAGMENT } from '@/queries/dimensionalMetric';

const visualizationEntryFragment = gql`
  fragment VisualizationEntry on VisualizationEntry {
    id
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
        measureDatapointYears
      }
    }
  }

  ${DIMENSIONAL_METRIC_FRAGMENT}
`;

export default visualizationEntryFragment;
