import type { ReactiveVar } from '@apollo/client';
import { makeVar } from '@apollo/client';

import { activeGoalVar as pathsActiveGoalVar } from '@common/apollo/paths-cache';

import type { NodeFilterState } from '@/components/model-editor/NodeFilters';
import { emptyNodeFilters } from '@/components/model-editor/NodeFilters';
import type { SiteContextScenario } from '@/context/site';
import type { InstanceGoal } from './instance';

export const yearRangeVar = makeVar<[number, number]>(null!);

// When active scenario changes, we want to be aware if it is user intitated or automatic change
export const activeScenarioVar = makeVar<
  SiteContextScenario & {
    isUserSelected?: boolean;
  }
>(null!);

// Alias of kausal_common's activeGoalVar so shared paths components (e.g.
// DimensionalPieGraph) see the goal this app sets. The cast is needed because
// the app's goal fragment doesn't query `separateYears`, which PathsGoal
// declares (nullable) — the shared consumers don't read it.
export const activeGoalVar = pathsActiveGoalVar as unknown as ReactiveVar<InstanceGoal | null>;
export const scenarioEditorDrawerOpenVar = makeVar<boolean>(false);

export const nodeFiltersVar = makeVar<NodeFilterState>(emptyNodeFilters);
export const nodeFiltersOpenVar = makeVar<boolean>(false);

type SettingsVarType = {
  iconBase: string;
  ogImage: string;
  baselineName: string | null | undefined;
  minYear: number;
  maxYear: number;
  referenceYear: number;
  targetYear: number;
  latestMetricYear: number;
};

export const settingsVar = makeVar<SettingsVarType>(null!);
