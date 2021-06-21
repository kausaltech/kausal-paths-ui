import { useRef, useContext } from 'react';
import _ from 'lodash';
import Link from 'next/link';
import { Container } from 'reactstrap';
import { useTranslation } from 'react-i18next';
import styled, { ThemeContext } from 'styled-components';
import { ArcherContainer, ArcherElement } from 'react-archer';
import { summarizeYearlyValuesBetween, beautifyValue, getImpactMetricValue } from 'common/preprocess';
import NodePlot from 'components/general/NodePlot';
import CausalCard from 'components/general/CausalCard';
import HighlightValue from 'components/general/HighlightValue';

const ActionPoint = styled.div`
  height: 1rem;
  margin-bottom: 3rem;
`;

const GridRow = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  overflow: scroll;
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
  border-radius: 1rem;
  background-color: ${(props) => props.theme.graphColors.grey000};
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
  border-radius: 10px;

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
  const { nodes, yearRange } = props;
  const { t } = useTranslation();
  const theme = useContext(ThemeContext);
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
      _.remove(gridRow, (item) => rowIds.find((rowId) => rowId === item.id));
    });

    if (rowIds.length > 0) {
      grid.unshift(inputs);
      findOutputs(rowIds, grid);
    }

    return grid;
  };

  // Build the grid from bbottom up
  const lastNode = nodes.find((node) => node.outputNodes.length === 0);

  const causalGridNodes = findOutputs([lastNode.id], []);

  const impactAtTargetYear = getImpactMetricValue(lastNode, yearRange[1]);
  // TODO: use isACtivity when available, for now cumulate impact on emissions
  const cumulativeImpact = lastNode.quantity === 'emissions'
    ? summarizeYearlyValuesBetween(lastNode.impactMetric, yearRange[0], yearRange[1]) : undefined;

  return (
    <ArcherContainer
      strokeColor={theme.graphColors.grey060}
      strokeWidth={6}
      endShape={{ arrow: { arrowLength: 3, arrowThickness: 4 } }}
      ref={gridCanvas}
    >
      <Container fluid>
        <ArcherElement
          relations={causalGridNodes[0].map((node) => (
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
          <GridRow onScroll={() => gridCanvas.current.refreshScreen()} key={rowIndex}>
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
                    />
                  </div>
                </ArcherElement>
              </GridCol>
            ))}
          </GridRow>
        ))}
      </Container>
      <GoalSection>
        <Container>
          <PageHeader>
            <ArcherElement
              id={lastNode.id}
            >
              <div>
                <GoalCard>
                  <h2>
                    <Link href={`/node/${lastNode.id}`}>
                      <a>
                        {lastNode.name}
                      </a>
                    </Link>
                  </h2>
                  <ActionDescription dangerouslySetInnerHTML={{ __html: lastNode.description }} />
                  <ImpactFigures>
                    { cumulativeImpact !== undefined && (
                      <HighlightValue
                        className="figure-left"
                        displayValue={beautifyValue(cumulativeImpact)}
                        header={`${t('total-impact')} ${yearRange[0]} - ${yearRange[1]}`}
                        unit={lastNode.unit?.htmlShort}
                      />
                    )}
                    <HighlightValue
                      className="figure-right"
                      displayValue={beautifyValue(impactAtTargetYear)}
                      header={`${t('impact-on-year')} ${yearRange[1]}`}
                      unit={lastNode.unit?.htmlShort}
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
