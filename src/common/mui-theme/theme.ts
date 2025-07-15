import { createTheme, type Theme as MuiTheme } from '@mui/material/styles';
import type { Theme } from '@kausal/themes/types';

import { getPalette } from './palette';
import { getTypography } from './typography';
import { getComponents } from './components';
import { isServer } from '../environment';

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
