import { useRef, useContext, useState } from 'react';
import { remove } from 'lodash';
import { Container, Alert } from 'reactstrap';
import Icon from 'components/common/icon';
import styled, { ThemeContext } from 'styled-components';
import { ArcherContainer, ArcherElement } from 'react-archer';
import {
  summarizeYearlyValuesBetween,
  getImpactMetricValue,
} from 'common/preprocess';
import NodePlot from 'components/general/NodePlot';
import CausalCard from 'components/general/CausalCard';
import ImpactDisplay from 'components/general/ImpactDisplay';
import { useInstance } from 'common/instance';
import { NodeLink } from 'common/links';
import { GetActionContentQuery } from 'common/__generated__/graphql';

const ActionPoint = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 3rem;
  border-radius: 1.5rem;
  border: none;
  margin: 0 auto;
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  background-color: ${(props) => props.theme.graphColors.grey005};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);

  svg {
    margin-right: 1rem;
  }
`;

const GridSection = styled.div`
  width: 100%;
`;

const GridRowWrapper = styled.div`
  width: auto;
  margin: 6rem 0;
`;

const GridRow = styled.div`
  position: relative;
  display: flex;
  /* TODO: We either alignt the elements left or lose the left items behind margin  */
  justify-content: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow-x: auto;
  overscroll-behavior-x: none;
  scroll-snap-type: x mandatory;
  scroll-padding: 50%;

  &::-webkit-scrollbar:horizontal {
    height: 0;
    width: 0;
    display: none;
  }

  &::-webkit-scrollbar-thumb:horizontal {
    display: none;
  }
`;

const GridCol = styled.div`
  flex: 0 1 480px;
  scroll-snap-align: center;
  margin: 0 0.5rem;

  &:first-child {
    margin-left: 2rem;
  }

  &:last-child {
    margin-right: 2rem;
  }
`;

const GoalSection = styled.div`
  padding: 1rem 0 8rem;
  margin-top: 10rem;
  margin-bottom: -10rem;
  background-color: ${(props) => props.theme.graphColors.grey070};
`;

const GoalCard = styled.div`
  margin: -8rem 0 3rem;
  padding: 2rem;
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

const ActionDescription = styled.div`
  margin-bottom: 2rem;
  font-size: 1.15rem;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;

  a {
    color: ${(props) => props.theme.themeColors.dark};
  }

  h2 {
    margin-bottom: 2rem;
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const ContentWrapper = styled.div`
  padding: 1rem;
  margin: 0.5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius: 0;

  .x2sstick text,
  .xtick text {
    text-anchor: end !important;
  }
`;

const ImpactFigures = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;

  .figure-left,
  .figure-right {
    flex: 1 1 50%;
  }

  .figure-left {
    text-align: left;
  }
`;

export type CausalGridNode = NonNullable<
  GetActionContentQuery['action']
>['downstreamNodes'][0];

type CausalGridProps = {
  nodes: CausalGridNode[];
  yearRange: [number, number];
  actionIsOff: boolean;
  action: NonNullable<GetActionContentQuery['action']>;
};

