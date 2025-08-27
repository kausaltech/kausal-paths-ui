import { useEffect, useRef, useState } from 'react';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { CircularProgress } from '@mui/material';
import { remove } from 'lodash';
import { ArcherContainer, type ArcherContainerRef, ArcherElement } from 'react-archer';
import { Alert, Container } from 'reactstrap';

import type { GetActionContentQuery } from '@/common/__generated__/graphql';
import { useTranslation } from '@/common/i18n';
import { useInstance } from '@/common/instance';
import { NodeLink } from '@/common/links';
import { getImpactMetricValue, summarizeYearlyValuesBetween } from '@/common/preprocess';
import Icon from '@/components/common/icon';
import CausalCard from '@/components/general/CausalCard';
import ImpactDisplay from '@/components/general/ImpactDisplay';
import NodePlot from '@/components/general/NodePlot';

import CausalGridOutcomeCard from './CausalGridOutcomeCard';

const EXPAND_GRID_ID = 'expand-grid-button';
const SELECTED_OUTCOME_CARD_ID = 'selected-outcome-card';

const StyledShowCalculationButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 3rem;
  border-radius: 1.5rem;
  border: none;
  margin: -1rem auto 0;
  padding: 0.5rem 0.75rem 0.5rem 0.5rem;
  background-color: ${(props) => props.theme.graphColors.grey005};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
  gap: 1rem;
`;

const GridSection = styled.div`
  width: 100%;
  overflow-x: hidden;
`;

const GridRowWrapper = styled.div`
  width: auto;
  margin: 6rem 0;
  overflow-x: auto;
  overscroll-behavior-x: none;
  scroll-snap-type: x mandatory;
  scroll-padding: 50%;
  text-align: center;
`;

const GridRow = styled.div`
  width: fit-content;
  position: relative;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  white-space: nowrap;

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
  flex: 1 1 320px;
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
  margin: -8rem 0 0;
  padding: ${({ theme }) => theme.spaces.s100};
  border-radius: 0;
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);

  h2 {
    margin-bottom: 2rem;
    font-size: 1.5rem;
    color: ${(props) => props.theme.themeColors.dark};
  }
`;

const ActionDescription = styled.div`
  max-width: ${({ theme }) => theme.breakpoints.values.sm}px;
  a {
    text-decoration: underline;
    &:hover {
      text-decoration: none;
    }
  }
`;

const NodePlotCard = styled.div`
  padding: 1rem;
  background-color: ${({ theme }) => theme.cardBackground.secondary};

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

const StyledOutcomeCardSelectorContainer = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  overflow-y: visible; // To avoid clipping shadows

  // Allow cards to horizontally scroll out of the parent container if necessary
  // otherwise, cards will by cut off by the container but the arrow will still be visible
  margin-left: -200px;
  margin-right: 200px;
  width: calc(400px + 100%);
  padding: 0 200px;

  // Prevent clipping of card shadows
  margin-bottom: -20px;
  padding-bottom: 20px;
`;

const StyledImpactsContainer = styled(Container)`
  margin-bottom: ${({ theme }) => theme.spaces.s300};
`;

const StyledOutcomeCardContainer = styled.div`
  background-color: ${({ theme }) => theme.cardBackground.primary};
  padding: ${({ theme }) => theme.spaces.s200};
