'use client';

import { usePathname } from 'next/navigation';

import { getLogger } from '@common/logging/logger';

import PathsError from '@/components/common/PathsError';
import Page from '@/components/pages/Page';
import { useSiteOrNull } from '@/context/site';

export default function SlugPage() {
  const logger = getLogger('slug-page');
  const path = usePathname();
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
