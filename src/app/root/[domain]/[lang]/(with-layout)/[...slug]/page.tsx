'use client';

import { useParams } from 'next/navigation';

import { getLogger } from '@common/logging/logger';

import PathsError from '@/components/common/PathsError';
import Page from '@/components/pages/Page';
import { useSiteOrNull } from '@/context/site';

export default function SlugPage() {
  const logger = getLogger('slug-page');
  // `slug` is the rewritten path segments after `[domain]/[lang]`, so it
  // is already locale-stripped. Using `usePathname()` here would include
  // the user-visible locale prefix (e.g. `/sv/actions`), which the backend
  // doesn't recognise.
  const params = useParams<{ slug: string[] }>();
  const path = '/' + (params.slug?.join('/') ?? '');
  const site = useSiteOrNull();

  logger.debug({ path }, `render catchall page; path=${path}`);

  if (path.startsWith('/_next') || path.startsWith('/__next')) {
    return <div>Next.js request</div>;
  }

  if (!site) {
    logger.error({ path }, 'no site context');
    return <PathsError statusCode={500} />;
  }
  return <Page path={path} />;
}
