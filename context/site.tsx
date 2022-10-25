import React, { useContext } from 'react';

const SiteContext = React.createContext({
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
  },
  scenarios: [],
});

export const useSite = () => {
  return useContext(SiteContext);
}

export default SiteContext;
