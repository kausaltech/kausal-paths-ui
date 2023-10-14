import { ObservableQuery, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { Container } from 'reactstrap';
import Head from 'next/head';

import GET_PAGE from 'queries/getPage';
import ContentLoader from 'components/common/ContentLoader';
import { useSite } from 'context/site';
import { logError } from 'common/log';
import GraphQLError from 'components/common/GraphQLError';
import OutcomePage from 'components/pages/OutcomePage';
import ActionListPage from 'components/pages/ActionListPage';
import ErrorMessage from 'components/common/ErrorMessage';
import {
  GetPageQuery,
  GetPageQueryVariables,
} from 'common/__generated__/graphql';
import { Suspense } from 'react';
import { activeGoalVar } from 'common/cache';

export type PageRefetchCallback = ObservableQuery<GetPageQuery>['refetch'];

const PageLoader = () => {
  return <ContentLoader fullPage />;
};

export default function Page({ path, headerExtra }) {
  const site = useSite();
  const activeGoal = useReactiveVar(activeGoalVar);
  const queryResp = useQuery<GetPageQuery, GetPageQueryVariables>(GET_PAGE, {
    variables: {
      path,
      goal: activeGoal?.id,
    },
    fetchPolicy: 'cache-and-network',
  });
  const { loading, error, previousData, refetch } = queryResp;
  const data = queryResp.data ?? previousData;
  const { t } = useTranslation();

  if (error) {
    logError(error, { query: GET_PAGE });
    return (
      <Container fluid="lg" className="pt-5">
        <GraphQLError errors={error} />
      </Container>
    );
  }
  if (!data) {
    return <PageLoader />;
  }
  const { page, activeScenario } = data;
  let pageContent: React.ReactNode;
  if (!page) {
    console.error(`No page found for path ${path}`);
    return <ErrorMessage message={t('page-not-found')} />;
  }
  if (page.__typename === 'OutcomePage') {
    pageContent = (
      <OutcomePage
        page={page}
        refetch={refetch}
        activeScenario={activeScenario}
      />
    );
  } else if (page.__typename === 'ActionListPage') {
    pageContent = (
      <ActionListPage
        page={page}
        refetch={refetch}
        activeScenario={activeScenario}
      />
    );
  } else {
    console.error('Invalid page type: ', page.__typename);
    return (
      <ErrorMessage
        message={`${t('invalid-page-type')} : ${page.__typename}`}
      />
    );
  }
  return (
    <>
      <Head>
        <title>
          {site.title} | {page.title}
        </title>
      </Head>
      {headerExtra}
      <Suspense fallback={<PageLoader />}>{pageContent}</Suspense>
    </>
  );
}
