'use client';

import { ThemeProvider } from 'styled-components';
import { PropsWithChildren } from 'react';
import ThemedGlobalStyles from './ThemedGlobalStyles';
import { Theme } from '@kausal/themes/types';

type OwnProps = PropsWithChildren & {
  theme: Theme;
};

export default function AppThemeProvider({ children, theme }: OwnProps) {
  return (
    <ThemeProvider theme={theme}>
      <ThemedGlobalStyles />
      {children}
    </ThemeProvider>
  );
}
