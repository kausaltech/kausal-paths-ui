import { useEffect, useRef } from 'react';

import { Box, Typography } from '@mui/material';

import { type TypedDocumentNode, gql } from '@apollo/client';
import { useQuery, useReactiveVar } from '@apollo/client/react';

import { logApolloError } from '@common/logging/apollo';

import type {
  ParameterPanelGraphQuery,
  ParameterPanelGraphQueryVariables,
} from '@/common/__generated__/graphql';
import { activeGoalVar, activeScenarioVar, yearRangeVar } from '@/common/cache';
import { useTranslation } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import { DEFAULT_SIGNIFICANT_DIGITS } from '@/common/numbers';
import ContentLoader from '@/components/common/ContentLoader';
import GraphQLError from '@/components/common/GraphQLError';
import Loader from '@/components/common/Loader';
import { useNodeVisualisationLabels } from '@/components/general/DimensionalNodeVisualisation';
import { useSiteOrNull } from '@/context/site';
import dimensionalNodePlotFragment from '@/queries/dimensionalNodePlot';
import NodeMetricChart from './NodeMetricChart';
import type { EditorDefaults } from './editor-defaults';

const GET_PARAMETER_PANEL_GRAPH: TypedDocumentNode<
  ParameterPanelGraphQuery,
  ParameterPanelGraphQueryVariables
> = gql`
  query ParameterPanelGraph($node: ID!, $scenarios: [String!]) {
    activeScenario {
      id
    }
    node(id: $node) {
      id
      name
      color
      ...DimensionalNodeMetric
    }
  }
  ${dimensionalNodePlotFragment}
`;

type Props = {
  nodeId: string;
  /** The page editor's break-down dimension and filters, which the visitor can change */
  editorDefaults?: EditorDefaults;
};

/**
 * The graph of one node in a parameter panel, drawn with the experimental `NodeMetricChart`.
 *
 * Each graph has its own query, so the page does not wait for the computation, and the
 * parameter and scenario mutations, which refetch every active query, update it.
 */
export function ParameterPanelGraph({ nodeId, editorDefaults }: Props) {
  const { t } = useTranslation();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const activeGoal = useReactiveVar(activeGoalVar);
  const instance = useInstance();
  const site = useSiteOrNull();
  const labels = useNodeVisualisationLabels();

  const { loading, error, data, refetch } = useQuery(GET_PARAMETER_PANEL_GRAPH, {
    variables: { node: nodeId, scenarios: null },
  });

  // As on the node page: a server-side render has no session, so the data can be for the
  // default scenario. Refetch once per scenario when the data's scenario disagrees.
  const dataScenarioId = data?.activeScenario.id;
  const refetchedForScenarioRef = useRef<string | null>(null);
  useEffect(() => {
    const scenarioId = activeScenario?.id;
    if (loading || !dataScenarioId || !scenarioId || dataScenarioId === scenarioId) return;
    if (refetchedForScenarioRef.current === scenarioId) return;
    refetchedForScenarioRef.current = scenarioId;
    void refetch();
  }, [loading, dataScenarioId, activeScenario?.id, refetch]);

  if (loading && !data) return <ContentLoader />;
  if (error) {
    logApolloError(error);
    return <GraphQLError error={error} />;
  }
  const node = data?.node;
  if (!node) return null;

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && <Loader />}
      {node.metricDim ? (
        <NodeMetricChart
          key={node.id}
          title={node.name}
          metric={node.metricDim}
          startYear={yearRange[0]}
          endYear={yearRange[1]}
          color={node.color}
          activeGoal={activeGoal}
          instance={instance}
          defaultSignificantDigits={DEFAULT_SIGNIFICANT_DIGITS}
          site={site}
          labels={labels}
          editorDefaults={editorDefaults}
        />
      ) : (
        <>
          <Typography variant="h5" component="h3">
            {node.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('parameter-panel-graph-unavailable')}
          </Typography>
        </>
      )}
    </Box>
  );
}