`;

export type CausalGridNode = NonNullable<GetActionContentQuery['action']>['downstreamNodes'][0];

type CausalGridProps = {
  nodes: CausalGridNode[];
  yearRange: [number, number];
  actionIsOff: boolean;
  action: NonNullable<GetActionContentQuery['action']>;
  lastNode: CausalGridNode;
  nodeOutcomeCards?: { id: string; title: string }[];
  selectedOutcomeNode?: string;
  onClickOutcomeNodeCard: (id: string) => void;
  onClickExpandGrid: () => void;
  expandedGridLoading?: boolean;
};

const CausalGrid = ({
  nodes,
  yearRange,
  actionIsOff,
  action,
  lastNode,
  nodeOutcomeCards,
  selectedOutcomeNode,
  onClickOutcomeNodeCard,
  onClickExpandGrid,
  expandedGridLoading = false,
}: CausalGridProps) => {
  const theme = useTheme();
  const instance = useInstance();
  const gridCanvas = useRef<ArcherContainerRef>(null);

  const [gridExpanded, setGridExpanded] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    if (gridCanvas.current) {
      gridCanvas.current.refreshScreen();
    }

    // Close the grid when the selected outcome is changed
    setGridExpanded(false);
  }, [selectedOutcomeNode]);

  if (nodes.length === 0) {
    return (
      <Container fluid="lg" className="pt-5">
        <Alert color="warning">Action has no nodes</Alert>
      </Container>
    );
  }

  const visibleNodes = gridExpanded ? nodes : [lastNode];

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
    const inputs = Array.from(new Set(parentIds.flatMap((id) => parentMap.get(id) || []))).filter(
      (node) => node.id !== action.id
    );
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
      ? summarizeYearlyValuesBetween(lastNode.impactMetric, yearRange[0], yearRange[1])
      : undefined;

  // find nodes that the action affects directly
  const actionOutputNodes = filteredNodes.filter(
    (node) =>
      parentMap.get(node.id) &&
      parentMap.get(node.id)!.find((inputNode) => inputNode.id === action.id)
  );

  // We use this to filter out outputnodes that are not visible when drawing the arrows
  const visibleNodesIds = causalGridNodes.flat().map((node) => node.id);

  function handleToggleCalculationVisible() {
    const nextGridOpen = !gridExpanded;

    setGridExpanded(nextGridOpen);

    if (nextGridOpen) {
      onClickExpandGrid();
    }
  }

  return (
    <ArcherContainer
      key={`${selectedOutcomeNode}-${gridExpanded ? 'open' : 'closed'}`}
      strokeColor={theme?.graphColors.grey060}
      strokeWidth={6}
      endShape={{ arrow: { arrowLength: 3, arrowThickness: 4 } }}
      ref={gridCanvas}
    >
      <GridSection>
        {!!nodeOutcomeCards && nodeOutcomeCards.length > 1 && (
          <StyledImpactsContainer fluid="lg">
            <StyledOutcomeCardContainer>
              <hr />
              <h5>{t('outcomes')}</h5>
              <StyledOutcomeCardSelectorContainer
                onScroll={() => gridCanvas.current?.refreshScreen()}
              >
                {nodeOutcomeCards.map((card) =>
                  selectedOutcomeNode === card.id ? (
                    <ArcherElement
                      key={card.id}
                      id={SELECTED_OUTCOME_CARD_ID}
                      relations={[
                        {
                          targetId: EXPAND_GRID_ID,
                          targetAnchor: 'top',
                          sourceAnchor: 'bottom',
                          style: {
                            endMarker: false,
                          },
                        },
                      ]}
                    >
                      <CausalGridOutcomeCard
                        title={card.title}
                        onClick={() => onClickOutcomeNodeCard(card.id)}
                        selected
                      />
                    </ArcherElement>
                  ) : (
                    <CausalGridOutcomeCard
                      key={card.id}
                      title={card.title}
                      onClick={() => onClickOutcomeNodeCard(card.id)}
                    />
                  )
                )}
              </StyledOutcomeCardSelectorContainer>
            </StyledOutcomeCardContainer>
          </StyledImpactsContainer>
        )}

        <ArcherElement
          id={EXPAND_GRID_ID}
          relations={
            actionOutputNodes.length > 0
              ? actionOutputNodes.map((node) => ({
                  targetId: node.id,
                  targetAnchor: 'top',
                  sourceAnchor: 'bottom',
                }))
              : [
                  {
                    targetId: lastNode.id,
                    targetAnchor: 'top',
                    sourceAnchor: 'bottom',
                  },
                ]
          }
        >
          <StyledShowCalculationButton
            onClick={handleToggleCalculationVisible}
            aria-expanded={gridExpanded}
            aria-controls="causal-grid"
            disabled={expandedGridLoading}
          >
            {!expandedGridLoading && gridExpanded ? (
              <>
                <Icon name="dash-circle" height="1.5rem" width="1.5rem" />
                {t('hide-calculation')}
              </>
            ) : (
              <>
                {expandedGridLoading ? (
                  <CircularProgress size="1.5rem" />
                ) : (
                  <Icon name="plus-circle" height="1.5rem" width="1.5rem" />
                )}
                {t('show-calculation')}
              </>
            )}
          </StyledShowCalculationButton>
        </ArcherElement>
        <div id="causal-grid" aria-hidden={!gridExpanded}>
          {causalGridNodes?.map((row, rowIndex) => (
            <GridRowWrapper onScroll={() => gridCanvas.current?.refreshScreen()} key={rowIndex}>
              <GridRow>
                {row.map((col) => (
                  <GridCol key={col.id}>
                    <ArcherElement
                      id={col.id}
                      relations={col.outputNodes
                        .filter((outnode) => [lastNode.id, ...visibleNodesIds].includes(outnode.id))
                        .map((node) => ({
                          targetId: node.id,
                          targetAnchor: 'top',
                          sourceAnchor: 'bottom',
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
        </div>
      </GridSection>
      <GoalSection>
        <Container fluid="lg">
          <ArcherElement id={lastNode.id}>
            <div>
              <GoalCard>
                <h2>{lastNode.name}</h2>
                {lastNode.shortDescription && (
                  <ActionDescription
                    dangerouslySetInnerHTML={{
                      __html: lastNode.shortDescription,
                    }}
                  />
                )}
                <NodeLink node={lastNode}>
                  <a>
                    {t('details')} <Icon name="arrow-right" />
                  </a>
                </NodeLink>
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
              </GoalCard>
            </div>
          </ArcherElement>
        </Container>
        <Container fluid="lg">
          {lastNode.metric && (
            <NodePlotCard>
              <NodePlot
                metric={lastNode.metric}
                impactMetric={lastNode.impactMetric}
                startYear={yearRange[0]}
                endYear={yearRange[1]}
                color={lastNode.color}
                isAction={lastNode.__typename === 'ActionNode'}
                targetYear={instance.targetYear ?? undefined}
                targetYearGoal={lastNode.targetYearGoal ?? undefined}
                quantity={lastNode.quantity ?? undefined}
              />
            </NodePlotCard>
          )}
        </Container>
      </GoalSection>
    </ArcherContainer>
  );
};

export default CausalGrid;
