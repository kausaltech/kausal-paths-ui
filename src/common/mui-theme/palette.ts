import type { Theme } from '@kausal/themes/types';
import type { ThemeOptions } from '@mui/material/styles';
import { darken, lighten } from 'polished';

export function getPalette(theme: Theme): ThemeOptions['palette'] {
  return {
    mode: 'light',
    primary: {
      main: theme.brandDark,
      light: lighten(0.1, theme.brandDark),
      dark: darken(0.1, theme.brandDark),
      contrastText: theme.themeColors.white,
    },
    secondary: {
      main: theme.brandLight,
      light: lighten(0.05, theme.brandLight),
      dark: darken(0.1, theme.brandLight),
      contrastText: theme.themeColors.black,
    },
    error: {
      main: theme.graphColors.red070,
      light: theme.graphColors.red030,
      dark: theme.graphColors.red090,
      contrastText: theme.themeColors.white,
    },
    warning: {
      main: theme.graphColors.yellow050,
      light: theme.graphColors.yellow030,
      dark: theme.graphColors.yellow070,
      contrastText: theme.themeColors.black,
    },
    info: {
      main: theme.graphColors.blue050,
      light: theme.graphColors.blue030,
      dark: theme.graphColors.blue070,
      contrastText: theme.themeColors.white,
    },
    success: {
      main: theme.graphColors.green050,
      light: theme.graphColors.green030,
      dark: theme.graphColors.green070,
      contrastText: theme.themeColors.white,
    },
    text: {
      primary: theme.textColor.primary,
      secondary: theme.textColor.secondary,
      disabled: theme.textColor.tertiary,
    },
    background: {
      default: theme.themeColors.white,
      paper: theme.cardBackground.primary,
    },
    divider: theme.graphColors.grey020,
  };
}
