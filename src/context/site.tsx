import React, { useContext, type Dispatch, type SetStateAction } from 'react';

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

export type SiteContextWithSetterType = [
  SiteContextType,
  Dispatch<SetStateAction<SiteContextType>>,
];

const SiteContext = React.createContext<SiteContextWithSetterType>(null!);

/**
 * @deprecated Use useSiteWithSetter instead
 */
export const useSite = () => {
  const [siteContext] = useContext(SiteContext);

  return siteContext;
};

/**
 * For legacy reasons, expose the full site context with context value and
 * setter in a separate hook. In future we could migrate all uses of useSite to this.
 */
export const useSiteWithSetter = () => {
  return useContext(SiteContext);
};

export default SiteContext;
