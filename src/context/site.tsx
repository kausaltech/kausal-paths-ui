import { GetInstanceContextQuery } from 'common/__generated__/graphql';
import React, { useContext } from 'react';

export type SiteContextScenario = GetInstanceContextQuery['scenarios'][0];

export type SiteContextType = {
  title: string,
  apolloConfig: {
    instanceHostname: string,
    instanceIdentifier: string,
  },
  scenarios: SiteContextScenario[],
  availableNormalizations: GetInstanceContextQuery['availableNormalizations'],
  parameters: GetInstanceContextQuery['parameters'],
  menuPages: GetInstanceContextQuery['menuPages'],
};


const SiteContext = React.createContext<SiteContextType>(null!);

export const useSite = () => {
  return useContext(SiteContext);
}

export default SiteContext;
