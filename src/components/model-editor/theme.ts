import { type Theme as MuiTheme, type ThemeOptions, createTheme } from '@mui/material/styles';

/**
 * Model-editor MUI theme overrides.
 *
 * The public instance views use a brand-tinted MUI theme built from the
 * instance's kausal theme (`kausal_common/src/themes/mui-theme/`). The editor
 * opts out and uses a neutral, tool-like look instead.
 *
 * We still spread the kausal `BaseTheme` keys (theme.spaces, theme.graphColors,
 * etc.) from the outer theme so shared styled components keep working.
 */

const editorPalette: ThemeOptions['palette'] = {
  mode: 'light',
  primary: {
    main: '#2563eb',
    light: '#60a5fa',
    dark: '#1d4ed8',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#475569',
    light: '#64748b',
    dark: '#334155',
    contrastText: '#ffffff',
  },
  error: { main: '#dc2626', light: '#fecaca', dark: '#991b1b', contrastText: '#ffffff' },
  warning: { main: '#d97706', light: '#fde68a', dark: '#92400e', contrastText: '#ffffff' },
  info: { main: '#0284c7', light: '#bae6fd', dark: '#075985', contrastText: '#ffffff' },
  success: { main: '#16a34a', light: '#bbf7d0', dark: '#166534', contrastText: '#ffffff' },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    disabled: '#94a3b8',
  },
  background: {
    default: '#ffffff',
    paper: '#ffffff',
  },
  divider: '#e2e8f0',
  grey: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
};

const editorFontFamily =
  '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", sans-serif';

