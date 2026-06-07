'use client';

import { useEffect } from 'react';

import { Alert, AlertTitle, Box, Button } from '@mui/material';

import { CombinedGraphQLErrors } from '@apollo/client/errors';
import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { ArrowClockwise } from 'react-bootstrap-icons';

import { isInvalidTokenError, recoverFromInvalidToken } from '@/lib/invalid-token-recovery';

/**
 * The human-readable detail to surface in the alert: the GraphQL error
 * message(s) when the failure came from the API, otherwise the error's own
 * message.
 */
function errorDetail(error: Error): string {
  if (CombinedGraphQLErrors.is(error)) {
    return error.errors.map((e) => e.message).join('\n');
  }
  return error.message;
}

/**
 * Error boundary scoped to the model editor's page content. It sits *inside*
 * `model/layout` (which renders the nav via `ModelEditorShell`), so a failure
 * in a single view — e.g. the node-graph query throwing — is contained to the
 * content area while the navigation stays usable. The broader
 * `[lang]/error.tsx` would otherwise replace the whole subtree, nav included.
 *
 * Invalid-token errors are handled the same way as the parent boundary
 * (sign out + reload) so an expired session in the editor still recovers
 * rather than getting stuck behind this local message.
 */
export default function ModelEditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('model-editor');
  const invalidToken = isInvalidTokenError(error);
  const detail = errorDetail(error);

  useEffect(() => {
    if (invalidToken) {
      recoverFromInvalidToken();
      return;
    }
    Sentry.captureException(error);
  }, [error, invalidToken]);

  // Recovery (sign-out + reload) is in flight; render nothing so the user
  // doesn't see a transient error for a benign expired-session case.
  if (invalidToken) return null;

  return (
    <Box sx={{ pt: 20, px: 3, pb: 3, maxWidth: 600, mx: 'auto' }}>
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            startIcon={<ArrowClockwise size={14} />}
            onClick={reset}
          >
            {t('common-retry')}
          </Button>
        }
      >
        <AlertTitle>{t('editor-error-title')}</AlertTitle>
        {t('editor-error-desc')}
        {detail && (
          <Box
            component="pre"
            sx={{
              mt: 1.5,
              mb: 0,
              p: 1,
              bgcolor: 'rgba(0, 0, 0, 0.06)',
              borderRadius: 0.5,
              fontFamily: 'monospace',
              fontSize: 11,
              lineHeight: 1.4,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 200,
              overflow: 'auto',
            }}
          >
            {detail}
          </Box>
        )}
      </Alert>
    </Box>
  );
}
