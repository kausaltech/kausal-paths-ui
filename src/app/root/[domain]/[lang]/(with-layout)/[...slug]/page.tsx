'use client';

import { usePathname } from 'next/navigation';

import { getLogger } from '@common/logging/logger';

import PathsError from '@/components/common/PathsError';
import Page from '@/components/pages/Page';
import { useSiteOrNull } from '@/context/site';
import { stripPathPrefix } from '@/utils/paths';

export default function SlugPage() {
  const logger = getLogger('slug-page');
  const pathname = usePathname();
  const site = useSiteOrNull();

  // The pathname in App Router includes the /root/{domain}/{lang}/ prefix
  // which has been rewritten by the proxy. Extract the actual path.
  // The pathname will be like /root/hostname/en/some/path
  // We need to strip the /root/{domain}/{lang} prefix
  const pathParts = pathname.split('/');
  // /root/{domain}/{lang}/{rest...}
  const path = '/' + pathParts.slice(4).join('/');

  logger.debug({ path }, `render catchall page; path=${path}`);

  if (path.startsWith('/_next') || path.startsWith('/__next')) {
    return <div>Next.js request</div>;
  }

  if (!site) {
    logger.error({ path }, 'no site context');
    return <PathsError statusCode={500} />;
  }
  return <Page path={stripPathPrefix(path, site?.basePath) || '/'} />;
}
