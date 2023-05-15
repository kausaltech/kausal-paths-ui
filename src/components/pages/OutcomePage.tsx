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
import { useTranslation } from 'next-i18next';
import { GetPageQuery, OutcomeNodeFieldsFragment } from 'common/__generated__/graphql';
import { PageRefetchCallback } from './Page';
import { ParsedUrlQuery } from 'querystring';

const HeaderSection = styled.div`
  padding: 3rem 0 10rem; 
  background: ${(props) => props.theme.brandDark};
  background: linear-gradient(180deg, ${(props) => props.theme.brandDark} 0%, ${(props) => props.theme.brandDark} 100%);
`;

const PageHeader = styled.div` 
  margin: 1rem 0 2rem;

  h1 {
    font-size: 2rem;
    color: ${(props) => props.theme.themeColors.white};
  }
`;

const OutcomeSection = styled.div`
  margin-top: -10rem;
`;

const ActiveScenario = styled.span`
  display: inline-block;
  padding: .5rem;
  border-radius: 0;
  background-color: ${(props) => props.theme.brandDark};
  color: ${(props) => props.theme.themeColors.white};
  font-size: 1.2rem;
  font-weight: 700;
  vertical-align: middle;
`;

type OutcomeNode = OutcomeNodeFieldsFragment;

const findVisibleNodes = (allNodes: Map<string, OutcomeNode>, lastNodeId: string, visibleNodes: OutcomeNode[]) => {
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
  page: GetPageQuery['page'] & { __typename: 'OutcomePage'},
  refetch: PageRefetchCallback,
  activeScenario: GetPageQuery['activeScenario'],
}

export default function OutcomePage(props: OutcomePageProps) {
  const { page, refetch, activeScenario: queryActiveScenario } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const site = useSite();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const router = useRouter();
  const queryNodeId = Array.isArray(router.query.node) ? router.query.node[0] : router.query.node;
  const [lastActiveNodeId, setLastActiveNodeId] = useState<string|undefined>(queryNodeId);

  useEffect(() => {
    if (activeScenario === null || activeScenario.id !== queryActiveScenario?.id) {
      refetch();
    }
  }, [activeScenario]);

  useEffect(() => {
    if (router.query?.node === lastActiveNodeId) return;
    const query: ParsedUrlQuery = {}
    if (lastActiveNodeId) {
      query.node = lastActiveNodeId;
    }
    router.replace({
      query,
    }, undefined, { shallow: true });
  }, [lastActiveNodeId]);

  const { outcomeNode } = page;
  const { upstreamNodes } = outcomeNode;
  const allNodes = useMemo(() => new Map(upstreamNodes.map((node) => [node.id, node])), [upstreamNodes]);
  allNodes.set(outcomeNode.id, outcomeNode);

  const activeNodeId = (lastActiveNodeId && allNodes.has(lastActiveNodeId)) ? lastActiveNodeId : outcomeNode.id;
  // TODO: filtering out empty nodes, in some instances there are some -> investigate why
  const visibleNodes = findVisibleNodes(allNodes, activeNodeId, []).filter((node) => node?.id);

  const outcomeType = visibleNodes[0].quantity;

  return (
    <> 
      { (page.leadTitle || page.leadParagraph) && (
        <FrontPageHeader
          leadTitle={page?.leadTitle}
          leadParagraph={page?.leadParagraph}
          backgroundColor={theme.brandDark}
        />
      )}
      <HeaderSection>
        <Container fluid="lg">
          <PageHeader>
            <h1>
              {t(`${outcomeType}-forecast`)}
              {' '}
              <ActiveScenario>
                {t('scenario')}
                :
                {' '}
                {activeScenario?.name}
              </ActiveScenario>
            </h1>
          </PageHeader>
        </Container>
      </HeaderSection>
      <Container fluid="lg">
        <OutcomeSection>
          { visibleNodes.map((node, index) => (
            <OutcomeCardSet
              key={node.id}
              nodeMap={allNodes}
              rootNode={node}
              startYear={yearRange[0]}
              endYear={yearRange[1]}
              parentColor="#666"
              activeNodeId={index < visibleNodes.length - 1 ? visibleNodes[index + 1].id : undefined}
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
