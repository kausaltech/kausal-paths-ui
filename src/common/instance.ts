import { useContext, createContext } from 'react';
import getConfig from 'next/config';
import GET_INSTANCE_CONTEXT from '../queries/instance';
import type { GetInstanceContextQuery } from 'common/__generated__/graphql';

export type InstanceContextType = GetInstanceContextQuery['instance'];
export type InstanceGoal = InstanceContextType['goals'][0];

const InstanceContext = createContext<InstanceContextType>(null!);

export { GET_INSTANCE_CONTEXT };

export const useInstance = () => useContext(InstanceContext);

export const useFeatures = () => {
  const instance = useInstance();

  return instance.features ?? {};
};

export default InstanceContext;
