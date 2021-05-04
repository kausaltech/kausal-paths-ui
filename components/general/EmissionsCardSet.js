import { useState } from 'react';
import _ from 'lodash';
import styled from 'styled-components';
import { getEmissionsValue, getSectorsTotal, beautifyValue } from 'common/preprocess';
import EmissionsCard from './EmissionsCard';
import EmissionSectorContent from 'components/general/EmissionSectorContent';

const CardSet = styled.div` 
  padding: 0.5rem;
  margin-top: 1rem;
  background-color: #FFF;
  border-radius: 12px;
`;

const CardDeck = styled.div`  
  display: flex;
  overflow: scroll;
  align-items: stretch;
`;

const CardContainer = styled.div`  
  flex: 0 0 200px;
  margin: 0 .25rem 0;

  &:first-child {
    margin-left: 0;
  }

  .card {
    height: 100%;
  }
`;

const CardSetHeader = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CardSetSummary = styled.div`
  text-align: right;
  line-height: 1.2;
  font-weight: 700;
`;

const TotalValue = styled.div`
  font-size: 2rem;
`;

const TotalUnit = styled.div`
  font-size: 0.75rem;
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

const EmissionsBar = (props) => {
  const { sectors, date, hovered, onHover, handleClick, activeSector, parentColor } = props;

  const sectorsTotal = getSectorsTotal(sectors, date);

  return (
    <Bar color={parentColor}>
      { sectors.map((sector) => (
        <Segment
          key={sector.id}
          style={{
            width: `${(getEmissionsValue(sector,date)/sectorsTotal)*100 || 0}%`,
            backgroundColor: sector.color || parentColor,
            display: `${getEmissionsValue(sector,date) ? '' : 'none'}`,
          }}
          className={`${hovered === sector.id ? 'hovered' : ''} ${activeSector === sector.id ? 'active' : ''}` }
          onMouseEnter={() => onHover(sector.id)}
          onMouseLeave={() => onHover(undefined)}
          onClick={() => handleClick(activeSector === sector.id ? undefined : sector.id)}
        />
      ))}
      { sectors.length < 2 && (
        <Segment
          style={{
            width: `100%`,
            backgroundColor: parentColor,
          }}
        />
      )}
    </Bar>
  )
};

const EmissionsCardSet = (props) => {
  const { sectors, rootSector, unit, date, parentColor  } = props;

  const [hoveredSectorId, setHoveredSectorId] = useState(undefined);
  const [activeSectorId, setActiveSectorId] = useState(undefined);
  const cardSectors = sectors.filter((sector) => sector.parent?.id === rootSector?.id);

  const handleHover = (evt) => {
    setHoveredSectorId(evt);
  }

  const handleClick = (evt) => {
    setActiveSectorId(evt);
  }

  const activeSectorColor = cardSectors.find((sector) => sector.id === activeSectorId)?.color || parentColor;

  const sectorsTotal = beautifyValue(getEmissionsValue(rootSector, date));
  return (
    <>
    <CardSet>
      <ContentArea>
        <CardSetHeader>
          <h5>{ rootSector.name }</h5>
          <CardSetSummary>
            <TotalValue>{ sectorsTotal }</TotalValue>
            <TotalUnit>{ unit }</TotalUnit>
          </CardSetSummary>
        </CardSetHeader>
        <EmissionSectorContent
          sector={rootSector}
          subSectors={cardSectors}
          color={parentColor}
          year={date}
        />
      </ContentArea>
      <EmissionsBar
        sectors={cardSectors}
        date={date}
        hovered={hoveredSectorId} 
        onHover={handleHover}
        handleClick={handleClick}
        activeSector={activeSectorId}
        parentColor={parentColor}
      />
      <CardDeck>
        { cardSectors.map((sector, indx) => (
          <CardContainer key={sector.id}>
            <EmissionsCard
              date={date}
              unit={unit}
              sector={sector}
              subSectors={sectors.filter((sector) => sector.parent?.id === sector.id)}
              state={activeSectorId === undefined ? 'closed' : 'open'}
              hovered={hoveredSectorId === sector.id}
              active={activeSectorId === sector.id}
              onHover={handleHover}
              handleClick={handleClick}
              color={sector.color || parentColor}
            />
          </CardContainer>
        ))}
      </CardDeck>
    </CardSet>
    { activeSectorId && (
      <EmissionsCardSet
        sectors={sectors}
        rootSector={cardSectors.find((sector) => sector.id === activeSectorId)}
        unit={unit}
        date={date}
        parentColor={activeSectorColor}
      />
    )}
    </>
  );
};

export default EmissionsCardSet;
