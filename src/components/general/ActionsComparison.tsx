import { useReactiveVar } from '@apollo/client/react';

import type { ActionListQuery } from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { type TFunction, useTranslation } from '@/common/i18n';
import { summarizeYearlyValuesBetween } from '@/common/preprocess';
import { ChartWrapper } from '@/components/charts/ChartWrapper';
import ActionComparisonGraph from '@/components/graphs/ActionComparisonGraph';
import type { ActionWithEfficiency, SortActionsConfig } from '@/types/actions.types';

type Props = {
  sortBy?: SortActionsConfig['sortKey'];

  // TODO: Type props
  actions: ActionWithEfficiency[];
  id: string;
  actionGroups: ActionListQuery['instance']['actionGroups'];
  sortAscending: boolean;
  refetching: boolean;
  displayYears: [number, number];
};

const ActionsComparison = ({
  actions,
  id,
  actionGroups,
  sortBy = 'cumulativeImpact',
  sortAscending,
  refetching,
  displayYears,
}: Props) => {
  // if we have efficiency limit set, remove actions over that limit

  const { t } = useTranslation();
  const activeScenario = useReactiveVar(activeScenarioVar);
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
        action.impactMetric?.forecastValues.find((dataPoint) => dataPoint.year === displayYears[1])
          ?.value || 0,
      cumulativeImpact,
    };
  });

  const sortActions = (a: ActionWithEfficiency, b: ActionWithEfficiency) => {
    const aValue = Number(a[sortBy]) || 0;
    const bValue = Number(b[sortBy]) || 0;

    return sortAscending ? aValue - bValue : bValue - aValue;
  };

  const sortedActions = [...actionsWithImpact].sort(sortActions);

  const macData = {
    ids: sortedActions.map((action) => action.id),
    actions: sortedActions.map((action) => action.name),
    colors: sortedActions.map((action) => action.color || action.group?.color),
    groups: sortedActions.map((action) => action.group?.id),
    impact: sortedActions.map((action) => action.impact),
  };

  const metricName = sortedActions[0].impactMetric?.name;
  // FIXME: Running impact metric name through translation as a quickfix until they are translated in the backend
  const translatedMetricName = t.has(metricName as Parameters<TFunction>[0])
    ? t(metricName as Parameters<TFunction>[0])
    : metricName;
  const impactName = sortedActions[0]?.impactMetric?.name
    ? `${translatedMetricName} ${displayYears[1]}`
    : '';
  const effectUnit = sortedActions[0]?.impactMetric?.unit?.htmlShort;

  const title = `${translatedMetricName || t('emissions-impact')} ${displayYears[1]}`;
  const subtitle = t('actions-comparison-subtitle', {
    year: displayYears[1],
    activeScenario: activeScenario?.name ?? '',
  });

  return (
    <ChartWrapper id={id} title={title} subtitle={subtitle} isLoading={refetching}>
      <ActionComparisonGraph
        data={macData}
        impactName={impactName}
        effectUnit={effectUnit}
        actionIds={macData.ids}
        actionGroups={actionGroups}
      />
    </ChartWrapper>
  );
};

export default ActionsComparison;
