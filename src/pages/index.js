import { getLogger } from '@common/logging';

import Page from '@/components/pages/Page';

export default function Home() {
  const logger = getLogger('home-page');
  logger.debug('render home page');
  return <Page path="/" />;
}
