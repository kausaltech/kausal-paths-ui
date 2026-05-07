'use client';

import { useEffect } from 'react';

import * as Sentry from '@sentry/nextjs';

import PathsError from '@/components/common/PathsError';
import { isInvalidTokenError, recoverFromInvalidToken } from '@/lib/invalid-token-recovery';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const invalidToken = isInvalidTokenError(error);

  useEffect(() => {
    if (invalidToken) {
      recoverFromInvalidToken();
      return;
    }
    Sentry.captureException(error);
  }, [error, invalidToken]);

  // While the recovery (sign-out + reload) is in flight, render nothing so
  // the user doesn't see a transient error screen for what's a benign
  // expired-session case.
  if (invalidToken) return null;
  return <PathsError statusCode={500} err={error} />;
}
