import { createContext, useContext } from 'react';

import type { InstanceContextQuery } from '@/common/__generated__/graphql';
import GET_INSTANCE_CONTEXT from '../queries/instance';

export type InstanceContextType = InstanceContextQuery['instance'];
export type InstanceGoal = InstanceContextType['goals'][0];

// Local extension for feature flags pending backend support
type InstanceFeaturesExtended = NonNullable<InstanceContextType['features']> & {
  disableScenarioEditing?: boolean;
};

export type InstanceContextExtended = Omit<InstanceContextType, 'features'> & {
  features: InstanceFeaturesExtended;
};

const InstanceContext = createContext<InstanceContextExtended>(null!);

export { GET_INSTANCE_CONTEXT };

export const useInstance = (): InstanceContextExtended => {
  const instance = useContext(InstanceContext);
  if (!instance) {
    throw new Error('useInstance called without a InstanceContext');
  }
  return instance;
};
export const useInstanceOrNull = (): InstanceContextExtended | null => {
  const instance = useContext(InstanceContext);
  if (!instance) return null;
  return instance;
};
export const useFeatures = (): InstanceFeaturesExtended | Record<string, never> => {
  const instance = useInstance();

  return instance.features ?? {};
};

export default InstanceContext;
