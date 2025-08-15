import { useCallback, useMemo, useState } from 'react';

import styled from '@emotion/styled';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import 'overlayscrollbars/styles/overlayscrollbars.css';

import type { OutcomeNodeFieldsFragment } from '@/common/__generated__/graphql';
import { setUniqueColors } from '@/common/colors';
import { getMetricValue, getOutcomeTotal } from '@/common/preprocess';
import OutcomeNodeContent from '@/components/general/OutcomeNodeContent';

import OutcomeCard from './OutcomeCard';

type CardSetProps = {
  $color?: string;
  $haschildren?: boolean;
};

const CardSet = styled.div<CardSetProps>`
  position: relative;
  background-color: transparent;

  .os-top-scrollbar {
    // Move the horizontal scrollbar to the top
    .os-scrollbar-horizontal {
      top: 0;
      bottom: auto;
    }
  }
`;

const CardDeck = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
  // Make space for the horizontal scrollbar
  // TODO: Only apply when os-scrollbar-horizontal is visible
  padding-top: 0.75rem;
`;

const ContentArea = styled.div`
  margin-bottom: 1rem;
`;

const BarHeader = styled.h5`
  font-size: 1rem;
  color: ${({ theme }) => theme.textColor.tertiary};
  margin-bottom: 0.25rem;
`;

const DEFAULT_NODE_ORDER = 100;

function orderByMetric(nodes: OutcomeNodeFieldsFragment[]) {
  function getLastValue(node: OutcomeNodeFieldsFragment) {
    const { metric } = node;
    if (!metric) return 0;
    const lastValue = metric.historicalValues[metric.historicalValues.length - 1]?.value;
    if (lastValue == undefined) return 0;
    return lastValue;
  }
  nodes.sort((a, b) => {
    // First sort by the order field
    let aOrder = a.order ?? DEFAULT_NODE_ORDER;
    let bOrder = b.order ?? DEFAULT_NODE_ORDER;
    if (aOrder < 0) aOrder = DEFAULT_NODE_ORDER - aOrder;
    if (bOrder < 0) bOrder = DEFAULT_NODE_ORDER - bOrder;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    // or if order is the same, use metric values
    const aVal = getLastValue(a);
    const bVal = getLastValue(b);
    if (a.order != null && b.order != null) {
      return b.order - a.order;
    }
    return bVal - aVal;
  });
}

type OutcomeCardSetProps = {
  nodeMap: Map<string, OutcomeNodeFieldsFragment>;
  rootNode: OutcomeNodeFieldsFragment;
  parentColor: string;
  startYear: number;
  endYear: number;
  activeScenario: string;
  activeNodeId: string | undefined;
  setLastActiveNodeId: (s: string) => void;
  subNodesTitle: string;
  isRootNode: boolean;
  refetching: boolean;
};

const OutcomeCardSet = ({
  nodeMap,
  rootNode,
  parentColor,
  startYear,
  endYear,
  activeScenario,
  activeNodeId,
  setLastActiveNodeId,
  subNodesTitle,
  isRootNode,
  refetching,
}: OutcomeCardSetProps) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | undefined>(undefined);
  //const { scrollTo } = useScrollTo(config.molasses);
  const { cardNodes } = useMemo(() => {
    const inputNodeIds = rootNode.inputNodes.map((node) => node.id);
    const cardNodes = [...nodeMap.values()]
      .filter((node) => inputNodeIds.indexOf(node.id) >= 0)
      .map((node) => ({ ...node }));
    orderByMetric(cardNodes);
    setUniqueColors(
      cardNodes,
      (node) => node.color,
      (node, color) => {
        node.color = color;
      }
    );
    const subNodeMap = new Map<string, OutcomeNodeFieldsFragment[]>(
      cardNodes.map((cn) => [
        cn.id,
        cn.inputNodes.map((child) => nodeMap.get(child.id)!).filter((child) => !!child),
      ])
    );
    return {
      cardNodes,
      subNodeMap,
    };
  }, [nodeMap, rootNode.inputNodes]);

  const handleHover = useCallback(
    (evt: string | undefined) => {
      setHoveredNodeId(evt);
    },
    [setHoveredNodeId]
  );

  const handleClick = useCallback(
    (segmentId: string) => {
      // if active node clicked, make its parent active node
      const newActiveNode = segmentId === activeNodeId ? rootNode.id : segmentId;
      setLastActiveNodeId(newActiveNode);
    },
    [activeNodeId, rootNode.id, setLastActiveNodeId]
  );

  // Slightly more complex than needed due to typing in preprocess.ts
  const allNegativeNodes = cardNodes
    .filter((node) =>
      node.metric ? Number(getMetricValue({ metric: node.metric }, endYear)) < 0 : false
    )
    .map((node) => ({ metric: node.metric! }));

  const negativeNodesTotal = getOutcomeTotal(allNegativeNodes, endYear);

  const allPositiveNodes = cardNodes
    .filter((node) =>
      node.metric ? Number(getMetricValue({ metric: node.metric }, endYear)) >= 0 : false
    )
    .map((node) => ({ metric: node.metric! }));

  const positiveNodesTotal = getOutcomeTotal(allPositiveNodes, endYear);

  // console.log("card nodes" , cardNodes);
  return (
    <>
      {isRootNode && (
        <OutcomeCard
          startYear={startYear}
          endYear={endYear}
          node={rootNode}
          state="open"
          hovered={false}
          active={true}
          onHover={undefined}
          handleClick={undefined}
          color={rootNode.color || parentColor}
          positiveTotal={undefined}
          negativeTotal={negativeNodesTotal}
          refetching={refetching}
        />
      )}
      <CardSet id={rootNode.id} $color={rootNode.color!} $haschildren={cardNodes.length > 0}>
        <ContentArea>
          <OutcomeNodeContent
            isRootNode={isRootNode}
            node={rootNode}
            subNodes={cardNodes}
            color={rootNode.color || parentColor}
            startYear={startYear}
            endYear={endYear}
            activeScenario={activeScenario}
            refetching={refetching}
          />
        </ContentArea>
        {cardNodes.length > 0 && (
          <div>
            <BarHeader>
              {subNodesTitle} ({endYear})
            </BarHeader>
            <OverlayScrollbarsComponent
              defer
              className="os-top-scrollbar"
              options={{
                scrollbars: { autoHide: 'never' },
                overflow: { x: 'scroll', y: 'visible' },
              }}
            >
              <CardDeck role="tablist">
                {cardNodes.map((node) => (
                  <OutcomeCard
                    key={node.id}
                    startYear={startYear}
                    endYear={endYear}
                    node={node}
                    state={activeNodeId === undefined ? 'closed' : 'open'}
                    hovered={hoveredNodeId === node.id}
                    active={activeNodeId === node.id}
                    onHover={handleHover}
                    handleClick={handleClick}
                    color={node.color || parentColor}
                    positiveTotal={positiveNodesTotal}
                    negativeTotal={negativeNodesTotal}
                    refetching={refetching}
                  />
                ))}
              </CardDeck>
            </OverlayScrollbarsComponent>
          </div>
        )}
      </CardSet>
    </>
  );
};

export default OutcomeCardSet;
