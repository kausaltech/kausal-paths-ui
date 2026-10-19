import { gql } from '@apollo/client';

import { DIMENSIONAL_METRIC_FRAGMENT } from '@/queries/dimensionalMetric';

const dimensionalNodePlotFragment = gql`
  fragment DimensionalNodeMetric on NodeInterface {
    id
    metricDim(withScenarios: $scenarios) {
      ...DimensionalMetric
    }
  }
  ${DIMENSIONAL_METRIC_FRAGMENT}
`;

export default dimensionalNodePlotFragment;
