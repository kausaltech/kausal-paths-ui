import { Fragment, useEffect, useState } from 'react';

import { useRouter } from 'next/router';

import { useReactiveVar } from '@apollo/client';
import { Box, Skeleton, useTheme } from '@mui/material';
import type { ParsedUrlQuery } from 'querystring';
import { useTranslation } from 'react-i18next';

import type {
  GetOutcomeNodeQuery,
  OutcomeNodeFieldsFragment,
  ScenarioFragmentFragment,
} from '@/common/__generated__/graphql';
import { yearRangeVar } from '@/common/cache';

import OutcomeCardSet from './OutcomeCardSet';

const OutcomeBlockLoader = () => {
  return (
    <Box>
      <Skeleton
        variant="rectangular"
        width="250px"
        height="140px"
        sx={{ backgroundColor: 'white' }}
      />
      <Skeleton
        variant="rectangular"
        width="100%"
        height="420px"
        sx={{ backgroundColor: 'white', mb: 2 }}
      />
      <Skeleton
        variant="text"
        width="280px"
        sx={{ fontSize: '1.5rem', backgroundColor: 'white' }}
      />
    </Box>
  );
};

const findVisibleNodes = (
  allNodes: Map<string, OutcomeNodeFieldsFragment>,
  startNodeId: string,
  visibleNodes: OutcomeNodeFieldsFragment[],
  visited = new Set<string>()
) => {
  const node = allNodes.get(startNodeId)!;
  if (!node || visited.has(startNodeId)) return visibleNodes;
  visited.add(startNodeId);

  // Prepend so parent is displayed before children
  visibleNodes.unshift(node);
  const outputs = node.outputNodes?.map((n) => n.id) ?? [];
  const parentId = outputs.find((id) => allNodes.has(id));
  if (parentId) return findVisibleNodes(allNodes, parentId, visibleNodes, visited);
  return visibleNodes;
};

type OutcomeBlockProps = {
  outcomeNode: GetOutcomeNodeQuery['node'] | null | undefined;
  activeScenario: ScenarioFragmentFragment | null;
  loading: boolean;
};

const OutcomeBlock = (props: OutcomeBlockProps) => {
  const { outcomeNode, activeScenario, loading } = props;
  const router = useRouter();
  const queryNodeId = Array.isArray(router.query.node) ? router.query.node[0] : router.query.node;
  const [lastActiveNodeId, setLastActiveNodeId] = useState<string | undefined>(queryNodeId);
  const yearRange = useReactiveVar(yearRangeVar);
  const theme = useTheme();
  const { t } = useTranslation();
  useEffect(() => {
    if (!router.isReady) return;

    const currentNode =
      Array.isArray(router.query.node) ? router.query.node[0] : router.query.node;
    if (currentNode === lastActiveNodeId) return;
    
    const nextQuery: ParsedUrlQuery = { ...router.query };
    if (lastActiveNodeId) nextQuery.node = lastActiveNodeId;
    else delete nextQuery.node;

    void router.replace(
      { pathname: router.pathname, query: nextQuery },
      undefined,
      { shallow: true }
    );
  }, [lastActiveNodeId, router.isReady, router.pathname, router.query]);
    
  if (loading || !outcomeNode) {
    return <OutcomeBlockLoader />;
  }

  const { upstreamNodes } = outcomeNode;

  // Check if outcomeNode has the required OutcomeNodeFieldsFragment properties
  if (!('id' in outcomeNode) || typeof outcomeNode.id !== 'string') {
    return <OutcomeBlockLoader />;
  }

  // Filter out nodes that do not have an 'id' property
  const validNodes = upstreamNodes.filter(
    (node): node is OutcomeNodeFieldsFragment => 'id' in node && typeof node.id === 'string'
  );
  const allNodes = new Map(validNodes.map((node) => [node.id, node]));
  allNodes.set(outcomeNode.id, outcomeNode as OutcomeNodeFieldsFragment);

  const activeNodeId =
    lastActiveNodeId && allNodes.has(lastActiveNodeId) ? lastActiveNodeId : outcomeNode.id;
  // TODO: filtering out empty nodes, in some instances there are some -> investigate why
  const visibleNodes = findVisibleNodes(allNodes, activeNodeId, []).filter((node) => node?.id);

  return (
    <Fragment>
      {visibleNodes.map((node, index) => (
        <OutcomeCardSet
          key={node.id}
          // Hacky solution to support different sub node titles depending on level
          subNodesTitle={index === 0 ? t('outcome-sub-nodes') : t('outcome-sub-nodes-secondary')}
          nodeMap={allNodes}
          rootNode={node}
          isRootNode={node.id === (outcomeNode as OutcomeNodeFieldsFragment).id}
          startYear={yearRange[0]}
          endYear={yearRange[1]}
          activeScenario={activeScenario?.name ?? ''}
          parentColor={theme.graphColors.blue050}
          activeNodeId={index < visibleNodes.length - 1 ? visibleNodes[index + 1].id : undefined}
          setLastActiveNodeId={setLastActiveNodeId}
          refetching={false}
        />
      ))}
    </Fragment>
  );
};

export default OutcomeBlock;
