import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'next-i18next';
import { useSpring, animated, config } from 'react-spring';
import useScrollTo from 'react-spring-scroll-to-hook';
import { getMetricValue, getOutcomeTotal } from 'common/preprocess';
import OutcomeNodeContent from 'components/general/OutcomeNodeContent';
import OutcomeCard from './OutcomeCard';
import InputNodeCards from './InputNodeCards';

const CardSet = styled(animated.div)`
  position: relative;
  padding: 0.5rem;
  margin-top: 1rem;
  background-color: ${(props) => props.theme.themeColors.white};
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  border: 2px solid ${(props) => props.color || props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const CardDeck = styled.div`
  display: flex;
  overflow: scroll;
  align-items: stretch;
`;

const CardContainer = styled.div`
  position: relative;
  flex: 0 0 175px;
  margin: 0 .25rem 0;

  &:first-child {
    margin-left: 0;
  }

  .card {
    height: 100%;
  }
`;

const ContentArea = styled.div`
  padding: .5rem;
`;

const Bar = styled.div`
  display: flex;
  margin: .5rem 0 1.5rem;
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
    height: .25rem;
    background-color: ${(props) => props.theme.graphColors.grey050};
    bottom: -.5rem;
  }

  &.active::after {
    content: '';
    position: absolute;
    width: 100%;
    height: .25rem;
    background-color: ${(props) => props.theme.graphColors.grey090};
    bottom: -.5rem;
  }
`;

const OutcomeBar = (props) => {
  const { nodes, date, hovered, onHover, handleClick, activeNode, parentColor } = props;
  const { t } = useTranslation();
  const nodesTotal = getOutcomeTotal(nodes, date);

  // Let's get the outcome type from first node and use it with translate to give bar a title
  // TODO: get title from API
  const outcomeType = nodes[0].quantity;

  return (
    <>
      <BarHeader>
        { `${t(outcomeType)} ${date}`}
      </BarHeader>
      <Bar color={parentColor}>
        { nodes.map((node) => (
          <Segment
            key={node.id}
            style={{
              width: `${(getMetricValue(node, date) / nodesTotal) * 100 || 0}%`,
              backgroundColor: node.color || parentColor,
              display: `${getMetricValue(node, date) ? '' : 'none'}`,
            }}
            className={`${hovered === node.id ? 'hovered' : ''} ${activeNode === node.id ? 'active' : ''}`}
            onMouseEnter={() => onHover(node.id)}
            onMouseLeave={() => onHover(undefined)}
            onClick={() => handleClick(node.id)}
          />
        ))}
        { nodes.length < 2 && (
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

function orderByMetric(nodes) {
  function getLastValue(node) {
    const { metric } = node;
    const lastValue = metric.historicalValues[metric.historicalValues.length - 1]?.value;
    if (lastValue == undefined)
      return 0;
    return lastValue;
  }
  nodes.sort((a, b) => {
    // First sort by the order field
    const aOrder = a.order ?? DEFAULT_NODE_ORDER;
    const bOrder = b.order ?? DEFAULT_NODE_ORDER;
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

const OutcomeCardSet = (props) => {
  const {
    nodeMap,
    rootNode,
    parentColor,
    startYear,
    endYear,
    activeNodeId,
    lastActiveNodeId,
    setLastActiveNodeId,
  } = props;

  const [hoveredNodeId, setHoveredNodeId] = useState(undefined);
  const { scrollTo } = useScrollTo(config.molasses);
  // const [activeNodeId, setActiveNodeId] = useState(undefined);
  const inputNodeIds = rootNode.inputNodes.map((node) => node.id);
  const cardNodes = [...nodeMap.values()].filter((node) => inputNodeIds.indexOf(node.id) >= 0);
  orderByMetric(cardNodes);
  const inputNodes = rootNode.inputNodes?.filter((node) => !nodeMap.has(node.id));
  // If this is the last active scenario, scroll to view after render

  useEffect(() => {
    if (lastActiveNodeId === rootNode.id) scrollTo(document.querySelector(`#${lastActiveNodeId}`), -150);
  }, []);

  const fadeIn = useSpring({
    to: { opacity: 1 },
    from: { opacity: 0 },
  });

  const handleHover = (evt) => {
    setHoveredNodeId(evt);
  };

  const handleClick = (segmentId) => {
    // if active node clicked, make its parent active node
    const newActiveNode = segmentId === activeNodeId ? rootNode.id : segmentId;
    setLastActiveNodeId(newActiveNode);
  };

  // const nodesTotal = getMetricValue(rootNode.node, endYear);
  // const nodesBase = getMetricValue(rootNode.node, startYear);
  // const emissionsChange = getMetricChange(nodesBase, nodesTotal);

  return (
    <>
      <CardSet
        id={rootNode.id}
        style={fadeIn}
        color={rootNode.color}
      >
        <ContentArea>
          <OutcomeNodeContent
            node={rootNode}
            subNodes={cardNodes}
            color={parentColor}
            startYear={startYear}
            endYear={endYear}
          />
        </ContentArea>
        { cardNodes.length > 1 && (
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
        <CardDeck>
          { cardNodes.map((node, indx) => (
            <CardContainer key={node.id}>
              <OutcomeCard
                startYear={startYear}
                endYear={endYear}
                node={node}
                subNodes={node.inputNodes.map((child) => nodeMap.get(child.id)).filter((child) => !!child)}
                state={activeNodeId === undefined ? 'closed' : 'open'}
                hovered={hoveredNodeId === node.id}
                active={activeNodeId === node.id}
                onHover={handleHover}
                handleClick={handleClick}
                color={node.color || parentColor}
              />
            </CardContainer>
          ))}
        </CardDeck>
        { inputNodes.length > 0 ? <InputNodeCards nodes={inputNodes} /> : ''}
      </CardSet>
    </>
  );
};

export default OutcomeCardSet;
