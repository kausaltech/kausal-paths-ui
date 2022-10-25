import { useRef, useContext } from 'react';
import { remove } from 'lodash';
import { Container } from 'reactstrap';
import styled, { ThemeContext } from 'styled-components';
import { ArcherContainer, ArcherElement } from 'react-archer';
import { summarizeYearlyValuesBetween, getImpactMetricValue } from 'common/preprocess';
import NodePlot from 'components/general/NodePlot';
import CausalCard from 'components/general/CausalCard';
import ImpactDisplay from 'components/general/ImpactDisplay';
import { useInstance } from 'common/instance';
import { useSite } from 'context/site';
import { NodeLink } from 'common/links';

const ActionPoint = styled.div`
  height: 1rem;
  margin-bottom: 3rem;
`;

const GridSesction = styled.div`
  width: 100%;
`;

const GridRowWrapper = styled.div`
  width: auto;
  overflow-y: hidden;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1rem;
`;

const GridRow = styled.div`
  display: flex;
  width: 100%;
`;

const GridCol = styled.div`
  flex: 0 1 640px;
  margin: 3rem .5rem;
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
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
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
  margin: .5rem 0;
  background-color: ${(props) => props.theme.graphColors.grey005};
  border-radius:  ${(props) => props.theme.cardBorderRadius};

  .x2sstick text, .xtick text {
    text-anchor: end !important;
  }
`;

const ImpactFigures = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;

  .figure-left, .figure-right {
    flex: 1 1 50%;
  }

  .figure-left {
    text-align: left;
  }
`;

const CausalGrid = (props) => {
  const { nodes, yearRange, actionIsOff, actionId } = props;
  const theme = useContext(ThemeContext);
  const site = useSite();
  const gridCanvas = useRef(null);

  const findOutputs = (parentIds, tree) => {
    const grid = tree?.length ? tree : [];
    // return all nodes that input to given node ids
    const inputs = nodes.filter(
      (node) => node.outputNodes.find(
        (input) => parentIds.find(
          (parentId) => parentId === input.id,
        ),
      ),
    );
    // create grid row of ids
    const rowIds = inputs.map(
      (outputNode) => outputNode.id,
    );
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
  const lastNode = nodes.find((node) => node.outputNodes.length === 0);
  const causalGridNodes = findOutputs([lastNode.id], []);

  const impactAtTargetYear = getImpactMetricValue(lastNode, yearRange[1]);
  // TODO: use isACtivity when available, for now cumulate impact on emissions
  const cumulativeImpact = lastNode.quantity === 'emissions'
    ? summarizeYearlyValuesBetween(lastNode.impactMetric, yearRange[0], yearRange[1]) : undefined;

  // find nodes that the action affects directly
  const actionOutputNodes = nodes.filter((node) => node.inputNodes.find((inputNode) => inputNode.id === actionId));

  return (
    <ArcherContainer
      strokeColor={theme.graphColors.grey060}
      strokeWidth={6}
      endShape={{ arrow: { arrowLength: 3, arrowThickness: 4 } }}
      ref={gridCanvas}
    >
      <GridSesction>
        <ArcherElement
          relations={actionOutputNodes.map((node) => (
            { targetId: node.id,
              targetAnchor: 'top',
              sourceAnchor: 'bottom',
              style: {
                style: { strokeDasharray: '5,5' },
              },
            }
          ))}
        >
          <ActionPoint />
        </ArcherElement>
        {causalGridNodes?.map((row, rowIndex) => (

          <GridRowWrapper onScroll={() => gridCanvas.current.refreshScreen()} key={rowIndex}>
            <GridRow>
              {row.map((col, colindex) => (
                <GridCol key={col.id}>
                  <ArcherElement
                    id={col.id}
                    relations={col.outputNodes.map((node) => (
                      { targetId: node.id,
                        targetAnchor: 'top',
                        sourceAnchor: 'bottom',
                        style: {
                          style: { strokeDasharray: '5,5' },
                        },
                      }
                    ))}
                  >
                    <div>
                      <CausalCard
                        node={col}
                        index={colindex + 1}
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
      </GridSesction>
      <GoalSection>
        <Container>
          <PageHeader>
            <ArcherElement
              id={lastNode.id}
            >
              <div>
                <GoalCard>
                  <h2>
                    <NodeLink node={lastNode}>
                      <a>
                        {lastNode.name}
                      </a>
                    </NodeLink>
                  </h2>
                  <ActionDescription dangerouslySetInnerHTML={{ __html: lastNode.description }} />
                  <ImpactFigures>
                    <ImpactDisplay
                      effectCumulative={cumulativeImpact || undefined}
                      effectYearly={impactAtTargetYear}
                      yearRange={yearRange}
                      unitCumulative={lastNode.unit?.htmlShort}
                      unitYearly={lastNode.unit?.htmlShort}
                      muted={actionIsOff}
                    />
                  </ImpactFigures>
                  { lastNode.metric && (
                  <ContentWrapper>
                    <NodePlot
                      metric={lastNode.metric}
                      impactMetric={lastNode.impactMetric}
                      year="2021"
                      startYear={yearRange[0]}
                      endYear={yearRange[1]}
                      color={lastNode.color}
                      isAction={lastNode.isAction}
                      targetYear={site.instance.targetYear}
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
