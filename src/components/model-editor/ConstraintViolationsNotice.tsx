'use client';

import { Alert, AlertTitle, Box, Snackbar, Typography } from '@mui/material';

import { useReactiveVar } from '@apollo/client/react';
import { useTranslations } from 'next-intl';

import {
  conflictNodeNames,
  constraintViolationsVar,
  nodeNamesByUuidVar,
} from './constraintViolations';

/**
 * Snackbar shown when the backend's constraint solver rejected a write
 * (edge, binding or publish) because it would introduce structural
 * conflicts. Nothing was written, so the message explains why the change
 * didn't take instead of letting it fail silently.
 */
export default function ConstraintViolationsNotice() {
  const t = useTranslations('model-editor');
  const conflicts = useReactiveVar(constraintViolationsVar);
  const namesByUuid = useReactiveVar(nodeNamesByUuidVar);
  const dismiss = () => constraintViolationsVar(null);

  return (
    <Snackbar open={conflicts !== null} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert severity="error" onClose={dismiss} sx={{ maxWidth: 560 }}>
        <AlertTitle sx={{ fontSize: 14 }}>{t('editor-constraint-conflicts-title')}</AlertTitle>
        <Box
          component="ul"
          sx={{ m: 0, pl: 2.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}
        >
          {(conflicts ?? []).map((conflict, i) => {
            const names = conflictNodeNames(conflict, namesByUuid);
            return (
              <Box component="li" key={i}>
                <Typography variant="body2" sx={{ fontSize: 13 }}>
                  {conflict.message}
                </Typography>
                {names.length > 0 && (
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {names.join(', ')}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Alert>
    </Snackbar>
  );
}
