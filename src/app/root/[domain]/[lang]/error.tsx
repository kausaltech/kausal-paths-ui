'use client';

import { useEffect } from 'react';

import * as Sentry from '@sentry/nextjs';

import PathsError from '@/components/common/PathsError';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <PathsError statusCode={500} err={error} />;
}
