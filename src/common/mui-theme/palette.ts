import type { Theme } from '@kausal/themes/types';
import type { ThemeOptions } from '@mui/material/styles';

export function getPalette(theme: Theme): ThemeOptions['palette'] {
  return {
    mode: 'light',
    primary: {
      main: theme.brandDark,
      light: theme.brandLight,
      dark: theme.brandDark,
      contrastText: theme.themeColors.white,
    },
    secondary: {
      main: theme.neutralDark,
      light: theme.neutralLight,
      dark: theme.neutralDark,
      contrastText: theme.themeColors.white,
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
