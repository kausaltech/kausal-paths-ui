import React, { useContext } from 'react';

const SiteContext = React.createContext({
  title: '',
  instance: {},
  scenarios: [],
});

export const useSite = () => {
  return useContext(SiteContext);
}

export default SiteContext;
