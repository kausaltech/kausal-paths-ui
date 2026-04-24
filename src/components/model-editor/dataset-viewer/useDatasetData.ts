import { useCallback, useMemo } from 'react';

import { gql } from '@apollo/client';
import { useLazyQuery } from '@apollo/client/react';

import {
  type DatasetPortDataQuery,
  type DatasetPortDataQueryVariables,
} from '@/common/__generated__/graphql';
import { DimensionalMetric } from '../dimensional-metric';
import { DIMENSIONAL_METRIC_FIELDS } from '../queries';

const GET_DATASET_PORT_DATA = gql`
  # eslint-disable @graphql-eslint/selection-set-depth -- editor/spec nesting plus dataset metadata exceeds the generic limit.
  query DatasetPortData($nodeId: ID!) {
    node(id: $nodeId) {
      id
      editor {
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
  }
  ${DIMENSIONAL_METRIC_FIELDS}
`;

type DatasetInputPort = NonNullable<
  NonNullable<NonNullable<DatasetPortDataQuery['node']>['editor']>['spec']
>['inputPorts'][number];

type DatasetPortBinding = Extract<
  DatasetInputPort['bindings'][number],
  { __typename: 'DatasetPortType' }
>;

export type DatasetInfo = NonNullable<DatasetPortBinding['dataset']>;

export type DatasetPortData = {
  bindingId: DatasetPortBinding['id'];
  portId: DatasetInputPort['id'];
  dataset: DatasetInfo;
  boundMetric: DatasetPortBinding['metric'];
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
    fetchPolicy: 'cache-and-network',
  });

  const fetch = useCallback(() => {
    if (nodeId) {
      void executeQuery({ variables: { nodeId } });
    }
  }, [nodeId, executeQuery]);

  const datasetPorts = useMemo<DatasetPortData[]>(() => {
    const ports = data?.node?.editor?.spec?.inputPorts;
    if (!ports) return [];

    const results: DatasetPortData[] = [];
    for (const port of ports) {
      for (const binding of port.bindings ?? []) {
        if (binding.__typename !== 'DatasetPortType') continue;
        if (!binding.dataset) continue;
        const metrics = (binding.data ?? []).map((d) => new DimensionalMetric(d));
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
