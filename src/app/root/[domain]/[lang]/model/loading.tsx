'use client';

import { Box, CircularProgress } from '@mui/material';

/**
 * Loading boundary for editor-internal navigations. Renders inside
 * ModelEditorShell (MUI theme + Inter), unlike the `[lang]`-level boundary
 * which sits above all style providers.
 */
export default function Loading() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
      <CircularProgress size={28} />
    </Box>
  );
}
