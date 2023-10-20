import { ReactPropTypes, useContext } from 'react';
import { ThemeContext } from 'styled-components';
import { formatStaticUrl } from './links';

import type { Theme } from '@kausal/themes/types';
import { makeThemePropType } from '@kausal/themes/props';

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}

export function useTheme() {
  return useContext<Theme>(ThemeContext);
}

export const themeProp: ReactPropTypes = makeThemePropType();

export function getThemeCSS(themeIdentifier: string) {
  return formatStaticUrl(`/static/themes/${themeIdentifier}/main.css`);
}
