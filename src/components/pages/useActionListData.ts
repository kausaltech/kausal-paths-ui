import { useMemo } from 'react';

import type { ErrorLike } from '@apollo/client/core';
import { useQuery } from '@apollo/client/react';

import {
  type ActionListQuery,
  DecisionLevel,
  type ImpactOverviewDetailFragment,
  type ImpactOverviewQuery,
  type ImpactOverviewQueryVariables,
  type ImpactOverviewsQuery,
} from '@/common/__generated__/graphql';
import { summarizeYearlyValuesBetween } from '@/common/preprocess';
import { GET_IMPACT_OVERVIEW } from '@/queries/getImpactOverview';
import { GET_IMPACT_OVERVIEWS } from '@/queries/getImpactOverviews';
import type {
  ActionWithEfficiency,
  ActiveOverviewInfo,
  CostBenefitTotals,
} from '@/types/actions.types';

type UseActionListDataProps = {
  data: ActionListQuery | undefined;
  showOnlyMunicipalActions: boolean;
  /**
   * The user's explicit overview pick:
   *   - `undefined`: no pick yet — falls back to the first overview in the list
   *   - `null`: user explicitly picked "emissions impact" (no overview)
   *   - `string`: user picked a specific overview id
   */
  userSelectedOverviewId: string | null | undefined;
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
  /** Resolved overview id (user pick or default-to-first). null = "emissions impact" / none. */
  activeOverviewId: string | null;
  /** Lightweight list of overviews (id, label, graphType, indicatorUnit) for the dropdown. */
  impactOverviews: ImpactOverviewsQuery['impactOverviews'] | undefined;
  /** Heavy detail for the currently selected overview, fetched on demand. */
  activeOverviewDetail: ImpactOverviewDetailFragment | null;
  /** True while either the list or the active detail is being fetched without cached data. */
  impactOverviewsPending: boolean;
  /** Error from either the list or the detail query. */
  impactOverviewsError: ErrorLike | undefined;
};

export function useActionListData({
  data,
  showOnlyMunicipalActions,
  userSelectedOverviewId,
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

  // Lightweight list: powers the dropdown + activeOverview metadata (graphType, label).
  // Cheap to fetch — no per-action values.
  const {
    data: overviewsData,
    loading: overviewsLoading,
    error: overviewsError,
  } = useQuery<ImpactOverviewsQuery>(GET_IMPACT_OVERVIEWS, {
    fetchPolicy: 'cache-and-network',
  });

  const impactOverviews = overviewsData?.impactOverviews;
  const hasEfficiency = impactOverviews ? impactOverviews.length > 0 : false;

  // Resolve the effective overview id: user's explicit pick takes precedence;
  // otherwise default to the first overview once the list arrives.
  const activeOverviewId: string | null =
    userSelectedOverviewId !== undefined
      ? userSelectedOverviewId
      : (impactOverviews?.[0]?.id ?? null);

  // Heavy detail: fetched only for the overview the user has currently selected.
  // Backend computation is expensive, so we avoid pulling actions/dim values for
  // every overview when only one is shown at a time.
  const {
    data: detailData,
    previousData: detailPreviousData,
    loading: detailLoading,
    error: detailError,
  } = useQuery<ImpactOverviewQuery, ImpactOverviewQueryVariables>(GET_IMPACT_OVERVIEW, {
    variables: { id: activeOverviewId ?? '' },
    skip: !activeOverviewId,
    fetchPolicy: 'cache-and-network',
  });

  // Keep showing previous detail while the new one is in-flight so the UI doesn't
  // flash empty between selections. If the user switched back to "no overview"
  // (null), drop stale data instead of holding it over.
  const activeOverviewDetail = activeOverviewId
    ? (detailData?.impactOverview ?? detailPreviousData?.impactOverview ?? null)
    : null;

  const costBenefitByActionId = useMemo(() => {
    const overview = activeOverviewDetail;
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
  }, [activeOverviewDetail, yearRange]);

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

          const efficiencyType = activeOverviewDetail;
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
    [activeOverviewDetail, actionGroup, yearRange, filteredActions, costBenefitByActionId]
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

  // activeOverview metadata comes from the lightweight list — available immediately,
  // doesn't need to wait for the heavy detail fetch.
  const activeOverviewMeta = activeOverviewId
    ? (impactOverviews?.find((o) => o.id === activeOverviewId) ?? null)
    : null;
  const activeOverviewInfo: ActiveOverviewInfo | null = activeOverviewMeta
    ? {
        graphType: activeOverviewMeta.graphType ?? null,
        indicatorUnit: activeOverviewMeta.indicatorUnit.htmlShort,
        label: activeOverviewMeta.label,
      }
    : null;

  // Gate the list UI on first-load of either query. Switching between overviews
  // doesn't count as "pending" — previous detail data carries over via previousData.
  const impactOverviewsPending =
    (overviewsLoading && !overviewsData) ||
    (activeOverviewId !== null && detailLoading && !detailData && !detailPreviousData);

  return {
    usableActions,
    displayedActionsCount,
    totalActionsCount,
    actionGroups,
    hasEfficiency,
    activeOverview: activeOverviewInfo,
    activeOverviewId,
    impactOverviews,
    activeOverviewDetail,
    impactOverviewsPending,
    impactOverviewsError: overviewsError ?? detailError,
  };
}
