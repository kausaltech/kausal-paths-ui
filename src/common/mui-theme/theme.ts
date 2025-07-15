import type { Theme as BaseTheme } from '@kausal/themes/types';
import { type Theme as MuiTheme, createTheme } from '@mui/material/styles';

import { getComponents } from './components';
import { getPalette } from './palette';
import { getTypography } from './typography';

const isServer = typeof window === 'undefined';
declare module '@mui/material/styles' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Theme extends BaseTheme {}
}

declare module '@emotion/react' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Theme extends BaseTheme {}
}

let muiTheme: MuiTheme;

export function initializeMuiTheme(theme: BaseTheme): MuiTheme {
  if (muiTheme && !isServer) {
    return muiTheme;
  }

  muiTheme = {
    ...theme,
    ...createTheme({
      palette: getPalette(theme),
      typography: getTypography(theme),
      shape: {
        borderRadius: theme.btnBorderRadius,
      },
      spacing: theme.space,
      components: getComponents(theme),
    }),
  };

  return muiTheme;
}
