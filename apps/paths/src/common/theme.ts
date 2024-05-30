import { useContext } from 'react';
import { ThemeContext } from 'styled-components';
import { formatStaticUrl } from './links';

import type { Theme } from '@kausal/themes/types';
import { makeThemePropType } from '@kausal/themes/props';

export function useTheme() {
  return useContext<Theme>(ThemeContext);
}

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

export const themeProp = await makeThemePropType();

export async function loadTheme(themeIdentifier: string) {
  let themeProps: Theme;
  let readThemeFile: (id: string) => Promise<Theme>;
  if (!process.browser) {
    const fs = require('fs');
    const THEME_PATH = './public/static/themes';
    readThemeFile = async (id: string) => {
      const theme = fs.readFileSync(`${THEME_PATH}/${id}/theme.json`);
      return JSON.parse(theme) as Theme;
    };
  } else {
    const THEME_PATH = '/public/static/themes';
    readThemeFile = async (id: string) => {
      const theme = await import(`${THEME_PATH}/${id}/theme.json`);
      return theme.default;
    };
  }
  try {
    themeProps = await readThemeFile(themeIdentifier);
    return themeProps;
  } catch (error) {
    console.error(`Theme with identifier ${themeIdentifier} not found`);
    console.error(error);
    themeProps = await readThemeFile('default');
    return themeProps;
  }
}

export function getThemeCSS(themeIdentifier: string) {
  return formatStaticUrl(`/static/themes/${themeIdentifier}/main.css`);
}
