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
import { findActionEnabledParam, summarizeYearlyValuesBetween } from '@/common/preprocess';
import { GET_IMPACT_OVERVIEW } from '@/queries/getImpactOverview';
import { GET_IMPACT_OVERVIEWS } from '@/queries/getImpactOverviews';
import type {
  ActionWithEfficiency,
  ActiveOverviewInfo,
  CostBenefitTotals,
} from '@/types/actions.types';

type WedgeEntry = NonNullable<ImpactOverviewDetailFragment['wedge']>[0];

// Reads only `parameters`, so accept any action shape (raw query action or the
// enriched ActionWithEfficiency) — both carry the same parameter list.
const isActionActive = (action: Pick<ActionWithEfficiency, 'parameters'>) =>
  findActionEnabledParam(action.parameters)?.boolValue ?? false;

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
  /** Actions left after the type filter — the list view shows these (active + disabled). */
  displayedActionsCount: number;
  /** All actions before the type filter — the list view's denominator. */
  totalActionsCount: number;
  /** Active (scenario-enabled) actions left after the type filter — the graph view shows these. */
  displayedActiveActionsCount: number;
  /** All active actions before the type filter — the graph view's denominator. */
  totalActiveActionsCount: number;
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

  // Per-action share of the wedge for the list column, computed client-side
  // until the backend provides it directly. 100% is the gap area between the
  // current scenario (floor) and baseline scenario (ceiling) over the selected
  // year range; each action's share is its band area as a proportion of that.
  const wedgeShareByActionId = useMemo(() => {
    const overview = activeOverviewDetail;
    const map = new Map<string, number>();
    if (!overview || overview.graphType !== 'wedge_diagram' || !overview.wedge) {
      return map;
    }
    const [startYear, endYear] = yearRange;
    const areaInRange = (entry: WedgeEntry) =>
      entry.metric.years.reduce(
        (sum, year, i) =>
          year >= startYear && year <= endYear ? sum + (entry.metric.values[i] ?? 0) : sum,
        0
      );

    const scenarios = overview.wedge.filter((e) => e.isScenario);
    const bands = overview.wedge.filter((e) => !e.isScenario);
    // Same floor/ceiling resolution as WedgeDiagram's partition(): match by id,
    // fall back to the order pinned in the wedge-diagram spec.
    const floor = scenarios.find((e) => e.id === 'current_scenario') ?? scenarios[0];
    const ceiling = scenarios.find((e) => e.id === 'baseline_scenario') ?? scenarios[1];

    // Band areas sum to the gap area by backend construction; derive the
    // denominator from the scenarios per the definition above, falling back to
    // the band total if the scenario entries are missing.
    const bandAreas = bands.map((b) => ({ id: b.id, area: areaInRange(b) }));
    const gapArea =
      floor && ceiling
        ? areaInRange(ceiling) - areaInRange(floor)
        : bandAreas.reduce((sum, b) => sum + b.area, 0);
    if (!gapArea) return map;
    for (const band of bandAreas) {
      map.set(band.id, (band.area / gapArea) * 100);
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

          // Wedge shares live in overview.wedge (keyed by action id), which is
          // populated independently of overview.actions — assign it before the
          // early return so it survives even when the action has no efficiency row.
          const wedgeShare = wedgeShareByActionId.get(act.id);
          if (wedgeShare !== undefined) {
            out.wedgeImpactShare = wedgeShare;
          }

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
    [
      activeOverviewDetail,
      actionGroup,
      yearRange,
      filteredActions,
      costBenefitByActionId,
      wedgeShareByActionId,
    ]
  );

  // Numerators: what each view shows after the type filter. The list shows every
  // usable action (active and disabled); the graph shows only the active ones.
  // Both honour the list's ungrouped-hiding rule so the counts match what renders.
  const { displayedActionsCount, displayedActiveActionsCount } = useMemo(() => {
    const hasAnyGroup = usableActions.some((a) => a.group);
    const displayed = hasAnyGroup ? usableActions.filter((a) => a.group) : usableActions;
    return {
      displayedActionsCount: displayed.length,
      displayedActiveActionsCount: displayed.filter(isActionActive).length,
    };
  }, [usableActions]);

  // Denominators: each view's full universe, before the type filter. The list
  // counts against all actions; the graph counts against the active ones only,
  // since disabled actions never appear in it.
  const { totalActionsCount, totalActiveActionsCount } = useMemo(() => {
    const hasAnyGroup = filteredActions.some((a) => a.group);
    const total = hasAnyGroup ? filteredActions.filter((a) => a.group) : filteredActions;
    return {
      totalActionsCount: total.length,
      totalActiveActionsCount: total.filter(isActionActive).length,
    };
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

  // activeOverview metadata is driven by the detail (not the lightweight list),
  // so column headers and per-row values always come from the same snapshot.
  // This avoids the mixed state where headers update from the cached list
  // before the new values arrive.
  const activeOverviewInfo: ActiveOverviewInfo | null = activeOverviewDetail
    ? {
        graphType: activeOverviewDetail.graphType ?? null,
        indicatorUnit: activeOverviewDetail.indicatorUnit.htmlShort,
        label: activeOverviewDetail.label,
      }
    : null;

  // Pending = we want detail for the current selection but have nothing to show.
  // During switches, `activeOverviewDetail` falls back to the previous overview's
  // data via Apollo's `previousData`, so pending stays false and the old snapshot
  // keeps rendering until the new one arrives (atomic flip).
  const impactOverviewsPending =
    (overviewsLoading && !overviewsData) || (activeOverviewId !== null && !activeOverviewDetail);

  return {
    usableActions,
    displayedActionsCount,
    totalActionsCount,
    displayedActiveActionsCount,
    totalActiveActionsCount,
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
