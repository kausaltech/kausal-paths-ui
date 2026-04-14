import { useMemo } from 'react';

import { type ActionListQuery, DecisionLevel } from '@/common/__generated__/graphql';
import { summarizeYearlyValuesBetween } from '@/common/preprocess';
import type { ActionWithEfficiency, ActiveOverviewInfo } from '@/types/actions.types';

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
          return out;
        })
        .filter((action) => {
          const efficiencyType = data?.impactOverviews[activeEfficiency];
          if (efficiencyType && !efficiencyType.actions.some((a) => a.action.id === action.id))
            return false;
          return actionGroup === 'ALL_ACTIONS' || actionGroup === action.group?.id;
        }),
    [data, actionGroup, activeEfficiency, yearRange, filteredActions]
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
