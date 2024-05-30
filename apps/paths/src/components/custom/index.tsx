import { ComponentType } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'common/theme';

export const CUSTOM_COMPONENTS = {
  zurich: {
    GlobalNav: dynamic(() => import('components/custom/zurich/GlobalNav')),
    Footer: dynamic(() => import('components/custom/zurich/Footer')),
  },
};

export const useCustomComponent = (
  componentName: string,
  FallbackComponent: ComponentType
) => {
  const theme = useTheme();

  return CUSTOM_COMPONENTS[theme.name]?.[componentName] ?? FallbackComponent;
};
