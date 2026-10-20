import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';

import SharedDimensionalNodeVisualisation, {
  type NodeVisualisationLabels,
} from '@common/components/paths/DimensionalNodeVisualisation';

import type { DimensionalNodeMetricFragment } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import { useTranslations } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import { useSiteOrNull } from '@/context/site';

/** The translated labels of kausal_common's `DimensionalNodeVisualisation` */
export function useNodeVisualisationLabels(): NodeVisualisationLabels {
  const t = useTranslations();
  // Naughtily use showRefreshPrompt to determine if this is a NZP instance
  const { showRefreshPrompt } = useInstance().features;
  return useMemo(
    () => ({
      graph: {
        total: t('common.plot-total'),
        goal: t('common.target'),
        baseline: t('common.plot-baseline'),
        progress: t('common.calculated-emissions'),
        measured: t('common.plot-measured'),
        comparisonYear: t('common.comparison-year'),
        forecast: t('common.table-scenario-forecast'),
      },
      prediction: showRefreshPrompt ? t('common.planned') : t('common.pred'),
      controls: {
        breakDownBy: t('common.plot-break-down-by'),
        filter: t('common.plot-filter'),
        filterAll: t('common.plot-filter-all'),
        filterNoData: t('common.plot-filter-no-data'),
        definition: t('common.definition'),
      },
      tools: {
        downloadData: t('common.download-data'),
        downloadError: t('errors.download-error'),
      },
      // The units are HTML
      units: {
        'tco2-e-inhabitant': t.raw('common.tco2-e-inhabitant') as string,
        'ktco2-e': t.raw('common.ktco2-e') as string,
      },
    }),
    [t, showRefreshPrompt]
  );
}

type DimensionalNodeVisualisationProps = {
  title: string;
  baselineForecast?: { year: number; value: number }[];
  metric: NonNullable<DimensionalNodeMetricFragment['metricDim']>;
  startYear: number;
  endYear: number;
  withControls?: boolean;
  withTools?: boolean;
  color?: string | null;
  onClickMeasuredEmissions?: (year: number) => void;
  forecastTitle?: string;
};

/**
 * kausal_common's `DimensionalNodeVisualisation` with this app's active goal,
 * instance, site scenarios and translations.
 */
export default function DimensionalNodeVisualisation(props: DimensionalNodeVisualisationProps) {
  const activeGoal = useReactiveVar(activeGoalVar);
  const instance = useInstance();
  const site = useSiteOrNull();
  const labels = useNodeVisualisationLabels();

  return (
    <SharedDimensionalNodeVisualisation
      {...props}
      activeGoal={activeGoal}
      instance={instance}
      site={site}
      labels={labels}
    />
  );
}
