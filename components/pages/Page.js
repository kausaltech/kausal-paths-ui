import { useQuery } from '@apollo/client';
import { useTranslation } from 'react-i18next';
import { Container } from 'reactstrap';
import Head from 'next/head';

import GET_PAGE from 'common/queries/getPage';
import ContentLoader from 'components/common/ContentLoader';
import Layout from 'components/Layout';
import { useSite } from 'context/site';
import { logError } from 'common/log';
import OutcomePage from 'components/pages/OutcomePage';


function Error({ message }) {
  return (
    <Layout>
      <Container>
        <h2 className="p-5">{message}</h2>
      </Container>
    </Layout>
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
    return <Layout><ContentLoader /></Layout>;
  }
  if (error) {
    logError(error, {query: GET_PAGE});
    return <Error message={t('error-loading-data')} />;
  }
  const { page, activeScenario } = data;
  let pageContent;
  if (!page) {
    return <Error message={t('page-not-found')} />;
  }
  if (page.__typename === 'OutcomePage') {
    pageContent = <OutcomePage page={page} refetch={refetch} activeScenario={activeScenario} />
  } else {
    console.error('Invalid page type: ', page.__typename);
    return <Error message={t('invalid-page-type')} />;
  }
  return (
    <Layout>
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
    </Layout>
  );
}
