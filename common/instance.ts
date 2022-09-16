import { useContext, createContext } from 'react';
import getConfig from 'next/config';
import GET_INSTANCE_CONTEXT from './queries/instance';
import type { GetInstanceContextQuery } from 'common/__generated__/graphql';


export type InstanceContextType = GetInstanceContextQuery['instance'];

/*
export function customizePlan(plan: PlanContextType): PlanContextType {
  const { publicRuntimeConfig } = getConfig();
  const features = {...plan.features};
  if (publicRuntimeConfig.forceFeatures) {
    for (let feat of publicRuntimeConfig.forceFeatures) {
      let enabled = true;
      if (feat[0] === '!') {
        feat = feat.substring(1);
        enabled = false;
      }
      features[feat] = enabled;
    }
  }
  return {
    ...plan,
    features,
  };
}
*/

// @ts-ignore as context will be populated when it is used
const InstanceContext = createContext<InstanceContextType>({});

export { GET_INSTANCE_CONTEXT };
export const useInstance = () => useContext(InstanceContext);
export default InstanceContext;
