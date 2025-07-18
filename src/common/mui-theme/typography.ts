import type { Theme } from '@kausal/themes/types';
import type { ThemeOptions } from '@mui/material/styles';

function getHeadingFontConfig(theme: Theme, size: string) {
  return {
    fontFamily:
      theme.fontFamilyHeadings !== ''
        ? `${theme.fontFamilyHeadings}, ${theme.fontFamilyFallbackHeadings}`
        : theme.fontFamilyFallbackHeadings,
    fontSize: size,
    fontWeight: theme.headingsFontWeight,
    lineHeight: theme.lineHeightMd,
    color: theme.headingsColor,
    textTransform: theme.headingsTextTransform,
  };
}

export function getTypography(theme: Theme): ThemeOptions['typography'] {
  return {
    fontFamily:
      theme.fontFamily !== ''
        ? `${theme.fontFamily}, ${theme.fontFamilyFallback}`
        : theme.fontFamilyFallback,
    h1: getHeadingFontConfig(theme, theme.fontSizeXxl),
    h2: getHeadingFontConfig(theme, theme.fontSizeXl),
    h3: getHeadingFontConfig(theme, theme.fontSizeLg),
    h4: getHeadingFontConfig(theme, theme.fontSizeMd),
    h5: getHeadingFontConfig(theme, theme.fontSizeBase),
    h6: getHeadingFontConfig(theme, theme.fontSizeSm),
    body1: {
      fontSize: theme.fontSizeBase,
      lineHeight: theme.lineHeightBase,
      fontWeight: theme.fontWeightBase,
    },
    body2: {
      fontSize: theme.fontSizeSm,
      lineHeight: theme.lineHeightBase,
      fontWeight: theme.fontWeightBase,
    },
    button: {
      fontSize: theme.fontSizeBase,
      fontWeight: theme.fontWeightBold,
      textTransform: 'none',
    },
    caption: {
      fontSize: theme.fontSizeSm,
      lineHeight: theme.lineHeightSm,
    },
  };
}
