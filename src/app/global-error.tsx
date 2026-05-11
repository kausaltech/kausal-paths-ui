'use client';

import { useEffect } from 'react';

import * as Sentry from '@sentry/nextjs';

import { isInvalidTokenError, recoverFromInvalidToken } from '@/lib/invalid-token-recovery';

export default function GlobalError({
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

  if (invalidToken) {
    return (
      <html>
        <body />
      </html>
    );
  }
  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
          <button onClick={() => reset()}>Try again</button>
        </div>
      </body>
    </html>
  );
}
