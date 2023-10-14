import { useState, useMemo, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'next-i18next';
import { useSpring, animated, config } from '@react-spring/web';
import useScrollTo from 'react-spring-scroll-to-hook';
import { getMetricValue, getOutcomeTotal } from 'common/preprocess';
import OutcomeNodeContent from 'components/general/OutcomeNodeContent';
import OutcomeCard from './OutcomeCard';
import { OutcomeNodeFieldsFragment } from 'common/__generated__/graphql';
import { setUniqueColors } from 'common/colors';

const CardSet = styled(animated.div)<{
  $color?: string;
  $haschildren?: boolean;
}>`
  position: relative;
  padding-bottom: ${(props) => (props.$haschildren ? '190px' : '1rem')};
  margin-top: 1rem;
  background-color: ${({ theme }) => theme.cardBackground.secondary};
  // border-radius:  ${(props) => props.theme.cardBorderRadius};
  // border: 2px solid ${(props) =>
    props.$color || props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

const SubNodes = styled.div`
  padding: 0.5rem;
`;
const CardDeck = styled.div`
  position: absolute;
  display: flex;
  overflow-x: auto;
  overflow-y: visible;
  width: calc(100% - 1rem);
  bottom: -1rem;
  height: 206px;
  z-index: 1;
  scroll-behavior: smooth;
`;

const ContentArea = styled.div`
  padding: 0.5rem;
`;

const Bar = styled.div`
  display: flex;
  margin: 0.5rem 0 1.5rem;
  height: 1rem;
  border: ${(props) => props.color} solid;
  border-width: 0;
  border-top: 0;
  cursor: pointer;
`;

const BarHeader = styled.h5`
  font-size: 1rem;
  color: ${(props) => props.theme.graphColors.grey060};
`;

const Segment = styled.div`
  display: inline-block;
  position: relative;
  border: ${(props) => props.theme.themeColors.white} solid;
  border-width: 2px;
  height: 1.5rem;

  &.hovered::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 0.25rem;
    background-color: ${(props) => props.theme.graphColors.grey050};
    bottom: -0.5rem;
  }

  &.active::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 0.25rem;
    background-color: ${(props) => props.theme.graphColors.grey090};
    bottom: -0.5rem;
  }
`;

const BarSeparator = styled.div`
  display: inline-block;
  position: relative;
  height: 2rem;
  width: 2px;
  background-color: ${(props) => props.theme.graphColors.grey070};
