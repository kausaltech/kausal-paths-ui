'use client';

import type { ReactNode } from 'react';

import { Box, ScopedCssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';

import '@fontsource-variable/inter';

import EditorAccessGate from '@/components/model-editor/EditorAccessGate';
import ModelEditorNav from '@/components/model-editor/ModelEditorNav';
import StaleVersionNotice from '@/components/model-editor/StaleVersionNotice';
import UserNav from '@/components/model-editor/UserNav';
import { createEditorTheme } from '@/components/model-editor/theme';

/**
 * Client chrome for the model editor: the MUI theme, access gate, navigation
 * and account menu. Split out from the layout so the layout itself can stay a
 * server component (it reads the editor-UI-language cookie and loads next-intl
 * messages, which `'use client'` would forbid). The theme is created here
 * because `createEditorTheme` is a function and can't cross the server/client
 * boundary as a prop.
 */
export default function ModelEditorShell({ children }: { children: ReactNode }) {
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
        <EditorAccessGate
          chrome={
            <>
              <ModelEditorNav />
              <StaleVersionNotice />
            </>
          }
        >
          <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>{children}</Box>
        </EditorAccessGate>
        <UserNav />
      </ScopedCssBaseline>
    </ThemeProvider>
  );
}
