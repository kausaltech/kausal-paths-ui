import type { ParsedUrlQuery } from 'node:querystring';

import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/router';

import { useReactiveVar } from '@apollo/client';
import styled from '@emotion/styled';
import { Box, useTheme } from '@mui/material';
import type { TFunction } from 'i18next';
import { useTranslation } from 'next-i18next';

import type { GetPageQuery, OutcomeNodeFieldsFragment } from '@/common/__generated__/graphql';
import { activeScenarioVar, yearRangeVar } from '@/common/cache';
import { useInstance } from '@/common/instance';
import { PageHero } from '@/components/common/PageHero';
import OutcomeCardSet from '@/components/general/OutcomeCardSet';

import ScenarioPanel from '../scenario/ScenarioPanel';
import type { PageRefetchCallback } from './Page';

type OutcomeNode = OutcomeNodeFieldsFragment;

const StyledTitle = styled.h1`
  font-size: ${(props) => props.theme.fontSizeLg};
  color: inherit;

  @media (min-width: ${(props) => props.theme.breakpointMd}) {
    font-size: ${(props) => props.theme.fontSizeXl};
  }
`;

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

const getTitle = (t: TFunction, outcomeType: string | null) => {
  switch (outcomeType) {
    case 'emissions':
      return t('emissions-forecast');
    case 'disease_burden':
      return t('disease_burden-forecast');
    default:
      return t('forecast');
  }
};

type OutcomePageProps = {
  page: GetPageQuery['page'] & { __typename: 'OutcomePage' };
  refetch: PageRefetchCallback;
  activeScenario: GetPageQuery['activeScenario'];
  refetching: boolean;
};

export default function OutcomePage(props: OutcomePageProps) {
  const { page, refetch, activeScenario: queryActiveScenario, refetching } = props;
  const theme = useTheme();
  const { t } = useTranslation();
  const instance = useInstance();
  const yearRange = useReactiveVar(yearRangeVar);
  const activeScenario = useReactiveVar(activeScenarioVar);
  const router = useRouter();
  const queryNodeId = Array.isArray(router.query.node) ? router.query.node[0] : router.query.node;
  const [lastActiveNodeId, setLastActiveNodeId] = useState<string | undefined>(queryNodeId);
  const showSettingsPanel = !instance.features?.hideNodeDetails;

  useEffect(() => {
    if (activeScenario === null || activeScenario.id !== queryActiveScenario?.id) {
      void refetch();
    }
  }, [activeScenario, refetch, queryActiveScenario]);

  useEffect(() => {
    if (router.query?.node === lastActiveNodeId) return;
    const query: ParsedUrlQuery = {};
    if (lastActiveNodeId) {
      query.node = lastActiveNodeId;
    }
    void router.replace(
      {
        query,
      },
      undefined,
      { shallow: true }
    );
  }, [lastActiveNodeId, router]);

  const { outcomeNode } = page;
  const { upstreamNodes } = outcomeNode;
  const allNodes = useMemo(() => {
    // Filter out nodes that do not have an 'id' property
    const validNodes = upstreamNodes.filter(
      (node): node is OutcomeNode => 'id' in node && typeof node.id === 'string'
    );
    const map = new Map(validNodes.map((node) => [node.id, node]));
    map.set(outcomeNode.id, outcomeNode);
    return map;
  }, [upstreamNodes, outcomeNode]);

  const activeNodeId =
    lastActiveNodeId && allNodes.has(lastActiveNodeId) ? lastActiveNodeId : outcomeNode.id;
  // TODO: filtering out empty nodes, in some instances there are some -> investigate why
  const visibleNodes = findVisibleNodes(allNodes, activeNodeId, []).filter((node) => node?.id);

  const outcomeType = visibleNodes[0].quantity;

  const pageLeadTitle = page.leadTitle || instance.leadTitle;
  const pageLeadParagraph = page.leadParagraph || instance.leadParagraph;

  return (
    <Box sx={{ backgroundColor: theme.graphColors.grey010, paddingBottom: 2 }}>
      <PageHero
        title={getTitle(t, outcomeType)}
        leadTitle={pageLeadTitle ?? undefined}
        leadDescription={pageLeadParagraph ?? undefined}
        overlap
      >
        {showSettingsPanel && <ScenarioPanel />}

        <Box my={3}>
          <StyledTitle as={!!pageLeadTitle ? 'h2' : undefined}>{page.title}</StyledTitle>
          {visibleNodes.map((node, index) => (
            <OutcomeCardSet
              key={node.id}
              // Hacky solution to support different sub node titles depending on level
              subNodesTitle={
                index === 0 ? t('outcome-sub-nodes') : t('outcome-sub-nodes-secondary')
              }
              nodeMap={allNodes}
              rootNode={node}
              isRootNode={node.id === outcomeNode.id}
              startYear={yearRange[0]}
              endYear={yearRange[1]}
              activeScenario={activeScenario?.name}
              parentColor={theme.graphColors.blue050}
              activeNodeId={
                index < visibleNodes.length - 1 ? visibleNodes[index + 1].id : undefined
              }
              setLastActiveNodeId={setLastActiveNodeId}
              refetching={refetching}
            />
          ))}
        </Box>
      </PageHero>
    </Box>
  );
}
