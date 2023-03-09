import { makeVar, } from '@apollo/client';
import { SiteContextScenario, } from 'context/site';

export const yearRangeVar = makeVar<[number, number]>(null!);
export const activeScenarioVar = makeVar<SiteContextScenario>(null!);

type SettingsVarType = {
  iconBase: string,
  ogImage: string,
  baselineName: string | null | undefined,
  minYear: number,
  maxYear: number,
  baseYear: number,
  targetYear: number,
  latestMetricYear: number,
}

export const settingsVar = makeVar<SettingsVarType>(null!);
