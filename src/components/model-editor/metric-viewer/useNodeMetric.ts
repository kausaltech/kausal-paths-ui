import { useMemo } from 'react';

import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';

import { DimensionalMetric, type DimensionalMetricData } from '../dimensional-metric';
import { DIMENSIONAL_METRIC_FIELDS } from '../queries';

const GET_NODE_OUTPUT_DATA = gql`
  query NodeOutputData($nodeId: ID!) {
    node(id: $nodeId) {
      id
      name
      spec {
        outputPorts {
          id
          label
          quantity
          unit {
            short
            long
            htmlShort
            htmlLong
          }
          output {
            ...ModelEditorDimensionalMetricFields
          }
        }
      }
    }
  }
  ${DIMENSIONAL_METRIC_FIELDS}
`;

type PortMetric = {
  portId: string;
  portLabel: string | null;
  quantity: string | null;
  metric: DimensionalMetric | null;
};

type UseNodeMetricResult = {
  loading: boolean;
  error?: Error;
  portMetrics: PortMetric[];
  fetch: () => void;
};

export function useNodeMetric(nodeId: string | null): UseNodeMetricResult {
  const [executeQuery, { data, loading, error }] = useLazyQuery(GET_NODE_OUTPUT_DATA, {
    variables: { nodeId: nodeId ?? '' },
    fetchPolicy: 'cache-and-network',
  });

  const fetch = () => {
    if (nodeId) {
      executeQuery({ variables: { nodeId } });
    }
  };

  const portMetrics = useMemo<PortMetric[]>(() => {
    const ports = data?.node?.spec?.outputPorts;
    if (!ports) return [];

    return ports.map((port: {
      id: string;
      label: string | null;
      quantity: string | null;
      output: DimensionalMetricData | null;
    }) => ({
      portId: port.id,
      portLabel: port.label,
      quantity: port.quantity,
      metric: port.output ? new DimensionalMetric(port.output) : null,
    }));
  }, [data]);

  return { loading, error: error as Error | undefined, portMetrics, fetch };
}
