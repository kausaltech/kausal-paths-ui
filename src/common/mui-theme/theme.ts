import type { Theme } from '@kausal/themes/types';
import { type Theme as MuiTheme, createTheme } from '@mui/material/styles';

import { getComponents } from './components';
import { getPalette } from './palette';
import { getTypography } from './typography';

const isServer = typeof window === 'undefined';

let muiTheme: MuiTheme;

export function initializeMuiTheme(theme: Theme) {
  if (muiTheme && !isServer) {
    return muiTheme;
  }

  muiTheme = createTheme({
    palette: getPalette(theme),
    typography: getTypography(theme),
    shape: {
      borderRadius: theme.btnBorderRadius,
    },
    spacing: theme.space,
    components: getComponents(theme),
  });

  return muiTheme;
}
