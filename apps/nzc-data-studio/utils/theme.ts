'use client';

import { Inter } from 'next/font/google';
import type {} from '@mui/material/themeCssVarsAugmentation';
import { ThemeOptions, alpha } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

const inter = Inter({ subsets: ['latin'] });

declare module '@mui/material/styles/createPalette' {
  interface ColorRange {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  }

  interface PaletteColor extends ColorRange {}
}

export const brand = {
  50: '#E3F2F1',
  100: '#C7E6E3',
  200: '#8FC2C1;',
  300: '#7CAEB1;',
  400: '#699AA2;',
  500: '#558692;',
  600: '#437A87;',
  700: '#316D7B;',
  800: '#1F6070;',
  900: '#0D5364;',
};

export const secondary = {
  50: '#F9F0FF',
  100: '#E9CEFD',
  200: '#D49CFC',
  300: '#B355F6',
  400: '#750AC2',
  500: '#6709AA',
  600: '#490679',
  700: '#3B0363',
  800: '#2F024F',
  900: '#23023B',
};

export const gray = {
  50: '#FBFCFE',
  100: '#EAF0F5',
  200: '#D6E2EB',
  300: '#BFCCD9',
  400: '#94A6B8',
  500: '#5B6B7C',
  600: '#4C5967',
  700: '#364049',
  800: '#131B20',
  900: '#090E10',
};

export const green = {
  50: '#F6FEF6',
  100: '#E3FBE3',
  200: '#C7F7C7',
  300: '#A1E8A1',
  400: '#51BC51',
  500: '#1F7A1F',
  600: '#136C13',
  700: '#0A470A',
  800: '#042F04',
  900: '#021D02',
};

export const orange = {
  50: '#FFFBF0',
  100: '#FDF1CE',
  200: '#FCE49C',
  300: '#F6CE55',
  400: '#C2940A',
  500: '#AA8109',
  600: '#795C06',
  700: '#634B03',
  800: '#4F3C02',
  900: '#3B2D02',
};

