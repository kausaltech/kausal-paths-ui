import { createContext, useContext } from 'react';

import type { InstanceContextQuery } from '@/common/__generated__/graphql';

import GET_INSTANCE_CONTEXT from '../queries/instance';

export type InstanceContextType = InstanceContextQuery['instance'];
export type InstanceGoal = InstanceContextType['goals'][0];

const InstanceContext = createContext<InstanceContextType>(null!);

export { GET_INSTANCE_CONTEXT };

export const useInstance = () => {
  const instance = useContext(InstanceContext);
  if (!instance) {
    throw new Error('useInstance called without a InstanceContext');
  }
  return instance;
};
export const useInstanceOrNull = () => {
  const instance = useContext(InstanceContext);
  if (!instance) return null;
  return instance;
};
export const useFeatures = () => {
  const instance = useInstance();

  return instance.features ?? {};
};

export default InstanceContext;
