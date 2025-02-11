import React, { useContext } from 'react';

import type { GetInstanceContextQuery } from 'common/__generated__/graphql';

export type SiteContextScenario = GetInstanceContextQuery['scenarios'][0];

export type SiteI18nConfig = {
  locale: string;
  defaultLocale: string;
  supportedLocales: string[];
};

export type SiteContextType = {
  instanceId?: string;
  title: string;
  apolloConfig: {
    instanceHostname: string;
    instanceIdentifier: string;
  };

  basePath: string;
  assetPrefix: string;
  i18n: SiteI18nConfig;
  iconBase: string;
  ogImage: string;
  baselineName: string | null | undefined;
  minYear: number;
  maxYear: number;
  referenceYear: number | null;
  targetYear: number;
  latestMetricYear: number;
  owner: string | null;

  scenarios: SiteContextScenario[];
  availableNormalizations: GetInstanceContextQuery['availableNormalizations'];
  parameters: GetInstanceContextQuery['parameters'];
  menuPages: GetInstanceContextQuery['menuPages'];
};

const SiteContext = React.createContext<SiteContextType>(null!);

export const useSite = () => {
  return useContext(SiteContext);
};

export default SiteContext;
