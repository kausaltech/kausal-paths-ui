import { useMemo } from 'react';

import { useQuery } from '@apollo/client/react';

import {
  type ActionListQuery,
  DecisionLevel,
  type ImpactOverviewsQuery,
} from '@/common/__generated__/graphql';
import { summarizeYearlyValuesBetween } from '@/common/preprocess';
import { GET_IMPACT_OVERVIEWS } from '@/queries/getImpactOverviews';
import type {
  ActionWithEfficiency,
  ActiveOverviewInfo,
  CostBenefitTotals,
} from '@/types/actions.types';

type UseActionListDataProps = {
  data: ActionListQuery | undefined;
  showOnlyMunicipalActions: boolean;
  activeEfficiency: number;
  yearRange: [number, number];
  actionGroup: string;
};

type UseActionListDataResult = {
  usableActions: ActionWithEfficiency[];
  displayedActionsCount: number;
  totalActionsCount: number;
  actionGroups: NonNullable<ActionWithEfficiency['group']>[];
  hasEfficiency: boolean;
  activeOverview: ActiveOverviewInfo | null;
};

export function useActionListData({
  data,
  showOnlyMunicipalActions,
  activeEfficiency,
  yearRange,
  actionGroup,
}: UseActionListDataProps): UseActionListDataResult {
  const filteredActions = useMemo(
    () =>
      (data?.actions ?? []).filter(
        (action) => !showOnlyMunicipalActions || action.decisionLevel === DecisionLevel.Municipality
      ),
    [data, showOnlyMunicipalActions]
  );

  const hasEfficiency = data ? data.impactOverviews.length > 0 : false;

  // For cost_benefit graphType the list needs per-action cost/benefit/netBenefit
  // derived from effectDim — those fields are only in the richer impact-overviews query.
  const { data: impactOverviewsData } = useQuery<ImpactOverviewsQuery>(GET_IMPACT_OVERVIEWS, {
    fetchPolicy: 'cache-and-network',
  });

  const costBenefitByActionId = useMemo(() => {
    const overview = impactOverviewsData?.impactOverviews[activeEfficiency];
    if (!overview || overview.graphType !== 'cost_benefit') {
      return new Map<string, CostBenefitTotals>();
    }
    const unit = overview.effectUnit?.short ?? overview.effectUnit?.long ?? undefined;
    const [startYear, endYear] = yearRange;
    const map = new Map<string, CostBenefitTotals>();
    for (const overviewAction of overview.actions) {
      if (!overviewAction.effectDim) continue;
      // effectDim.values is a Cartesian product over (dim1 × dim2 × ... × years),
      // so values.length === years.length × (product of category counts).
      // The year for values[i] wraps with i % years.length. This mirrors
      // DimensionalMetric.createRows() used by the cost-benefit graph.
      const { years, values, dimensions } = overviewAction.effectDim;

      // Filter to the default scenario slice if a scenario dim is present
      // (matches DimensionalMetric.filterMultipleScenarios()).
      const scenarioDim = dimensions.find((d) => d.id.endsWith(':scenario:ScenarioName'));
      let workingValues: readonly number[] = values;
      if (scenarioDim && scenarioDim.categories.length > 0) {
        const defaultCat = scenarioDim.categories.find((c) => c.originalId === 'default');
        const scenarioIdx = defaultCat ? scenarioDim.categories.indexOf(defaultCat) : 0;
        const perScenario = values.length / scenarioDim.categories.length;
        workingValues = values.slice(scenarioIdx * perScenario, (scenarioIdx + 1) * perScenario);
      }

      const yearCount = years.length;
      let cost = 0;
      let benefit = 0;
      for (let i = 0; i < workingValues.length; i++) {
        const year = years[i % yearCount];
        const value = workingValues[i];
        if (value == null || value === 0) continue;
        if (year < startYear || year > endYear) continue;
        if (value < 0) {
          benefit += Math.abs(value);
        } else {
          cost += value;
        }
      }
      map.set(overviewAction.action.id, {
        cost,
        benefit,
        netBenefit: benefit - cost,
        unit,
      });
    }
    return map;
  }, [impactOverviewsData, activeEfficiency, yearRange]);

  const usableActions = useMemo(
    () =>
      filteredActions
        .map((act) => {
          const out: ActionWithEfficiency = {
            ...act,
            impactOnTargetYear:
              [
                ...(act.impactMetric?.historicalValues ?? []),
                ...(act.impactMetric?.forecastValues ?? []),
              ].find((dataPoint) => dataPoint.year === yearRange[1])?.value ?? 0,
          };

          const efficiencyType = data?.impactOverviews[activeEfficiency];
          const efficiencyAction = efficiencyType?.actions.find((a) => a.action.id === act.id);

          if (!efficiencyType || !efficiencyAction) return out;

          out.cumulativeImpact = efficiencyAction.impactValues
            ? summarizeYearlyValuesBetween(
                {
                  historicalValues: efficiencyAction.impactValues
                    .filter((v): v is NonNullable<typeof v> => v != null)
                    .map((v) => ({ year: v.year, value: v.value })),
                  forecastValues: [],
                },
                yearRange[0],
                yearRange[1]
              )
            : 0;
          out.cumulativeCost = efficiencyAction.costValues
            ? summarizeYearlyValuesBetween(
                {
                  historicalValues: efficiencyAction.costValues
                    .filter((v): v is NonNullable<typeof v> => v != null)
                    .map((v) => ({ year: v.year, value: v.value })),
                  forecastValues: [],
                },
                yearRange[0],
                yearRange[1]
              )
            : 0;
          out.unitAdjustmentMultiplier = efficiencyAction.unitAdjustmentMultiplier ?? undefined;
          if (out.unitAdjustmentMultiplier !== undefined)
            out.cumulativeEfficiency =
              (out.cumulativeCost / Math.abs(out.cumulativeImpact)) * out.unitAdjustmentMultiplier;

          const efficiencyProps: Partial<ActionWithEfficiency> = {
            cumulativeImpactId: efficiencyType?.effectNode?.id,
            cumulativeImpactUnit: efficiencyType?.effectUnit?.htmlShort,
            cumulativeImpactName: `${efficiencyType?.effectNode?.name}`,
            cumulativeCostUnit: efficiencyType?.costUnit?.htmlShort,
            cumulativeCostName: efficiencyType?.costNode?.name,
            cumulativeEfficiencyUnit: efficiencyType?.indicatorUnit.htmlShort,
            cumulativeEfficiencyName: efficiencyType?.label,
            efficiencyCap: efficiencyType?.plotLimitForIndicator ?? undefined,
          };
          Object.assign(out, efficiencyProps);
          const cb = costBenefitByActionId.get(act.id);
          if (cb) {
            out.costBenefit = cb;
          }
          return out;
        })
        .filter((action) => actionGroup === 'ALL_ACTIONS' || actionGroup === action.group?.id),
    [data, actionGroup, activeEfficiency, yearRange, filteredActions, costBenefitByActionId]
  );

  const displayedActionsCount = useMemo(() => {
    const hasAnyGroup = usableActions.some((a) => a.group);
    return hasAnyGroup ? usableActions.filter((a) => a.group).length : usableActions.length;
  }, [usableActions]);

  const totalActionsCount = useMemo(() => {
    const hasAnyGroup = filteredActions.some((a) => a.group);
    return hasAnyGroup ? filteredActions.filter((a) => a.group).length : filteredActions.length;
  }, [filteredActions]);

  const actionGroups = useMemo(
    () =>
      filteredActions.reduce(
        (groups: NonNullable<ActionWithEfficiency['group']>[], action) =>
          !action.group || groups.find((group) => group.id === action.group?.id)
            ? groups
            : [...groups, action.group],
        []
      ),
    [filteredActions]
  );

  const activeOverview = data?.impactOverviews[activeEfficiency] ?? null;
  const activeOverviewInfo: ActiveOverviewInfo | null = activeOverview
    ? {
        graphType: activeOverview.graphType ?? null,
        indicatorUnit: activeOverview.indicatorUnit.htmlShort,
        label: activeOverview.label,
      }
    : null;

  return {
    usableActions,
    displayedActionsCount,
    totalActionsCount,
    actionGroups,
    hasEfficiency,
    activeOverview: activeOverviewInfo,
  };
}