const CausalGrid = (props: CausalGridProps) => {
  const { nodes, yearRange, actionIsOff, action } = props;
  const theme = useContext(ThemeContext);
  const instance = useInstance();
  const gridCanvas = useRef(null);

  const [gridOpen, setGridOpen] = useState(false);

  if (nodes.length === 0) {
    return (
      <Container className="pt-5">
        <Alert color="warning">Action has no nodes</Alert>
      </Container>
    );
  }

  const lastNode = nodes.find((node) => node.outputNodes.length === 0)!;
  const visibleNodes = gridOpen ? nodes : [lastNode];

  const parentMap = new Map<string, CausalGridNode[]>();
  [action, ...visibleNodes].forEach((node) => {
    node.outputNodes.forEach((output) => {
      const old = parentMap.get(output.id) || [];
      parentMap.set(output.id, [...old, node]);
    });
  });
  const filteredNodes = visibleNodes.filter((node) => {
    // Remove some nodes from the causal pathways (for now)
    if (action.dimensionalFlow && node.quantity !== 'emissions') {
      node.outputNodes.map((output) => {
        const p = parentMap.get(output.id)!;
        p.splice(p.indexOf(node), 1);
        parentMap.set(output.id, [...p, ...(parentMap.get(node.id) || [])]);
      });
      return false;
    }
    return true;
  });

  const findOutputs = (parentIds: string[], tree: CausalGridNode[]) => {
    const grid = tree?.length ? tree : [];
    // return all nodes that input to given node ids
    const inputs = Array.from(
      new Set(parentIds.flatMap((id) => parentMap.get(id) || []))
    ).filter((node) => node.id !== action.id);
    // create grid row of ids
    const rowIds = inputs.map((outputNode) => outputNode.id);
    // remove higher duplicates from the grid
    grid.forEach((gridRow) => {
      remove(gridRow, (item) => rowIds.find((rowId) => rowId === item.id));
    });

    if (rowIds.length > 0) {
      grid.unshift(inputs);
      findOutputs(rowIds, grid);
    }

    return grid;
  };

  // Build the grid from bottom up
  const causalGridNodes = findOutputs([lastNode.id], []);
  const impactAtTargetYear = getImpactMetricValue(lastNode, yearRange[1]);
  // TODO: use isACtivity when available, for now cumulate impact on emissions
  const cumulativeImpact =
    lastNode.quantity === 'emissions'
      ? summarizeYearlyValuesBetween(
          lastNode.impactMetric,
          yearRange[0],
          yearRange[1]
        )
      : undefined;

  // find nodes that the action affects directly
  const actionOutputNodes = filteredNodes.filter(
    (node) =>
      parentMap.get(node.id) &&
      parentMap.get(node.id)!.find((inputNode) => inputNode.id === action.id)
  );

  return (
    <ArcherContainer
      strokeColor={theme.graphColors.grey060}
      strokeWidth={6}
      endShape={{ arrow: { arrowLength: 3, arrowThickness: 4 } }}
      ref={gridCanvas}
    >
      <GridSection>
        <ArcherElement
          relations={
            actionOutputNodes.length > 0
              ? actionOutputNodes.map((node) => ({
                  targetId: node.id,
                  targetAnchor: 'top',
                  sourceAnchor: 'bottom',
                  style: {
                    style: { strokeDasharray: '5,5' },
                  },
                }))
              : [
                  {
                    targetId: lastNode.id,
                    targetAnchor: 'top',
                    sourceAnchor: 'bottom',
                    style: {
                      style: { strokeDasharray: '5,5' },
                    },
                  },
                ]
          }
        >
          <ActionPoint onClick={() => setGridOpen(!gridOpen)}>
            {gridOpen ? (
              <>
                <Icon name="dash-circle" height="1.5rem" width="1.5rem" />
                Hide calculation
              </>
            ) : (
              <>
                <Icon name="plus-circle" height="1.5rem" width="1.5rem" />
                Show calculation
              </>
            )}
          </ActionPoint>
        </ArcherElement>
        {causalGridNodes?.map((row, rowIndex) => (
          <GridRowWrapper
            onScroll={() => gridCanvas.current.refreshScreen()}
            key={rowIndex}
          >
            <GridRow>
              {row.map((col, colindex) => (
                <GridCol key={col.id}>
                  <ArcherElement
                    id={col.id}
                    relations={col.outputNodes.map((node) => ({
                      targetId: node.id,
                      targetAnchor: 'top',
                      sourceAnchor: 'bottom',
                      style: {
                        style: { strokeDasharray: '5,5' },
                      },
                    }))}
                  >
                    <div>
                      <CausalCard
                        node={col}
                        compact={false}
                        startYear={yearRange[0]}
                        endYear={yearRange[1]}
                        noEffect={actionIsOff}
                      />
                    </div>
                  </ArcherElement>
                </GridCol>
              ))}
            </GridRow>
          </GridRowWrapper>
        ))}
      </GridSection>
      <GoalSection>
        <Container fluid="lg">
          <PageHeader>
            <ArcherElement id={lastNode.id}>
              <div>
                <GoalCard>
                  <h2>
                    <NodeLink node={lastNode}>
                      <a>{lastNode.name}</a>
                    </NodeLink>
                  </h2>
                  {lastNode.shortDescription && (
                    <ActionDescription
                      dangerouslySetInnerHTML={{
                        __html: lastNode.shortDescription,
                      }}
                    />
                  )}
                  <ImpactFigures>
                    <ImpactDisplay
                      effectCumulative={cumulativeImpact || undefined}
                      effectYearly={impactAtTargetYear}
                      yearRange={yearRange}
                      unitCumulative={lastNode.impactMetric?.unit?.htmlShort}
                      unitYearly={lastNode.impactMetric?.unit?.htmlShort}
                      muted={actionIsOff}
                    />
                  </ImpactFigures>
                  {lastNode.metric && (
                    <ContentWrapper>
                      <NodePlot
                        metric={lastNode.metric}
                        impactMetric={lastNode.impactMetric}
                        year="2021"
                        startYear={yearRange[0]}
                        endYear={yearRange[1]}
                        color={lastNode.color}
                        isAction={lastNode.__typename === 'ActionNode'}
                        targetYear={instance.targetYear}
                        targetYearGoal={lastNode.targetYearGoal}
                        quantity={lastNode.quantity}
                      />
                    </ContentWrapper>
                  )}
                </GoalCard>
              </div>
            </ArcherElement>
          </PageHeader>
        </Container>
      </GoalSection>
    </ArcherContainer>
  );
};

export default CausalGrid;
