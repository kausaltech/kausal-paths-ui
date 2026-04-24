import type { Theme } from '@kausal/themes/types';
import { type Theme as MuiTheme, createTheme } from '@mui/material/styles';

import { getComponents } from '@common/themes/mui-theme/components';
import { getPalette } from '@common/themes/mui-theme/palette';
import { getTypography } from '@common/themes/mui-theme/typography';

const THEME_BASE_URL = '/static/themes';

export async function loadTheme(themeIdentifier = 'default'): Promise<Theme> {
  const url = `${THEME_BASE_URL}/${themeIdentifier}/theme.json`;
  const resp = await fetch(url);
  if (!resp.ok) {
    if (themeIdentifier !== 'default') {
      console.warn(`Theme "${themeIdentifier}" not found, falling back to default`);
      return loadTheme('default');
    }
    throw new Error(`Failed to load theme: ${resp.status}`);
  }
  const theme = await resp.json();
  return theme;
}

export function getThemeCssUrl(theme: Theme): string {
  return `${THEME_BASE_URL}/${theme.mainCssFile}`;
}

let cachedMuiTheme: MuiTheme | null = null;

export function initializeMuiTheme(theme: Theme): MuiTheme {
  if (cachedMuiTheme) return cachedMuiTheme;

  const muiBase = createTheme({
    palette: getPalette(theme),
    typography: getTypography(theme),
    shape: { borderRadius: theme.spaces.s025 },
    spacing: theme.space,
    components: getComponents(theme),
  });

  // Merge Kausal theme properties onto the MUI theme so that
  // useTheme() returns both MUI and Kausal properties.
  cachedMuiTheme = Object.assign(muiBase, theme);
  return cachedMuiTheme;
}
