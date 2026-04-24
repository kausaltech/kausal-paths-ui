import type { ComponentType } from 'react';

import { useTheme } from '@common/themes';

import type { SiteFooterProps } from '@/components/common/Footer';
import type { GlobalNavProps } from '@/components/common/GlobalNav';
import FooterZurich from '@/components/custom/zurich/Footer';
import GlobalNavZurich from '@/components/custom/zurich/GlobalNav';

type CustomThemeComponents = {
  GlobalNav: ComponentType<GlobalNavProps>;
  Footer: ComponentType<SiteFooterProps>;
};

export const CUSTOM_COMPONENTS: Record<string, CustomThemeComponents> = {
  zurich: {
    GlobalNav: GlobalNavZurich,
    Footer: FooterZurich,
  },
};

export function useCustomComponent<CompName extends keyof CustomThemeComponents>(
  componentName: CompName,
  FallbackComponent: CustomThemeComponents[CompName]
): CustomThemeComponents[CompName] {
  const theme = useTheme();

  return CUSTOM_COMPONENTS[theme.name]?.[componentName] ?? FallbackComponent;
}
