import { useEffect } from 'react';

import { useQuery, useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import { Box, Container, useTheme } from '@mui/material';

import { isLocalDev } from '@common/env';
import { logApolloError } from '@common/logging/apollo';

import type {
  OutcomeNodeQuery,
  OutcomeNodeQueryVariables,
  PageQuery,
} from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import { PageHero } from '@/components/common/PageHero';
import Error from '@/pages/_error';
import GET_OUTCOME_NODE from '@/queries/getOutcomeNode';

import OutcomeBlock from '../general/OutcomeBlock';
import ScenarioPanel from '../scenario/ScenarioPanel';
import type { PageRefetchCallback } from './Page';

const StyledTitle = styled.h1`
  font-size: ${(props) => props.theme.fontSizeMd};
  margin-bottom: ${(props) => props.theme.spaces.s200};
  color: inherit;

  @media (min-width: ${(props) => props.theme.breakpoints.values.md}px) {
    font-size: ${(props) => props.theme.fontSizeLg};
  }
`;

type OutcomePageProps = {
  page: PageQuery['page'] & { __typename: 'OutcomePage' };
  outcomeNodeId: string;
  scenarios: string[] | null;
  activeGoalId: string | null;
  refetch: PageRefetchCallback;
  activeScenario: PageQuery['activeScenario'];
  refetching: boolean;
};

export default function OutcomePage(props: OutcomePageProps) {
  const {
    page,
    outcomeNodeId,
    scenarios,
    activeGoalId,
    refetch,
    activeScenario: queryActiveScenario,
  } = props;
  const theme = useTheme();
  const instance = useInstance();

  const activeScenario = useReactiveVar(activeScenarioVar);

  const showSettingsPanel = !instance.features?.hideNodeDetails;
  const pageLeadTitle = page.leadTitle || instance.leadTitle;
  const pageLeadParagraph = page.leadParagraph || instance.leadParagraph;

  useEffect(() => {
    if (activeScenario === null || activeScenario.id !== queryActiveScenario?.id) {
      void refetch();
    }
  }, [activeScenario, refetch, queryActiveScenario]);

  const queryResp = useQuery<OutcomeNodeQuery, OutcomeNodeQueryVariables>(GET_OUTCOME_NODE, {
    variables: {
      id: outcomeNodeId,
      goal: activeGoalId,
      scenarios,
    },
    context: {
      componentName: 'Page',
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  const { loading, error, previousData } = queryResp;
  const data = queryResp.data ?? previousData;

  if (error) {
    logApolloError(error, { component: 'OutcomePage' });
    if (isLocalDev) {
      throw error;
    } else {
      return <Error statusCode={500} />;
    }
  }

  const outcomeNode = data && data.node;

  return (
    <Box
      sx={{ backgroundColor: theme.graphColors.grey010, paddingBottom: 2, position: 'relative' }}
    >
      <PageHero
        leadTitle={pageLeadTitle ?? undefined}
        leadDescription={pageLeadParagraph ?? undefined}
      >
        {showSettingsPanel && <ScenarioPanel />}
      </PageHero>
      <Container fixed maxWidth="xl" sx={{ py: 1 }}>
        <Box my={3}>
          <StyledTitle as={!!pageLeadTitle ? 'h2' : undefined}>{page.title}</StyledTitle>
          <OutcomeBlock
            loading={loading}
            outcomeNode={outcomeNode}
            activeScenario={activeScenario}
          />
        </Box>
      </Container>
    </Box>
  );
}
