import 'server-only';
import fs from 'fs';
import type { Theme } from '@kausal/themes/types';

import { PropsWithChildren } from 'react';
import AppThemeProvider from './ThemeProvider';

function loadTheme(themeIdentifier: string) {
  try {
    const THEME_PATH = './public/static/themes';
    const theme = fs.readFileSync(
      `${THEME_PATH}/${themeIdentifier}/theme.json`,
      { encoding: 'utf8' }
    );
    return JSON.parse(theme) as Theme;
  } catch (error) {
    console.error(`Theme with identifier ${themeIdentifier} not found`);
    console.error(error);
    //themeProps = await readThemeFile('default');
    return {} as Theme;
  }
}

export default function ThemeLoader({ children }: PropsWithChildren) {
  const theme = loadTheme('zurich');
  return <AppThemeProvider theme={theme}>{children}</AppThemeProvider>;
}
