import { useRef, useContext } from 'react';
import _ from 'lodash';
import { Container } from 'reactstrap';
import styled, { ThemeContext } from 'styled-components';
import { ArcherContainer, ArcherElement } from 'react-archer';
import CausalCard from 'components/general/CausalCard';

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

const CausalGrid = (props) => {
  const { nodes, yearRange } = props;
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

  const causalGridNodes = findOutputs([lastNode.id], [[lastNode]]);

  return (
    <Container fluid>
      <ArcherContainer
        strokeColor={theme.graphColors.grey060}
        strokeWidth={6}
        endShape={{ arrow: { arrowLength: 3, arrowThickness: 4 } }}
        ref={gridCanvas}
      >
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
      </ArcherContainer>
    </Container>
  );
};

export default CausalGrid;
