import { makeVar, InMemoryCache } from '@apollo/client';
import { SiteContextType } from 'context/site';

export const yearRangeVar = makeVar<Array<number>>([]);
export const activeScenarioVar = makeVar<SiteContextType['scenarios'][0]>(null!);

type SettingsVarType = {
  iconBase: string,
  ogImage: string,
  baselineName: string | null | undefined,
  minYear: number,
  maxYear: number,
  baseYear: number,
  targetYear: number,
  latestMetricYear: number,
  parameters: SiteContextType['parameters'],
}

export const settingsVar = makeVar<SettingsVarType>(null!);
