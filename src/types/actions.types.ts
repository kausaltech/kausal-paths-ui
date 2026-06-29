import type { ActionListQuery, ActionSortOrder } from '@/common/__generated__/graphql';

export type ActiveOverviewInfo = {
  graphType: string | null;
  indicatorUnit: string | null;
  label: string;
};

export type CostBenefitTotals = {
  cost: number;
  benefit: number;
  netBenefit: number;
  unit?: string;
};

export type ActionWithEfficiency = ActionListQuery['actions'][0] & {
  impactOnTargetYear: number;
  cumulativeImpactId?: string;
  cumulativeImpact?: number;
  cumulativeImpactUnit?: string;
  cumulativeImpactName?: string;
  unitAdjustmentMultiplier?: number;
  cumulativeEfficiency?: number;
  cumulativeEfficiencyUnit?: string;
  cumulativeEfficiencyName?: string;
  cumulativeCost?: number;
  cumulativeCostUnit?: string;
  cumulativeCostName?: string;
  efficiencyCap?: number;
  costBenefit?: CostBenefitTotals;
  /**
   * Wedge-diagram share: the action's band area over the selected year range
   * as a percentage of the gap area between the current and baseline scenarios.
   */
  wedgeImpactShare?: number;
};

export type SortActionsBy = `${ActionSortOrder}` | 'CUM_EFFICIENCY' | 'CUM_COST';

export type SortActionsConfig = {
  key: SortActionsBy;
  label: string;
  isHidden?: boolean;
  sortKey?: NonNullable<keyof ActionWithEfficiency>;
};
