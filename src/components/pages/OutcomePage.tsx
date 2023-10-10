import { useEffect, useMemo, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { Container } from 'reactstrap';

import { activeScenarioVar, yearRangeVar } from 'common/cache';
import OutcomeCardSet from 'components/general/OutcomeCardSet';
import SettingsPanelFull from 'components/general/SettingsPanelFull';
import FrontPageHeader from 'components/general/FrontPageHeader';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/router';
import { useSite } from 'context/site';
import { useInstance } from 'common/instance';
import { useTranslation } from 'next-i18next';
import {
  GetPageQuery,
  OutcomeNodeFieldsFragment,
} from 'common/__generated__/graphql';
import { PageRefetchCallback } from './Page';
import { ParsedUrlQuery } from 'querystring';

const HeaderSection = styled.div`
  /* extra padding to accommodate content overlap */
  padding: ${(props) => props.theme.spaces.s100} 0 10rem;
  background: ${(props) => props.theme.brandDark};
`;

const PageHeader = styled.div`
  h1 {
    font-size: ${(props) => props.theme.fontSizeLg};
    color: ${(props) => props.theme.themeColors.white};
  }

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    h1 {
      font-size: ${(props) => props.theme.fontSizeXl};
    }
  }
`;

const OutcomeSection = styled.div`
  /* pull content to overlap the header section */
  margin-top: -10rem;
`;

type OutcomeNode = OutcomeNodeFieldsFragment;

const findVisibleNodes = (
  allNodes: Map<string, OutcomeNode>,
  lastNodeId: string,
  visibleNodes: OutcomeNode[]
) => {
  // Using last active node Id, create an array of all visible nodes
  const lastNode = allNodes.get(lastNodeId)!;
  visibleNodes.unshift(lastNode);
  if (lastNode.outputNodes?.length) {
    if (!allNodes.has(lastNode.outputNodes[0].id)) return visibleNodes;
    findVisibleNodes(allNodes, lastNode.outputNodes[0].id, visibleNodes);
  }
  return visibleNodes;
};

type OutcomePageProps = {
  page: GetPageQuery['page'] & { __typename: 'OutcomePage' };
  refetch: PageRefetchCallback;
  activeScenario: GetPageQuery['activeScenario'];
};

export default function OutcomePage(props: OutcomePageProps) {
  const { page, refetch, activeScenario: queryActiveScenario } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const site = useSite();
  const instance = useInstance();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const router = useRouter();
  const queryNodeId = Array.isArray(router.query.node)
    ? router.query.node[0]
    : router.query.node;
  const [lastActiveNodeId, setLastActiveNodeId] = useState<string | undefined>(
    queryNodeId
  );

  useEffect(() => {
    if (
      activeScenario === null ||
      activeScenario.id !== queryActiveScenario?.id
    ) {
      refetch();
    }
  }, [activeScenario]);

  useEffect(() => {
    if (router.query?.node === lastActiveNodeId) return;
    const query: ParsedUrlQuery = {};
    if (lastActiveNodeId) {
      query.node = lastActiveNodeId;
    }
    router.replace(
      {
        query,
      },
      undefined,
      { shallow: true }
    );
  }, [lastActiveNodeId]);

  const { outcomeNode } = page;
  const { upstreamNodes } = outcomeNode;
  const allNodes = useMemo(
    () => new Map(upstreamNodes.map((node) => [node.id, node])),
    [upstreamNodes]
  );
  allNodes.set(outcomeNode.id, outcomeNode);

  const activeNodeId =
    lastActiveNodeId && allNodes.has(lastActiveNodeId)
      ? lastActiveNodeId
      : outcomeNode.id;
  // TODO: filtering out empty nodes, in some instances there are some -> investigate why
  const visibleNodes = findVisibleNodes(allNodes, activeNodeId, []).filter(
    (node) => node?.id
  );

  const outcomeType = visibleNodes[0].quantity;

  const pageLeadTitle = page.leadTitle || instance.leadTitle;
  const pageLeadParagraph = page.leadParagraph || instance.leadParagraph;

  return (
    <>
      {(pageLeadTitle || pageLeadParagraph) && (
        <FrontPageHeader
          leadTitle={pageLeadTitle}
          leadParagraph={pageLeadParagraph}
          backgroundColor={theme.brandDark}
        />
      )}
      <HeaderSection>
        <Container fluid="lg">
          <PageHeader>
            <h1>{t(`${outcomeType}-forecast`)}</h1>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container fluid="lg">
        <OutcomeSection>
          {visibleNodes.map((node, index) => (
            <OutcomeCardSet
              key={node.id}
              nodeMap={allNodes}
              rootNode={node}
              startYear={yearRange[0]}
              endYear={yearRange[1]}
              activeScenario={activeScenario?.name}
              parentColor="#666"
              activeNodeId={
                index < visibleNodes.length - 1
                  ? visibleNodes[index + 1].id
                  : undefined
              }
              lastActiveNodeId={lastActiveNodeId}
              setLastActiveNodeId={setLastActiveNodeId}
            />
          ))}
        </OutcomeSection>
      </Container>
      <SettingsPanelFull />
    </>
  );
}
