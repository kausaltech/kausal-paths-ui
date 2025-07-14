import { useRouter } from 'next/router';

import { getLogger } from '@common/logging/logger';

import Page from '@/components/pages/Page';
import { useSiteOrNull } from '@/context/site';
import Error from '@/pages/_error';
import { stripPathPrefix } from '@/utils/paths';

function SlugPage() {
  const logger = getLogger('slug-page');
  const router = useRouter();
  const { slug } = router.query;
  const path = '/' + (slug as string[]).join('/');
  const site = useSiteOrNull();
  logger.debug({ path }, `render catchall page; path=${path}`);

  if (path.startsWith('/_next') || path.startsWith('/__next')) {
    return <div>Next.js request</div>;
  }

  if (!site) {
    logger.error({ path }, 'no site context');
    return <Error statusCode={500} />;
  }
  return <Page path={stripPathPrefix(path, site?.basePath) || '/'} />;
}

export default SlugPage;
