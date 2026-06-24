import type { ComponentType } from 'react';

import { useTheme } from '@common/themes';

import Footer, { type SiteFooterProps } from '@/components/common/Footer';
import GlobalNav, { type GlobalNavProps } from '@/components/common/GlobalNav';
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

/**
 * Slot components that resolve the right (custom or fallback) implementation for
 * the active theme and render it.
 *
 * The selection happens in the same scope as the render, referencing the
 * module-level components directly, so the React Compiler can verify the
 * rendered component is static. Returning the component from a hook instead
 * would cross a function boundary the compiler treats as opaque, tripping the
 * "Cannot create components during render" rule.
 */
export function GlobalNavSlot(props: GlobalNavProps) {
  const theme = useTheme();
  const Component = CUSTOM_COMPONENTS[theme.name]?.GlobalNav ?? GlobalNav;
  return <Component {...props} />;
}

export function FooterSlot(props: SiteFooterProps) {
  const theme = useTheme();
  const Component = CUSTOM_COMPONENTS[theme.name]?.Footer ?? Footer;
  return <Component {...props} />;
}
