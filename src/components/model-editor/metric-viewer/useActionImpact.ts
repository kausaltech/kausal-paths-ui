import { useMemo } from 'react';

import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

import type {
  ActionNodeImpactQuery,
  ActionNodeImpactQueryVariables,
  ModelEditorDimensionalMetricFieldsFragment,
} from '@/common/__generated__/graphql';
import { DimensionalMetric } from '../dimensional-metric';

const GET_ACTION_IMPACT = gql`
  query ActionNodeImpact($nodeId: ID!, $targetNodeId: ID!) {
    node(id: $nodeId) {
      id
      impactMetric(targetNodeId: $targetNodeId) {
        id
        name
        unit {
          id
          short
          long
          htmlShort
          htmlLong
        }
        historicalValues {
          year
          value
        }
        forecastValues {
          year
          value
        }
      }
    }
  }
`;

type ImpactMetric = NonNullable<NonNullable<ActionNodeImpactQuery['node']>['impactMetric']>;

const EMPTY_UNIT = {
  __typename: 'UnitType',
  id: '',
  short: '',
  long: '',
  htmlShort: '',
  htmlLong: '',
} as const;

/**
 * Reshape the flat yearly impact series (ForecastMetricType) into a
 * zero-dimension DimensionalMetricType cube so the drawer can reuse the
 * same table and graph viewers as regular node output.
 */
function impactToCube(impact: ImpactMetric): ModelEditorDimensionalMetricFieldsFragment | null {
  const rows = [...impact.historicalValues, ...impact.forecastValues];
  if (rows.length === 0) return null;
  return {
    __typename: 'DimensionalMetricType',
    id: impact.id ?? 'impact',
    name: impact.name ?? '',
    measureDatapointYears: [],
    unit: impact.unit ?? EMPTY_UNIT,
    dimensions: [],
    years: rows.map((r) => r.year),
    values: rows.map((r) => r.value),
    stackable: false,
    forecastFrom: impact.forecastValues[0]?.year ?? null,
    normalizedBy: null,
    goals: [],
  };
}

type UseActionImpactResult = {
  loading: boolean;
  error?: Error;
  metric: DimensionalMetric | null;
  rawMetric: ModelEditorDimensionalMetricFieldsFragment | null;
};

/**
 * The impact of an action on a downstream target node: the difference the
 * action makes in the target's output (enabled vs. disabled).
 */
export function useActionImpact(
  nodeId: string | null,
  targetNodeId: string | null
): UseActionImpactResult {
  const { data, loading, error } = useQuery<ActionNodeImpactQuery, ActionNodeImpactQueryVariables>(
    GET_ACTION_IMPACT,
    {
      variables: { nodeId: nodeId ?? '', targetNodeId: targetNodeId ?? '' },
      skip: !nodeId || !targetNodeId,
      fetchPolicy: 'cache-and-network',
    }
  );

  const rawMetric = useMemo(() => {
    const impact = data?.node?.impactMetric;
    return impact ? impactToCube(impact) : null;
  }, [data]);

  const metric = useMemo(() => (rawMetric ? new DimensionalMetric(rawMetric) : null), [rawMetric]);

  return { loading, error, metric, rawMetric };
}
