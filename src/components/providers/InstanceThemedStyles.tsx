'use client';

import type { ReactNode } from 'react';

import { ThemeProvider } from '@mui/material/styles';

import type { Theme } from '@kausal/themes/types';

import ThemedGlobalStyles from '@common/themes/ThemedGlobalStyles';
import { initializeMuiTheme } from '@common/themes/mui-theme/theme';

/**
 * Provides the kausal MUI theme (merged with BaseTheme) so shared styled
 * components can read `theme.spaces`, `theme.graphColors`, etc. Does NOT
 * inject any global CSS — use `InstanceGlobalStyles` for that.
 */
export function InstanceThemeProvider({
  themeProps,
  children,
}: {
  themeProps: Theme;
  children: ReactNode;
}) {
  const muiTheme = initializeMuiTheme(themeProps);
  return <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>;
}

/**
 * Injects instance-wide global CSS (heading colors, body font, link color,
 * etc.). Keep this scoped to routes that opt into the full instance chrome.
 */
export function InstanceGlobalStyles() {
  return <ThemedGlobalStyles />;
}
