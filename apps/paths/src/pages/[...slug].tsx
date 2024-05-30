import Page from 'components/pages/Page';
import { useRouter } from 'next/router';
import { useSite } from 'context/site';

export default function SlugPage(props) {
  const router = useRouter();
  const { slug } = router.query;
  const path = '/' + slug.join('/');
  return <Page path={path} />;
}
