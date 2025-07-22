import { makeVar } from '@apollo/client';

import type { SiteContextScenario } from '@/context/site';

import type { InstanceGoal } from './instance';

export const yearRangeVar = makeVar<[number, number]>(null!);
export const activeScenarioVar = makeVar<SiteContextScenario>(null!);
export const activeGoalVar = makeVar<InstanceGoal | null>(null);
export const scenarioEditorDrawerOpenVar = makeVar<boolean>(false);

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
