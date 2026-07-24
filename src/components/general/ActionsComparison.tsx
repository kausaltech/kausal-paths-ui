import { useMemo } from 'react';

import { useReactiveVar } from '@apollo/client/react';
import { useLocale } from 'next-intl';

import { Chart } from '@common/components/Chart';
import { getEChartsLocaleStrings } from '@common/components/register-echarts-locales';

import { activeScenarioVar } from '@/common/cache';
import { type TFunction, useTranslation } from '@/common/i18n';
import { useAxisLabelFormatter, useNumberFormatter } from '@/common/numbers';
import { summarizeYearlyValuesBetween } from '@/common/preprocess';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import { stripHtml } from '@/components/charts/chartTooltip';
import {
  type SimpleEffectEntry,
  getSimpleEffectChartConfig,
} from '@/components/general/SimpleEffect';
import type { ActionWithEfficiency, SortActionsConfig } from '@/types/actions.types';

// The entries are pre-sorted here (the sort keys live on the action objects,
// not the entries), so the chart config must not re-sort them
const NO_RESORT: SortActionsConfig = { key: 'STANDARD', label: '' };

type Props = {
  sortBy?: SortActionsConfig['sortKey'];

  actions: ActionWithEfficiency[];
  id: string;
  sortAscending: boolean;
  refetching: boolean;
  displayYears: [number, number];
};

const ActionsComparison = ({
  actions,
  id,
  sortBy = 'cumulativeImpact',
  sortAscending,
  refetching,
  displayYears,
}: Props) => {
  const { t } = useTranslation();
  const locale = useLocale();
  const activeScenario = useReactiveVar(activeScenarioVar);
  const formatNumber = useNumberFormatter();
  const formatAxisLabel = useAxisLabelFormatter();

  const { entries, effectUnit, metricName } = useMemo(() => {
    const actionsWithImpact = actions.map((action) => {
      // In no-overview (emissions) mode useActionListData doesn't populate
      // cumulativeImpact, so derive it from impactMetric to match the list view
      // and keep the cumulative-impact sort meaningful.
      const cumulativeImpact =
        action.cumulativeImpact ??
        (action.impactMetric
          ? summarizeYearlyValuesBetween(action.impactMetric, displayYears[0], displayYears[1])
          : 0);
      return {
        ...action,
        impact:
          action.impactMetric?.forecastValues.find(
            (dataPoint) => dataPoint.year === displayYears[1]
          )?.value || 0,
        cumulativeImpact,
      };
    });

    const sortActions = (a: ActionWithEfficiency, b: ActionWithEfficiency) => {
      const aValue = Number(a[sortBy]) || 0;
      const bValue = Number(b[sortBy]) || 0;

      return sortAscending ? aValue - bValue : bValue - aValue;
    };

    const sortedActions = [...actionsWithImpact].sort(sortActions);

    return {
      entries: sortedActions.map((action): SimpleEffectEntry => ({
        action: action.name,
        simpleEffect: action.impact,
      })),
      effectUnit: sortedActions[0]?.impactMetric?.unit?.htmlShort,
      metricName: sortedActions[0]?.impactMetric?.name,
    };
  }, [actions, sortBy, sortAscending, displayYears]);

  // FIXME: Running impact metric name through translation as a quickfix until they are translated in the backend
  const translatedMetricName = t.has(metricName as Parameters<TFunction>[0])
    ? t(metricName as Parameters<TFunction>[0])
    : metricName;

  const title = `${translatedMetricName || t('emissions-impact')} ${displayYears[1]}`;

  const chartData = useMemo(
    () =>
      getSimpleEffectChartConfig(
        entries,
        stripHtml(effectUnit ?? ''),
        formatNumber,
        formatAxisLabel,
        NO_RESORT,
        sortAscending,
        { title, localePack: getEChartsLocaleStrings(locale) }
      ),
    [entries, effectUnit, formatNumber, formatAxisLabel, sortAscending, title, locale]
  );
  const subtitle = t('actions-comparison-subtitle', {
    year: displayYears[1],
    activeScenario: activeScenario?.name ?? '',
  });

  if (entries.length === 0) return null;

  const chartHeight = entries.length * 60 + 110;

  return (
    <ChartWrapper id={id} title={title} subtitle={subtitle} isLoading={refetching}>
      <Chart isLoading={false} data={chartData} height={`${chartHeight}px`} />
    </ChartWrapper>
  );
};

export default ActionsComparison;
