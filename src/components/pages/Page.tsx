import { Suspense } from 'react';

import Head from 'next/head';

import { type ObservableQuery, useQuery, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';

import { isLocalDev } from '@common/env';
import { logApolloError } from '@common/logging/apollo';

import type { GetPageQuery, GetPageQueryVariables } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import ContentLoader from '@/components/common/ContentLoader';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionListPage from '@/components/pages/ActionListPage';
import OutcomePage from '@/components/pages/OutcomePage';
import StaticPage from '@/components/pages/StaticPage';
import { useSiteOrNull } from '@/context/site';
import Error from '@/pages/_error';
import GET_PAGE from '@/queries/getPage';
import { getProgressTrackingScenario } from '@/utils/progress-tracking';

export type PageRefetchCallback = ObservableQuery<GetPageQuery>['refetch'];

const PageLoader = () => {
  return <ContentLoader fullPage />;
};

type PageProps = {
  path: string;
  headerExtra?: React.JSX.Element;
};

function Page(props: PageProps) {
  const { path, headerExtra } = props;

  const site = useSiteOrNull();
  const scenarios =
    site && !!getProgressTrackingScenario(site.scenarios) ? ['default', 'progress_tracking'] : null;
  const activeGoal = useReactiveVar(activeGoalVar);
  const queryResp = useQuery<GetPageQuery, GetPageQueryVariables>(GET_PAGE, {
    variables: {
      path,
      goal: activeGoal?.id ?? null,
      scenarios,
    },
    context: {
      componentName: 'Page',
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  const { loading, error, previousData, refetch } = queryResp;

  const data = queryResp.data ?? previousData;
  const { t } = useTranslation();

  if (error) {
    logApolloError(error, { component: 'Page' });
    if (isLocalDev) {
      throw error;
    } else {
      return <Error statusCode={500} />;
    }
  }
  if (!data) {
    return <PageLoader />;
  }
  const { page, activeScenario } = data;
  let pageContent: React.ReactNode;
  if (!page) {
    console.error(`No page found for path ${path}`);
    return <Error statusCode={404} />;
  }
  if (page.__typename === 'OutcomePage') {
    pageContent = (
      <OutcomePage
        page={page}
        refetch={refetch}
        activeScenario={activeScenario}
        refetching={loading}
      />
    );
  } else if (page.__typename === 'ActionListPage') {
    pageContent = <ActionListPage page={page} refetch={refetch} />;
  } else if (page.__typename === 'StaticPage') {
    pageContent = <StaticPage page={page} refetch={refetch} />;
  } else {
    console.error('Invalid page type: ', page.__typename);
    return <ErrorMessage message={`${t('invalid-page-type')}: ${page.__typename}`} />;
  }
  return (
    <>
      <Head>
        {site ? (
          <title>
            {site?.title} | {page.title}
          </title>
        ) : null}
      </Head>
      {headerExtra}
      <Suspense fallback={<PageLoader />}>{pageContent}</Suspense>
    </>
  );
}

export default Page;