const editorTypography: ThemeOptions['typography'] = {
  fontFamily: editorFontFamily,
  fontSize: 13,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 600,
  h1: { fontFamily: editorFontFamily, fontSize: 22, fontWeight: 600, lineHeight: 1.3 },
  h2: { fontFamily: editorFontFamily, fontSize: 18, fontWeight: 600, lineHeight: 1.3 },
  h3: { fontFamily: editorFontFamily, fontSize: 16, fontWeight: 600, lineHeight: 1.3 },
  h4: { fontFamily: editorFontFamily, fontSize: 14, fontWeight: 600, lineHeight: 1.3 },
  h5: { fontFamily: editorFontFamily, fontSize: 13, fontWeight: 600, lineHeight: 1.3 },
  h6: { fontFamily: editorFontFamily, fontSize: 12, fontWeight: 600, lineHeight: 1.3 },
  body1: { fontSize: 13, lineHeight: 1.5 },
  body2: { fontSize: 12, lineHeight: 1.5 },
  subtitle1: { fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
  subtitle2: { fontSize: 12, fontWeight: 600, lineHeight: 1.4 },
  button: { fontSize: 13, fontWeight: 500, textTransform: 'none' },
  caption: { fontSize: 11, lineHeight: 1.4 },
  overline: { fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' },
};

const editorComponents: ThemeOptions['components'] = {
  MuiContainer: {
    styleOverrides: {
      root: undefined,
    },
  },
  MuiButtonBase: {
    defaultProps: { disableRipple: false },
  },
  MuiButton: {
    defaultProps: { disableElevation: true, size: 'small' },
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
        textTransform: 'none',
        boxShadow: 'none',
      },
      sizeSmall: { fontSize: 12, lineHeight: 1.5 },
      contained: { '&:hover': { boxShadow: 'none' } },
      outlined: { '&:hover': { boxShadow: 'none' } },
    },
  },
  MuiIconButton: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      root: { borderRadius: 6 },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        boxShadow: 'none',
      },
    },
  },
  MuiInputBase: {
    styleOverrides: {
      root: {
        border: 0,
        '&:hover': undefined,
        '&.Mui-focused': undefined,
      },
    },
  },
  MuiTextField: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#ffffff',
          borderRadius: 6,
        },
        '& .MuiInputLabel-root': { fontWeight: 500 },
      },
    },
  },
  MuiSelect: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      root: {
        backgroundColor: '#ffffff',
        borderRadius: 6,
      },
    },
  },
  MuiAutocomplete: {
    defaultProps: { size: 'small' },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#ffffff',
          borderRadius: 6,
          border: 0,
        },
      },
      paper: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { '&.MuiChip-sizeSmall': { height: 20 } },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: { borderRadius: 4, fontWeight: 500 },
    },
  },
  MuiTable: {
    styleOverrides: {
      root: {
        '& .MuiTableHead-root': { backgroundColor: '#f8fafc' },
        '& .MuiTableRow-root:hover': { backgroundColor: '#f1f5f9' },
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        color: '#2563eb',
        textDecoration: 'none',
        '&:hover': { color: '#1d4ed8', textDecoration: 'underline' },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: '#ffffff',
        color: '#0f172a',
        boxShadow: 'none',
        borderBottom: '1px solid #e2e8f0',
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: { padding: '0 12px' },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: '#ffffff',
        border: 'none',
        boxShadow: 'none',
      },
    },
  },
  MuiListItem: {
    styleOverrides: {
      root: { '&:hover': { backgroundColor: '#f1f5f9' } },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: { '&:hover': { backgroundColor: '#f1f5f9' } },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: { borderColor: '#e2e8f0' },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: { '&.Mui-checked': { color: '#2563eb' } },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: { '&.Mui-checked': { color: '#2563eb' } },
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: {
        '& .MuiSlider-track': { backgroundColor: '#2563eb' },
        '& .MuiSlider-thumb': {
          backgroundColor: '#2563eb',
          '&:hover': { backgroundColor: '#1d4ed8' },
        },
        '& .MuiSlider-rail': { backgroundColor: '#cbd5e1' },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: { backgroundColor: '#e2e8f0' },
      bar: { backgroundColor: '#2563eb' },
    },
  },
  MuiCircularProgress: {
    styleOverrides: {
      root: { color: '#2563eb' },
    },
  },
  MuiSkeleton: {
    styleOverrides: {
      root: { backgroundColor: '#f1f5f9' },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: { borderRadius: 6, border: '1px solid #e2e8f0' },
    },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: {
        '& .MuiSnackbarContent-root': {
          backgroundColor: '#0f172a',
          color: '#ffffff',
          borderRadius: 6,
        },
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: '#0f172a',
        color: '#ffffff',
        borderRadius: 4,
        fontSize: 11,
      },
    },
  },
  MuiPopover: {
    styleOverrides: {
      paper: {
        backgroundColor: '#ffffff',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: {
        backgroundColor: '#ffffff',
        borderRadius: 6,
        border: '1px solid #e2e8f0',
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        '& .MuiTab-root': {
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': { color: '#2563eb' },
        },
        '& .MuiTabs-indicator': { backgroundColor: '#2563eb' },
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 500,
        '&.Mui-selected': { color: '#2563eb' },
      },
    },
  },
  MuiAccordion: {
    styleOverrides: {
      root: {
        borderRadius: 0,
        backgroundColor: 'transparent',
        boxShadow: 'none',
        borderTop: '1px solid #e2e8f0',
        borderBottom: '1px solid #e2e8f0',
        '&:not(:last-child)': { borderBottom: 0 },
        '&::before': { display: 'none' },
      },
    },
  },
  MuiAccordionSummary: {
    styleOverrides: {
      root: { paddingLeft: 12, paddingRight: 12 },
    },
  },
  MuiAccordionDetails: {
    styleOverrides: {
      root: {
        paddingLeft: 12,
        paddingRight: 12,
        '&.Mui-expanded': { minHeight: 'auto' },
      },
    },
  },
  MuiBreadcrumbs: {
    styleOverrides: {
      root: {
        '& .MuiBreadcrumbs-separator': { color: '#475569' },
      },
    },
  },
  MuiPagination: {
    styleOverrides: {
      root: {
        '& .MuiPaginationItem-root': {
          borderRadius: 6,
          '&.Mui-selected': {
            backgroundColor: '#2563eb',
            color: '#ffffff',
            '&:hover': { backgroundColor: '#1d4ed8' },
          },
        },
      },
    },
  },
};

export function createEditorTheme(outer: MuiTheme): MuiTheme {
  const base = createTheme({
    palette: editorPalette,
    typography: editorTypography,
    components: editorComponents,
    shape: { borderRadius: 6 },
  });
  return {
    ...outer,
    ...base,
  };
}
