import { useRouter } from 'next/router';

import Page from 'components/pages/Page';
import { useSite } from 'context/site';

import { stripPathPrefix } from '@/utils/paths';

export default function SlugPage() {
  const router = useRouter();
  const { slug } = router.query;
  const path = '/' + (slug as string[]).join('/');
  const site = useSite();
  return <Page path={stripPathPrefix(path, site.basePath)} />;
}
