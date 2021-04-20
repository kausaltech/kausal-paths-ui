import { useState } from 'react';
import _ from 'lodash';
import styled from 'styled-components';
import EmissionsCard from './EmissionsCard';

const CardDeck = styled.div`  
  display: flex;
  overflow: scroll;
  align-items: stretch;
`;

const CardContainer = styled.div`  
  flex: 0 0 240px;
  margin: 0 .5rem .5rem 0;

  .card {
    height: 100%;
  }
`;

const Bar = styled.div`  
  margin-bottom: 1rem;
  height: 1.5rem;
  border: ${(props) => props.theme.themeColors.light} solid;
  border-width: 1px;
`;

const Segment = styled.div`  
  display: inline-block;
  border: ${(props) => props.theme.themeColors.light} solid;
  border-width: 2px;
  height: 1.5rem;

  &.hovered {
    border-color: ${(props) => props.theme.graphColors.grey070};
  }

  &.active {
    border-color: ${(props) => props.theme.themeColors.dark};
  }
`;

const getSectorValue = (sector, date) => {
  return sector.metric.forecastValues.find((dataPoint) => dataPoint.year === date)?.value || sector.metric.historicalValues.find((dataPoint) => dataPoint.year === date)?.value;
}
const EmissionsBar = (props) => {
  const { sectors, date, hovered, onHover, handleClick, activeSector } = props;

  const sectorsTotal = _.sum(sectors.map((sector) => getSectorValue(sector, date)));
  return (
    <Bar>
      { sectors.map((sector) => (
        <Segment
          key={sector.id}
          style={{
            width: `${(getSectorValue(sector,date)/sectorsTotal)*100}%`,
            backgroundColor: sector.color,
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
  const { sectors, rootSector, unit, date  } = props;

  const [hoveredSector, setHoveredSector] = useState(undefined);
  const [activeSector, setActiveSector] = useState(undefined);
  const cardSectors = sectors.filter((sector) => sector.parent?.id === rootSector);

  const handleHover = (evt) => {
    setHoveredSector(evt);
  }

  const handleClick = (evt) => {
    setActiveSector(evt);
  }

  return (
    <div>
      <EmissionsBar
        sectors={cardSectors}
        date={date}
        hovered={hoveredSector} 
        onHover={handleHover}
        handleClick={handleClick}
        activeSector={activeSector}
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
              hovered={hoveredSector === sector.id}
              active={activeSector === sector.id}
              onHover={handleHover}
              handleClick={handleClick}
            />
          </CardContainer>
        ))}
      </CardDeck>
    </div>
  );
};

export default EmissionsCardSet;
