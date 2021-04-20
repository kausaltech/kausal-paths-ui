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
  margin: 0 .5rem;

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
    border-color: ${(props) => props.theme.graphColors.grey050};
  }
`;

const getSectorValue = (sector, date) => {
  return sector.metric.forecastValues.find((dataPoint) => dataPoint.year === date)?.value || sector.metric.historicalValues.find((dataPoint) => dataPoint.year === date)?.value;
}
const EmissionsBar = (props) => {
  const { sectors, date, hovered, onHover } = props;

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
          className={hovered === sector.id && 'hovered' }
          onMouseEnter={() => onHover(sector.id)}
          onMouseLeave={() => onHover(undefined)}
        />
      ))}
    </Bar>
  )
};

const EmissionsCardSet = (props) => {
  const { sectors, rootSector, unit, date  } = props;

  const [hoveredSector, setHoveredSector] = useState(undefined);
  const cardSectors = sectors.filter((sector) => sector.parent?.id === rootSector);

  const handleHover = (evt) => {
    setHoveredSector(evt);
  }

  return (
    <div>
      <EmissionsBar sectors={cardSectors} date={date} hovered={hoveredSector} onHover={handleHover}/>
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
              onHover={handleHover}
            />
          </CardContainer>
        ))}
      </CardDeck>
    </div>
  );
};

export default EmissionsCardSet;
