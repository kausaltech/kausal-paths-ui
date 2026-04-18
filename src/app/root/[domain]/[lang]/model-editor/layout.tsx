'use client';

import type { ReactNode } from 'react';

import { Box, ScopedCssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import '@fontsource-variable/inter';

import ModelEditorNav from '@/components/model-editor/ModelEditorNav';
import UserNav from '@/components/model-editor/UserNav';
import { createEditorTheme } from '@/components/model-editor/theme';

type Props = {
  children: ReactNode;
};

export default function ModelEditorLayout({ children }: Props) {
  return (
    <ThemeProvider theme={createEditorTheme}>
      <ScopedCssBaseline
        sx={{
          position: 'relative',
          height: '100dvh',
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>{children}</Box>
        <ModelEditorNav />
        <UserNav />
      </ScopedCssBaseline>
    </ThemeProvider>
  );
}
