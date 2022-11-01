import { GetInstanceContextQuery } from 'common/__generated__/graphql';
import React, { useContext } from 'react';

export type SiteContextType = {
  title: string,
  instance: GetInstanceContextQuery['instance'],
  scenarios: GetInstanceContextQuery['scenarios'],
  parameters: GetInstanceContextQuery['parameters'],
};


const SiteContext = React.createContext<SiteContextType>({
  title: '',
  instance: {
    id: '',
    name: '',
    owner: '',
    defaultLanguage: '',
    supportedLanguages: [],
    targetYear: 0,
    referenceYear: 0,
    minimumHistoricalYear: 0,
    maximumHistoricalYear: 0,
    leadTitle: '',
    leadParagraph: '',
    homeLink: undefined,
  },
  scenarios: [],
});

export const useSite = () => {
  return useContext(SiteContext);
}

export default SiteContext;
