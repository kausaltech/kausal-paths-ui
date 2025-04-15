import type { ComponentType } from 'react';

import dynamic from 'next/dynamic';

import { useTheme } from 'styled-components';

export const CUSTOM_COMPONENTS = {
  zurich: {
    GlobalNav: dynamic(() => import('@/components/custom/zurich/GlobalNav')),
    Footer: dynamic(() => import('@/components/custom/zurich/Footer')),
  },
};

export function useCustomComponent<CT extends ComponentType>(
  componentName: string,
  FallbackComponent: CT
): CT {
  const theme = useTheme();

  return (
    (CUSTOM_COMPONENTS[theme.name]?.[componentName] as typeof FallbackComponent) ??
    FallbackComponent
  );
}