const getDesignTokens = () => ({
  palette: {
    primary: {
      light: brand[200],
      main: brand[500],
      dark: brand[800],
      contrastText: brand[50],
    },
    secondary: {
      light: secondary[300],
      main: secondary[500],
      dark: secondary[800],
    },
    warning: {
      main: '#F7B538',
      dark: '#F79F00',
    },
    error: {
      light: red[50],
      main: red[500],
      dark: red[700],
    },
    success: {
      light: green[300],
      main: green[400],
      dark: green[800],
    },
    grey: {
      50: gray[50],
      100: gray[100],
      200: gray[200],
      300: gray[300],
      400: gray[400],
      500: gray[500],
      600: gray[600],
      700: gray[700],
      800: gray[800],
      900: gray[900],
    },
    divider: alpha(gray[300], 0.5),
    background: {
      default: '#fff',
      paper: gray[50],
    },
    text: {
      primary: gray[800],
      secondary: gray[600],
    },
    action: {
      selected: `${alpha(brand[200], 0.2)}`,
    },
  },
  typography: {
    fontFamily: 'inherit', // We use a Next font imported in the root layout component
    h1: {
      fontSize: 60,
      fontWeight: 600,
      lineHeight: 78 / 70,
      letterSpacing: -0.2,
    },
    h2: {
      fontSize: 48,
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: 42,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: 36,
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h5: {
      fontSize: 20,
      fontWeight: 600,
    },
    h6: {
      fontSize: 18,
    },
    subtitle1: {
      fontSize: 18,
    },
    subtitle2: {
      fontSize: 16,
    },
    body1: {
      fontWeight: 400,
      fontSize: 15,
    },
    body2: {
      fontWeight: 400,
      fontSize: 14,
    },
    caption: {
      fontWeight: 400,
      fontSize: 12,
    },
  },
});

function getTheme(): ThemeOptions {
  return {
    ...getDesignTokens(),
    components: {
      MuiAppBar: {
        styleOverrides: {
          colorPrimary: {
            backgroundColor: brand[900],
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            backgroundColor: orange[100],
            color: theme.palette.text.primary,
            border: `1px solid ${alpha(orange[300], 0.5)}`,
            '& .MuiAlert-icon': {
              color: orange[500],
            },
          }),
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: () => ({
            borderRadius: '10px',
            boxShadow: `0 4px 16px ${alpha(gray[400], 0.2)}`,
            '& .Mui-selected': {
              color: brand[500],
            },
          }),
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            padding: '12px 16px',
            textTransform: 'none',
            borderRadius: '10px',
            fontWeight: 500,
          },
        },
      },
      MuiButtonBase: {
        defaultProps: {
          disableTouchRipple: true,
          disableRipple: true,
        },
        styleOverrides: {
          root: {
            boxSizing: 'border-box',
            transition: 'all 100ms ease-in',
            '&:focus-visible': {
              outline: `3px solid ${alpha(brand[500], 0.5)}`,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            boxShadow: 'none',
            borderRadius: '10px',
            textTransform: 'none',
            ...(ownerState.size === 'small' && {
              maxHeight: '32px',
            }),
            ...(ownerState.size === 'medium' && {
              height: '40px',
            }),
            ...(ownerState.variant === 'contained' &&
              ownerState.color === 'primary' && {
                color: brand[50],
                backgroundColor: brand[500],
                backgroundImage: `linear-gradient(to bottom, ${brand[400]}, ${brand[500]})`,
                boxShadow: `inset 0 1px ${alpha(
                  brand[300],
                  0.5
                )}, inset 0 -2px ${alpha(brand[700], 0.5)}`,
                border: `1px solid ${brand[500]}`,
                '&:hover': {
                  backgroundColor: brand[400],
                  backgroundImage: 'none',
                  boxShadow: `0 0 0 1px  ${alpha(brand[300], 0.5)}`,
                },
              }),
            ...(ownerState.variant === 'outlined' && {
              backgroundColor: alpha(brand[300], 0.1),
              borderColor: brand[300],
              color: brand[500],
              '&:hover': {
                backgroundColor: alpha(brand[300], 0.3),
                borderColor: brand[200],
              },
            }),
            ...(ownerState.variant === 'text' && {
              color: brand[500],
              '&:hover': {
                backgroundColor: alpha(brand[300], 0.3),
                borderColor: brand[200],
              },
            }),
          }),
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            backgroundColor: gray[50],
            borderRadius: 10,
            outline: `1px solid ${alpha(gray[200], 0.8)}`,
            boxShadow: 'none',
            transition: 'background-color, border, 80ms ease',
            ...(ownerState.variant === 'outlined' && {
              boxSizing: 'border-box',
              background: `linear-gradient(to bottom, #FFF, ${gray[50]})`,
              '&:hover': {
                borderColor: brand[300],
                boxShadow: `0 0 24px ${brand[100]}`,
              },
            }),
          }),
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: () => ({
            borderColor: `${alpha(gray[200], 0.8)}`,
          }),
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: () => ({
            backgroundImage: 'none',
            backgroundColor: gray[100],
          }),
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            border: 'none',
          },
          root: () => ({
            '& .MuiInputBase-input': {
              '&::placeholder': {
                opacity: 0.7,
                color: gray[500],
              },
            },
            boxSizing: 'border-box',
            flexGrow: 1,
            maxHeight: 40,
            height: '100%',
            borderRadius: '10px',
            border: '1px solid',
            borderColor: gray[200],
            boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.1)',
            transition: 'border-color 120ms ease-in',
            backgroundColor: alpha(gray[100], 0.4),
            '&:hover': {
              borderColor: brand[300],
            },
            '&.Mui-focused': {
              borderColor: brand[400],
              outline: '4px solid',
              outlineColor: brand[200],
            },
          }),
          input: {
            paddingLeft: 10,
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: ({ theme }) => ({
            typography: theme.typography.caption,
            marginBottom: 8,
          }),
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            border: 'none',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: ({ ownerState }) => ({
            '& label .Mui-focused': {
              color: 'white',
            },
            '& .MuiInputBase-input': {
              '&::placeholder': {
                opacity: 0.7,
                color: gray[500],
              },
            },
            '& .MuiOutlinedInput-root': {
              boxSizing: 'border-box',
              minWidth: 280,
              minHeight: 40,
              height: '100%',
              borderRadius: '10px',
              '& fieldset': {
                border: 'none',
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                background: `${alpha('#FFF', 0.3)}`,
              },
              '&:hover': {
                borderColor: brand[300],
              },
              '&.Mui-focused': {
                borderColor: brand[400],
                outline: '4px solid',
                outlineColor: brand[200],
              },
            },
            ...(ownerState.variant === 'standard' && {
              '&.MuiTextField-root': {
                '& .MuiInput-root:hover:not(.Mui-disabled, .Mui-error):before':
                  {
                    borderColor: brand[200],
                  },
              },
              '& :before': {
                borderBottom: '1px solid',
                borderColor: gray[200],
              },
              '&:hover': {
                '& :before': {
                  borderColor: brand[300],
                },
              },
            }),
          }),
        },
      },
      MuiStepConnector: {
        styleOverrides: {
          line: ({ theme }) => ({
            borderTop: '1px solid',
            borderColor: theme.palette.divider,
            flex: 1,
            borderRadius: '99px',
          }),
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          label: () => ({
            '&.Mui-completed': {
              opacity: 0.4,
            },
          }),
        },
      },
      MuiStepIcon: {
        variants: [
          {
            props: { completed: true },
            style: () => ({
              width: 12,
              height: 12,
            }),
          },
        ],
        styleOverrides: {
          root: ({ theme }) => ({
            color: 'transparent',
            border: `1px solid ${gray[400]}`,
            width: 12,
            height: 12,
            borderRadius: '50%',
            '& text': {
              display: 'none',
            },
            '&.Mui-active': {
              border: 'none',
              color: theme.palette.primary.main,
            },
            '&.Mui-completed': {
              border: 'none',
              color: theme.palette.success.main,
            },
          }),
        },
      },
    },
  };
}

const theme = createTheme(getTheme());

export default theme;