`;

const OutcomeBar = (props) => {
  const {
    nodes,
    date,
    hovered,
    onHover,
    handleClick,
    activeNode,
    parentColor,
  } = props;
  const { t } = useTranslation();
  const nodesTotal = getOutcomeTotal(nodes, date);
  // Let's get the outcome type from first node and use it with translate to give bar a title
  // TODO: get title from API
  const outcomeType = nodes[0].quantity;
  const negativeNodes = nodes.filter((node) => getMetricValue(node, date) < 0);
  const positiveNodes = nodes.filter((node) => getMetricValue(node, date) >= 0);

  return (
    <>
      <BarHeader>{`${t(outcomeType)} ${date}`}</BarHeader>
      <Bar color={parentColor}>
        {positiveNodes.map((node) => (
          <Segment
            key={node.id}
            style={{
              width: `${(getMetricValue(node, date) / nodesTotal) * 100 || 0}%`,
              backgroundColor: node.color || parentColor,
              display: `${getMetricValue(node, date) ? '' : 'none'}`,
            }}
            className={`${hovered === node.id ? 'hovered' : ''} ${
              activeNode === node.id ? 'active' : ''
            }`}
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(undefined)}
            onClick={() => handleClick(node.id)}
          />
        ))}
        {negativeNodes?.length > 0 && <BarSeparator />}
        {negativeNodes.map((node) => (
          <Segment
            key={node.id}
            style={{
              width: `${
                (-getMetricValue(node, date) / nodesTotal) * 100 || 0
              }%`,
              backgroundColor: node.color || parentColor,
              display: `${getMetricValue(node, date) ? '' : 'none'}`,
            }}
            className={`${hovered === node.id ? 'hovered' : ''} ${
              activeNode === node.id ? 'active' : ''
            }`}
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(undefined)}
            onClick={() => handleClick(node.id)}
          />
        ))}
        {nodes.length < 2 && (
          <Segment
            style={{
              width: '100%',
              backgroundColor: parentColor,
            }}
          />
        )}
      </Bar>
    </>
  );
};

const DEFAULT_NODE_ORDER = 100;

function orderByMetric(nodes: OutcomeNodeFieldsFragment[]) {
  function getLastValue(node: OutcomeNodeFieldsFragment) {
    const { metric } = node;
    if (!metric) return 0;
    const lastValue =
      metric.historicalValues[metric.historicalValues.length - 1]?.value;
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
  lastActiveNodeId: string | undefined;
  setLastActiveNodeId: (s: string) => void;
};

const OutcomeCardSet = (props: OutcomeCardSetProps) => {
  const {
    nodeMap,
    rootNode,
    parentColor,
    startYear,
    endYear,
    activeScenario,
    activeNodeId,
    lastActiveNodeId,
    setLastActiveNodeId,
  } = props;

  const [hoveredNodeId, setHoveredNodeId] = useState(undefined);
  const { scrollTo } = useScrollTo(config.molasses);
  const { cardNodes, subNodeMap } = useMemo(() => {
    const inputNodeIds = rootNode.inputNodes.map((node) => node.id);
    const cardNodes = [...nodeMap.values()]
      .filter(
        (node) =>
          inputNodeIds.indexOf(node.id) >= 0 &&
          getMetricValue(node, endYear) !== undefined
      )
      .map((node) => ({ ...node }));
    orderByMetric(cardNodes);
    setUniqueColors(cardNodes);
    const subNodeMap = new Map<string, OutcomeNodeFieldsFragment[]>(
      cardNodes.map((cn) => [
        cn.id,
        cn.inputNodes
          .map((child) => nodeMap.get(child.id)!)
          .filter((child) => !!child),
      ])
    );
    return {
      cardNodes,
      subNodeMap,
    };
  }, [nodeMap]);

  const inputNodes = rootNode.inputNodes.filter(
    (node) => !nodeMap.has(node.id)
  );
  // Hide outcome bar. TODO: make this configurable
  const showOutcomeBar = false;
  // If this is the last active scenario, scroll to view after render
  /*
  useEffect(() => {
    if (lastActiveNodeId === rootNode.id) scrollTo(document.querySelector(`#${lastActiveNodeId}`), -150);
  }, []);
  */
  const fadeIn = useSpring({
    to: { opacity: 1 },
    from: { opacity: 0 },
  });

  const handleHover = useCallback(
    (evt) => {
      setHoveredNodeId(evt);
    },
    [setHoveredNodeId]
  );

  const handleClick = useCallback(
    (segmentId) => {
      // if active node clicked, make its parent active node
      const newActiveNode =
        segmentId === activeNodeId ? rootNode.id : segmentId;
      setLastActiveNodeId(newActiveNode);
    },
    [activeNodeId, rootNode.id, setLastActiveNodeId]
  );

  const negativeNodesTotal = getOutcomeTotal(
    cardNodes.filter((node) => getMetricValue(node, endYear) < 0),
    endYear
  );
  const positiveNodesTotal = getOutcomeTotal(
    cardNodes.filter((node) => getMetricValue(node, endYear) >= 0),
    endYear
  );

  // console.log("card nodes" , cardNodes);
  return (
    <>
      <CardSet
        id={rootNode.id}
        style={fadeIn}
        $color={rootNode.color!}
        $haschildren={cardNodes.length > 0}
      >
        <ContentArea>
          <OutcomeNodeContent
            node={rootNode}
            subNodes={cardNodes}
            color={parentColor}
            startYear={startYear}
            endYear={endYear}
            activeScenario={activeScenario}
          />
        </ContentArea>
        {showOutcomeBar && (
          <>
            <OutcomeBar
              nodes={cardNodes}
              date={endYear}
              hovered={hoveredNodeId}
              onHover={handleHover}
              handleClick={handleClick}
              activeNode={activeNodeId}
              parentColor={parentColor}
            />
          </>
        )}
        {cardNodes.length > 0 && (
          <SubNodes>
            <BarHeader>Subsectors</BarHeader>
            <CardDeck>
              {cardNodes.map((node, indx) => (
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
                  total={positiveNodesTotal - negativeNodesTotal}
                  positiveTotal={positiveNodesTotal}
                  negativeTotal={negativeNodesTotal}
                />
              ))}
            </CardDeck>
          </SubNodes>
        )}
      </CardSet>
    </>
  );
};

export default OutcomeCardSet;
