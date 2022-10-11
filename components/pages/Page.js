import { useQuery } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Container } from 'reactstrap';
import Head from 'next/head';

import GET_PAGE from 'common/queries/getPage';
import ContentLoader from 'components/common/ContentLoader';
import { useSite } from 'context/site';
import { logError } from 'common/log';
import OutcomePage from 'components/pages/OutcomePage';
import ActionListPage from 'components/pages/ActionListPage';

function Error({ message }) {
  return (
    <Container>
      <h2 className="p-5">{message}</h2>
    </Container>
  );
}

export default function Page({ path, headerExtra }) {
  const site = useSite();
  const { loading, error, data, refetch } = useQuery(
    GET_PAGE,
    {
      variables: {
        path
      }
    }
  );
  const { t } = useTranslation();

  if (loading) {
    return <ContentLoader />;
  }
  if (error) {
    logError(error, {query: GET_PAGE});
    return <Error message={t('error-loading-data')} />;
  }
  const { page, activeScenario } = data;
  let pageContent;
  if (!page) {
    console.error(`No page found for path ${path}`);
    return <Error message={t('page-not-found')} />;
  }
  if (page.__typename === 'OutcomePage') {
    pageContent = <OutcomePage page={page} refetch={refetch} activeScenario={activeScenario} />
  }
  else if (page.__typename === 'ActionListPage') {
    pageContent = <ActionListPage page={page} refetch={refetch} activeScenario={activeScenario} />
  } else {
    console.error('Invalid page type: ', page.__typename);
    return <Error message={`${t('invalid-page-type')} : ${page.__typename}`} />;
  }
  return (
    <>
      <Head>
        <title>
          {site.title}
          {' '}
          |
          {' '}
          {page.title}
        </title>
      </Head>
      {headerExtra}
      {pageContent}
    </>
  );
}
