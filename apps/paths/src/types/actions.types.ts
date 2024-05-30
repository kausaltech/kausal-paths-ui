import {
  ActionSortOrder,
  GetActionListQuery,
} from 'common/__generated__/graphql';

export type ActionWithEfficiency = GetActionListQuery['actions'][0] & {
  impactOnTargetYear: number;
  cumulativeImpact?: number;
  cumulativeImpactUnit?: string;
  cumulativeImpactName?: string;
  efficiencyDivisor?: number;
  cumulativeEfficiency?: number;
  cumulativeEfficiencyUnit?: string;
  cumulativeEfficiencyName?: string;
  cumulativeCost?: number;
  cumulativeCostUnit?: string;
  cumulativeCostName?: string;
  efficiencyCap?: number;
};

export type SortActionsBy =
  | `${ActionSortOrder}`
  | 'CUM_EFFICIENCY'
  | 'CUM_COST';

export type SortActionsConfig = {
  key: SortActionsBy;
  label: string;
  isHidden?: boolean;
  sortKey?: NonNullable<keyof ActionWithEfficiency>;
};
