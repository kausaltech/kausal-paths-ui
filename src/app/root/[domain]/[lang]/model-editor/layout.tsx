'use client';

import type { ReactNode } from 'react';

import { Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import ModelEditorNav from '@/components/model-editor/ModelEditorNav';

const editorTheme = createTheme();

type Props = {
  children: ReactNode;
};

export default function ModelEditorLayout({ children }: Props) {
  return (
    <ThemeProvider theme={editorTheme}>
      <Box sx={{ position: 'relative', height: '100dvh', width: '100%', overflow: 'hidden' }}>
        <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>{children}</Box>
        <ModelEditorNav />
      </Box>
    </ThemeProvider>
  );
}
