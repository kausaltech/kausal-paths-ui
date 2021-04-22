import { useState } from 'react';
import _ from 'lodash';
import styled from 'styled-components';
import { Button, ButtonGroup } from 'reactstrap';
import EmissionsCard from './EmissionsCard';
import EmissionSectorContent from 'components/general/EmissionSectorContent';

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

  &:first-child {
    margin-left: 0;
  }

  .card {
    height: 100%;
  }
`;

const ContentArea = styled.div`
  padding: .5rem;
  background-color: ${(props) => props.theme.themeColors.white};
`;

const Bar = styled.div`
  padding: .5rem .5rem 3.5rem;
  background-color: ${(props) => props.theme.themeColors.white};
  border-radius: 0 0 12px 12px;
  margin-bottom: 2rem;
  height: 2rem;
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
    <Bar color={parentColor}>
      { sectors.map((sector) => (
        <Segment
          key={sector.id}
          style={{
            width: `${(getSectorValue(sector,date)/sectorsTotal)*100 || 0}%`,
            backgroundColor: sector.color || parentColor,
            display: `${getSectorValue(sector,date) ? '' : 'none'}`,
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
  const [openTabId, setOpenTabId] = useState(undefined);
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
      <ContentArea>
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
