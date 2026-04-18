'use client';

import { useState } from 'react';

import { Alert, Snackbar } from '@mui/material';

import { useReactiveVar } from '@apollo/client/react';

import { modelEditorModeVar } from '@/common/cache';

export default function EditorModeSnackbar() {
  const editorMode = useReactiveVar(modelEditorModeVar);
  const [previousMode, setPreviousMode] = useState(editorMode);
  const [open, setOpen] = useState(false);

  if (previousMode !== editorMode) {
    setPreviousMode(editorMode);
    setOpen(true);
  }

  const isDraft = editorMode === 'draft';

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={isDraft ? 'warning' : 'success'}
        variant="filled"
        onClose={() => setOpen(false)}
      >
        Now viewing {isDraft ? 'draft' : 'published'} version of the model.
      </Alert>
    </Snackbar>
  );
}
