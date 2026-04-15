import { useCallback, useMemo } from 'react';

import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';

import {
  DatasetPortDataQuery,
  type DatasetPortDataQueryVariables,
} from '@/common/__generated__/graphql';
import { DimensionalMetric, type DimensionalMetricData } from '../dimensional-metric';
import { DIMENSIONAL_METRIC_FIELDS } from '../queries';

const GET_DATASET_PORT_DATA = gql`
  query DatasetPortData($nodeId: ID!) {
    node(id: $nodeId) {
      id
      spec {
        inputPorts {
          id
          bindings {
            __typename
            ... on DatasetPortType {
              id
              dataset {
                id
                identifier
                name
                isExternalPlaceholder
                externalRef {
                  repoUrl
                  commit
                  datasetId
                }
                dimensions {
                  id
                  name
                  categories {
                    uuid
                    identifier
                    label
                  }
                }
                metrics {
                  id
                  name
                  label
                  unit
                }
              }
              metric {
                id
                name
                label
              }
              data {
                ...ModelEditorDimensionalMetricFields
              }
            }
          }
        }
      }
    }
  }
  ${DIMENSIONAL_METRIC_FIELDS}
`;

export type DatasetInfo = {
  id: string;
  identifier: string | null;
  name: string;
  isExternalPlaceholder: boolean;
  externalRef: {
    repoUrl: string;
    commit: string | null;
    datasetId: string;
  } | null;
  dimensions: {
    id: string;
    name: string;
    categories: { uuid: string; identifier: string | null; label: string }[];
  }[];
  metrics: {
    id: string;
    name: string | null;
    label: string;
    unit: string;
  }[];
};

export type DatasetPortData = {
  bindingId: string;
  portId: string;
  dataset: DatasetInfo;
  boundMetric: { id: string; name: string | null; label: string } | null;
  metrics: DimensionalMetric[];
};

type UseDatasetDataResult = {
  loading: boolean;
  error?: Error;
  datasetPorts: DatasetPortData[];
  fetch: () => void;
};

export function useDatasetData(nodeId: string | null): UseDatasetDataResult {
  const [executeQuery, { data, loading, error }] = useLazyQuery<
    DatasetPortDataQuery,
    DatasetPortDataQueryVariables
  >(GET_DATASET_PORT_DATA, {
    variables: { nodeId: nodeId ?? '' },
    fetchPolicy: 'cache-and-network',
  });

  const fetch = useCallback(() => {
    if (nodeId) {
      executeQuery({ variables: { nodeId } });
    }
  }, [nodeId, executeQuery]);

  const datasetPorts = useMemo<DatasetPortData[]>(() => {
    const ports = data?.node?.spec?.inputPorts;
    if (!ports) return [];

    const results: DatasetPortData[] = [];
    for (const port of ports) {
      for (const binding of port.bindings ?? []) {
        if (binding.__typename !== 'DatasetPortType') continue;
        const metrics = (binding.data ?? []).map(
          (d: DimensionalMetricData) => new DimensionalMetric(d)
        );
        results.push({
          bindingId: binding.id,
          portId: port.id,
          dataset: binding.dataset,
          boundMetric: binding.metric,
          metrics,
        });
      }
    }
    return results;
  }, [data]);

  return { loading, error: error as Error | undefined, datasetPorts, fetch };
}
