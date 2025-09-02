import { Suspense } from 'react';

import Head from 'next/head';

import { type ObservableQuery, useQuery, useReactiveVar } from '@apollo/client';
import type { Theme } from '@kausal/themes/types';
import { Box, Container, Skeleton } from '@mui/material';
import { useTheme } from '@mui/material';
import { useTranslation } from 'next-i18next';

import { isLocalDev } from '@common/env';
import { logApolloError } from '@common/logging/apollo';

import type { GetPageQuery, GetPageQueryVariables } from '@/common/__generated__/graphql';
import { activeGoalVar } from '@/common/cache';
import ErrorMessage from '@/components/common/ErrorMessage';
import ActionListPage from '@/components/pages/ActionListPage';
import DashboardPage from '@/components/pages/DashboardPage';
import OutcomePage from '@/components/pages/OutcomePage';
import StaticPage from '@/components/pages/StaticPage';
import { useSiteOrNull } from '@/context/site';
import Error from '@/pages/_error';
import GET_PAGE from '@/queries/getPage';
import { getProgressTrackingScenario } from '@/utils/progress-tracking';

export type PageRefetchCallback = ObservableQuery<GetPageQuery>['refetch'];

const PageLoader = ({ theme }: { theme: Theme }) => {
  return (
    <Box sx={{ py: 4, backgroundColor: theme.brandDark }}>
      <Container fixed maxWidth="xl">
        <Box
          sx={{
            height: '400px',
          }}
        >
          <Skeleton
            variant="rectangular"
            width="100%"
            height="240px"
            sx={{ backgroundColor: theme.graphColors.grey050, mb: 2 }}
          />
        </Box>
      </Container>
    </Box>
  );
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
  const theme = useTheme();

  if (error) {
    logApolloError(error, { component: 'Page' });
    if (isLocalDev) {
      throw error;
    } else {
      return <Error statusCode={500} />;
    }
  }
  if (!data) {
    return <PageLoader theme={theme} />;
  }
  const { page, activeScenario } = data;
  let pageContent: React.ReactNode;
  if (!page) {
    console.error(`No page found for path ${path}`);
    return <Error statusCode={404} />;
  }

  if (page.__typename === 'DashboardPage') {
    pageContent = <DashboardPage page={page} />;
  } else if (page.__typename === 'OutcomePage') {
    pageContent = (
      <OutcomePage
        page={page}
        outcomeNodeId={page.outcomeNode.id}
        scenarios={scenarios}
        activeGoalId={activeGoal?.id ?? null}
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
      <Suspense fallback={<PageLoader theme={theme} />}>{pageContent}</Suspense>
    </>
  );
}

export default Page;
