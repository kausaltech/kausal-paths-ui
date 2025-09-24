import type { Theme } from '@kausal/themes/types';
import type { ThemeOptions } from '@mui/material/styles';

export function getComponents(theme: Theme): ThemeOptions['components'] {
  return {
    MuiContainer: {
      styleOverrides: {
        root: ({ theme: muiTheme }) => ({
          '&:not(.MuiContainer-disableGutters)': {
            paddingLeft: theme.spaces.s100,
            paddingRight: theme.spaces.s100,
            [muiTheme.breakpoints.up('sm')]: {
              paddingLeft: theme.spaces.s200,
              paddingRight: theme.spaces.s200,
            },
          },
        }),
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          padding: `${theme.inputBtnPaddingY} ${theme.inputBtnPaddingX}`,
          borderWidth: theme.btnBorderWidth,
          borderRadius: theme.btnBorderRadius,
          fontWeight: theme.fontWeightBold,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
          '&:focus': {
            boxShadow: `0 0 0 0.25rem ${theme.inputBtnFocusColor}`,
          },
        },
        sizeSmall: {
          lineHeight: theme.lineHeightSm,
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: theme.cardBackground.primary,
          borderRadius: theme.cardBorderRadius,
          border: `${theme.cardBorderWidth} solid ${theme.graphColors.grey020}`,
          boxShadow: 'none',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          border: `${theme.inputBorderWidth} solid ${theme.graphColors.grey030}`,
          '&:hover': {
            borderColor: theme.graphColors.grey050,
          },
          '&.Mui-focused': {
            borderColor: theme.inputBtnFocusColor,
            boxShadow: `0 0 0 0.25rem ${theme.inputBtnFocusColor}`,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          border: 0,
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.inputBg,
            borderRadius: theme.inputBorderRadius,
            border: 0,
          },
          '& .MuiInputLabel-root': {
            fontWeight: theme.formLabelFontWeight,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: theme.inputBg,
          borderRadius: theme.inputBorderRadius,
          border: 0,
          '&:hover': {
            borderColor: theme.graphColors.grey050,
          },
          '&.Mui-focused': {
            borderColor: theme.inputBtnFocusColor,
            boxShadow: `0 0 0 0.25rem ${theme.inputBtnFocusColor}`,
          },
        },
      },
      defaultProps: {
        disableUnderline: true,
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-sizeSmall': {
            height: 20,
          },
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        badge: {
          borderRadius: theme.badgeBorderRadius,
          fontWeight: theme.badgeFontWeight,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          '& .MuiTableHead-root': {
            backgroundColor: theme.tableHeadBg,
          },
          '& .MuiTableRow-root:hover': {
            backgroundColor: theme.tableHoverBg,
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: theme.linkColor,
          textDecoration: 'none',
          '&:hover': {
            color: theme.linkColor,
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: theme.cardBackground.primary,
          borderRadius: theme.cardBorderRadius,
          border: `${theme.cardBorderWidth} solid ${theme.graphColors.grey020}`,
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: theme.brandNavBackground,
          color: theme.brandNavColor,
          boxShadow: 'none',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          padding: `0 ${theme.spaces.s100}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.themeColors.white,
          border: 'none',
          boxShadow: 'none',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: theme.tableHoverBg,
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: theme.tableHoverBg,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: theme.graphColors.grey020,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: theme.tableHoverBg,
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 36,
          height: 20,
          padding: 0,
          marginRight: 6,
          '&.MuiSwitch-sizeSmall': {
            width: 32,
            height: 16,
            padding: 0,
            marginRight: 6,

            '& .MuiSwitch-switchBase': {
              padding: 0,
              margin: 2,
            },
            '& .MuiSwitch-thumb': {
              width: 12,
              height: 12,
            },
            '& .MuiSwitch-track': {
              borderRadius: 16 / 2,
            },
          },
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: 'translateX(16px)',
              color: theme.themeColors.white,
              '& + .MuiSwitch-track': {
                backgroundColor: theme.brandDark,
                opacity: 1,
                border: 0,
              },
              '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
              },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': {
              color: theme.brandDark,
              border: `6px solid ${theme.themeColors.white}`,
            },
            '&.Mui-disabled .MuiSwitch-thumb': {
              color: theme.graphColors.grey010,
            },
            '&.Mui-disabled + .MuiSwitch-track': {
              opacity: 0.7,
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 16,
            height: 16,
          },
          '& .MuiSwitch-track': {
            borderRadius: 20 / 2,
            backgroundColor: theme.graphColors.grey030,
            opacity: 1,
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: theme.brandDark,
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: theme.brandDark,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          '& .MuiSlider-track': {
            backgroundColor: theme.brandDark,
          },
          '& .MuiSlider-thumb': {
            backgroundColor: theme.brandDark,
            '&:hover': {
              backgroundColor: theme.brandDark,
            },
          },
          '& .MuiSlider-rail': {
            backgroundColor: theme.graphColors.grey030,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: theme.graphColors.grey030,
        },
        bar: {
          backgroundColor: theme.brandDark,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: theme.brandDark,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: theme.graphColors.grey010,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: theme.cardBorderRadius,
          border: `${theme.cardBorderWidth} solid ${theme.graphColors.grey020}`,
        },
        standardSuccess: {
          backgroundColor: theme.graphColors.green010,
          color: theme.graphColors.green090,
          '& .MuiAlert-icon': {
            color: theme.graphColors.green070,
          },
        },
        standardError: {
          backgroundColor: theme.graphColors.red010,
          color: theme.graphColors.red090,
          '& .MuiAlert-icon': {
            color: theme.graphColors.red070,
          },
        },
        standardWarning: {
          backgroundColor: theme.graphColors.yellow010,
          color: theme.graphColors.yellow090,
          '& .MuiAlert-icon': {
            color: theme.graphColors.yellow070,
          },
        },
        standardInfo: {
          backgroundColor: theme.graphColors.blue010,
          color: theme.graphColors.blue090,
          '& .MuiAlert-icon': {
            color: theme.graphColors.blue070,
          },
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '& .MuiSnackbarContent-root': {
            backgroundColor: theme.themeColors.dark,
            color: theme.themeColors.white,
            borderRadius: theme.cardBorderRadius,
            border: `${theme.cardBorderWidth} solid ${theme.graphColors.grey020}`,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.cardBackground.primary,
          borderRadius: theme.cardBorderRadius,
          border: `${theme.cardBorderWidth} solid ${theme.graphColors.grey020}`,
          boxShadow: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: theme.themeColors.black,
          color: theme.themeColors.white,
          borderRadius: theme.cardBorderRadius,
          fontSize: theme.fontSizeSm,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.cardBackground.primary,
          borderRadius: theme.cardBorderRadius,
          border: `1px solid ${theme.graphColors.grey020}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: theme.cardBackground.primary,
          borderRadius: theme.cardBorderRadius,
          border: `${theme.cardBorderWidth} solid ${theme.graphColors.grey020}`,
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.inputBg,
            borderRadius: theme.inputBorderRadius,
            border: `${theme.inputBorderWidth} solid ${theme.graphColors.grey030}`,
            '&:hover': {
              borderColor: theme.graphColors.grey050,
            },
            '&.Mui-focused': {
              borderColor: theme.inputBtnFocusColor,
              boxShadow: `0 0 0 0.25rem ${theme.inputBtnFocusColor}`,
            },
          },
        },
        paper: {
          backgroundColor: theme.cardBackground.primary,
          borderRadius: theme.cardBorderRadius,
          border: `${theme.cardBorderWidth} solid ${theme.graphColors.grey020}`,
          boxShadow: 'none',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: theme.fontWeightBold,
            '&.Mui-selected': {
              color: theme.brandDark,
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: theme.brandDark,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: theme.fontWeightBold,
          '&.Mui-selected': {
            color: theme.brandDark,
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '0 !important',
          backgroundColor: 'transparent',
          boxShadow: 'none',
          borderLeftWidth: 0,
          borderRightWidth: 0,
          borderTop: `1px solid ${theme.graphColors.grey020}`,
          borderBottom: `1px solid ${theme.graphColors.grey020}`,
          '&:not(:last-child)': {
            borderBottom: 0,
          },
          '&::before': {
            display: 'none',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          paddingLeft: theme.spaces.s100,
          paddingRight: theme.spaces.s100,
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          paddingLeft: theme.spaces.s100,
          paddingRight: theme.spaces.s100,
          '&.Mui-expanded': {
            minHeight: 'auto',
          },
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          '& .MuiBreadcrumbs-separator': {
            color: theme.textColor.secondary,
          },
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            borderRadius: theme.btnBorderRadius,
            '&.Mui-selected': {
              backgroundColor: theme.brandDark,
              color: theme.themeColors.white,
              '&:hover': {
                backgroundColor: theme.brandDark,
              },
            },
          },
        },
      },
    },
  };
}
