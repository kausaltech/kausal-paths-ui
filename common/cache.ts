import { makeVar, InMemoryCache } from '@apollo/client';
import { SiteContextType } from 'context/site';

export const yearRangeVar = makeVar<Array<number>>([]);
export const activeScenarioVar = makeVar<SiteContextType['scenarios'][0]>(null!);

type SettingsVarType = {
  iconBase: string,
  ogImage: string,
  baselineName: string,
  minYear: number,
  maxYear: number,
  baseYear: number,
  latestMetricYear: number,
  parameters: SiteContextType['parameters'],
}

export const settingsVar = makeVar<SettingsVarType>(null!);
