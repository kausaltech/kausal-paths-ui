'use client';

import type { ReactNode } from 'react';

import { Box } from '@mui/material';
import { type Theme as MuiTheme, ThemeProvider, createTheme } from '@mui/material/styles';

import ModelEditorNav from '@/components/model-editor/ModelEditorNav';

type Props = {
  children: ReactNode;
};

function extendTheme(outer: MuiTheme): MuiTheme {
  return createTheme(outer, {
    typography: {
      fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
      fontSize: 13,
      h6: { fontSize: 14, fontWeight: 600 },
      subtitle2: { fontSize: 12, fontWeight: 600 },
      body2: { fontSize: 12 },
    },
  });
}

export default function ModelEditorLayout({ children }: Props) {
  return (
    <ThemeProvider theme={extendTheme}>
      <Box sx={{ position: 'relative', height: '100dvh', width: '100%', overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>{children}</Box>
        <ModelEditorNav />
      </Box>
    </ThemeProvider>
  );
}
