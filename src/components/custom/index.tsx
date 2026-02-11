import type { ComponentType } from 'react';

import dynamic from 'next/dynamic';

import { useTheme } from '@emotion/react';

export const CUSTOM_COMPONENTS: Record<string, Record<string, ComponentType>> = {
  zurich: {
    GlobalNav: dynamic(() => import('@/components/custom/zurich/GlobalNav'), { ssr: true }),
    Footer: dynamic(() => import('@/components/custom/zurich/Footer'), { ssr: true }),
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
