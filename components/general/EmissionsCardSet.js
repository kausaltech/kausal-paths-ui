import { useState } from 'react';
import _ from 'lodash';
import styled from 'styled-components';
import EmissionsCard from './EmissionsCard';
import DashCard from 'components/general/DashCard';

const CardSet = styled.div` 
`;

const CardDeck = styled.div`  
  display: flex;
  overflow: scroll;
  align-items: stretch;
`;

const CardContainer = styled.div`  
  flex: 0 0 200px;
  margin: 0 .25rem 0;

  .card {
    height: 100%;
  }

  .card-body {
    padding: 1rem;
  }
`;

const Bar = styled.div`
  padding: 1rem .5rem 3.5rem;
  background-color: ${(props) => props.theme.themeColors.white};
  border-radius: 0 0 12px 12px;
  margin-bottom: 1rem;
  height: 2.5rem;
  border: ${(props) => props.theme.themeColors.dark} solid;
  border-width: 0;
  border-top: 0;
  cursor: pointer;
`;

const Segment = styled.div`  
  display: inline-block;
  position: relative;
  border: ${(props) => props.theme.themeColors.white} solid;
  border-width: 2px;
  height: 2.5rem;

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

const getSectorValue = (sector, date) => {
  return sector.metric.forecastValues.find((dataPoint) => dataPoint.year === date)?.value || sector.metric.historicalValues.find((dataPoint) => dataPoint.year === date)?.value;
}
const EmissionsBar = (props) => {
  const { sectors, date, hovered, onHover, handleClick, activeSector, parentColor } = props;

  const sectorsTotal = _.sum(sectors.map((sector) => getSectorValue(sector, date)));
  return (
    <Bar>
      { sectors.map((sector) => (
        <Segment
          key={sector.id}
          style={{
            width: `${(getSectorValue(sector,date)/sectorsTotal)*100}%`,
            backgroundColor: sector.color || parentColor,
          }}
          className={`${hovered === sector.id ? 'hovered' : ''} ${activeSector === sector.id ? 'active' : ''}` }
          onMouseEnter={() => onHover(sector.id)}
          onMouseLeave={() => onHover(undefined)}
          onClick={() => handleClick(activeSector === sector.id ? undefined : sector.id)}
        />
      ))}
    </Bar>
  )
};

const EmissionsCardSet = (props) => {
  const { sectors, rootSector, unit, date, parentColor  } = props;

  const [hoveredSectorId, setHoveredSectorId] = useState(undefined);
  const [activeSectorId, setActiveSectorId] = useState(undefined);
  const cardSectors = sectors.filter((sector) => sector.parent?.id === rootSector.id);

  const handleHover = (evt) => {
    setHoveredSectorId(evt);
  }

  const handleClick = (evt) => {
    setActiveSectorId(evt);
  }

  const activeSectorColor = cardSectors.find((sector) => sector.id === activeSectorId)?.color || parentColor;

  return (
    <CardSet>
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
              state="inactive"
              hovered={hoveredSectorId === sector.id}
              active={activeSectorId === sector.id}
              onHover={handleHover}
              handleClick={handleClick}
              color={sector.color || parentColor}
            />
          </CardContainer>
        ))}
      </CardDeck>
      { activeSectorId && (
        <EmissionsCardSet
          sectors={sectors}
          rootSector={cardSectors.find((sector) => sector.id === activeSectorId)}
          unit={unit}
          date={date}
          parentColor={activeSectorColor}
        />
      )}
      
    </CardSet>
  );
};

export default EmissionsCardSet;
