import { useEffect } from 'react';

import { Box, useTheme } from '@mui/material';

import { useQuery, useReactiveVar } from '@apollo/client/react';

import ContentContainer from '@common/components/ContentContainer';
import { logApolloError } from '@common/logging/apollo';
import styled from '@common/themes/styled';

import type { PageQuery } from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import InlineError from '@/components/common/InlineError';
import { PageHero } from '@/components/common/PageHero';
import { StreamField } from '@/components/common/StreamField';
import GET_OUTCOME_NODE from '@/queries/getOutcomeNode';
import OutcomeBlock from '../general/OutcomeBlock';
import ScenarioPanel from '../scenario/ScenarioPanel';
import type { PageRefetchCallback } from './Page';

// Text and parameter panels shown above the outcome graphs, which follow the panels' settings.
const BodyCard = styled.div`
  padding: 1.5rem 2rem;
  margin-bottom: ${(props) => props.theme.spaces.s200};
  border-radius: ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

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

  const showSettingsPanel = !instance.features?.hideScenarioEditor;
  const pageLeadTitle = page.leadTitle || instance.leadTitle;
  const pageLeadParagraph = page.leadParagraph || instance.leadParagraph;

  useEffect(() => {
    if (activeScenario === null || activeScenario.id !== queryActiveScenario?.id) {
      void refetch();
    }
  }, [activeScenario, refetch, queryActiveScenario]);

  const queryResp = useQuery(GET_OUTCOME_NODE, {
    variables: {
      id: outcomeNodeId,
      goal: activeGoalId,
      scenarios,
    },
    context: {
      componentName: 'Page',
    },
    fetchPolicy: 'cache-and-network',
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: true,
  });
  const { loading, error, previousData } = queryResp;
  // Fall back to previousData only when the latest fetch did not error. After a
  // failed refetch (e.g. goal/scenario change), previousData holds the prior
  // selection's data, which would be stale under the current selectors. With
  // errorPolicy 'all', queryResp.data still carries verified partial data for
  // the current selection on a partial error, and is undefined on a hard failure.
  const data = error ? queryResp.data : (queryResp.data ?? previousData);

  if (error) {
    logApolloError(error, { component: 'OutcomePage' });
  }

  const outcomeNode = data?.node;

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
      <ContentContainer sx={{ py: 1 }}>
        <Box
          sx={{
            my: 3,
          }}
        >
          <StyledTitle as={pageLeadTitle ? 'h2' : undefined}>{page.title}</StyledTitle>
          {!!page.body?.length && (
            <BodyCard>
              {page.body.map((block) =>
                block ? <StreamField key={block.id} block={block} /> : null
              )}
            </BodyCard>
          )}
          {error && <InlineError error={error} />}
          {(!error || outcomeNode) && (
            <OutcomeBlock
              loading={loading}
              outcomeNode={outcomeNode}
              activeScenario={activeScenario}
            />
          )}
        </Box>
      </ContentContainer>
    </Box>
  );
}
