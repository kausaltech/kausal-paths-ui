import { useState } from 'react';
import _ from 'lodash';
import styled from 'styled-components';
import { getMetricValue, getSectorsTotal, getMetricChange } from 'common/preprocess';
import EmissionSectorContent from 'components/general/EmissionSectorContent';
import EmissionsCard from './EmissionsCard';

const CardSet = styled.div` 
  padding: 0.5rem;
  margin-top: 1rem;
  background-color: ${(props) => props.theme.themeColors.white};
  border-radius: 12px;
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const CardDeck = styled.div`  
  display: flex;
  overflow: scroll;
  align-items: stretch;
`;

const CardContainer = styled.div`  
  flex: 0 0 175px;
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

const BarHeader = styled.h5`
  font-size: 1rem;
  color: ${(props) => props.theme.graphColors.grey060};
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
    <>
      <BarHeader>
        Jakauma
        {' '}
        {date}
      </BarHeader>
      <Bar color={parentColor}>
        { sectors.map((sector) => (
          <Segment
            key={sector.id}
            style={{
              width: `${(getMetricValue(sector, date) / sectorsTotal) * 100 || 0}%`,
              backgroundColor: sector.color || parentColor,
              display: `${getMetricValue(sector, date) ? '' : 'none'}`,
            }}
            className={`${hovered === sector.id ? 'hovered' : ''} ${activeSector === sector.id ? 'active' : ''}`}
            onMouseEnter={() => onHover(sector.id)}
            onMouseLeave={() => onHover(undefined)}
            onClick={() => handleClick(activeSector === sector.id ? undefined : sector.id)}
          />
        ))}
        { sectors.length < 2 && (
        <Segment
          style={{
            width: '100%',
            backgroundColor: parentColor,
          }}
        />
        )}
      </Bar>
    </>
  );
};

const EmissionsCardSet = (props) => {
  const { sectors, rootSector, unit, parentColor, startYear, endYear } = props;

  const [hoveredSectorId, setHoveredSectorId] = useState(undefined);
  const [activeSectorId, setActiveSectorId] = useState(undefined);
  const cardSectors = sectors.filter((sector) => sector.parent?.id === rootSector?.id);

  const handleHover = (evt) => {
    setHoveredSectorId(evt);
  };

  const handleClick = (evt) => {
    setActiveSectorId(evt);
  };

  if (!rootSector) return null;

  const activeSectorColor = cardSectors.find((sector) => sector.id === activeSectorId)?.color || parentColor;

  const sectorsTotal = getMetricValue(rootSector, endYear);
  const sectorsBase = getMetricValue(rootSector, startYear);
  const emissionsChange = getMetricChange(sectorsBase, sectorsTotal);

  return (
    <>
      <CardSet>
        <ContentArea>
          <EmissionSectorContent
            sector={rootSector}
            subSectors={cardSectors}
            color={parentColor}
            startYear={startYear}
            endYear={endYear}
            unit={unit}
          />
        </ContentArea>
        { cardSectors.length > 1 && (
        <EmissionsBar
          sectors={cardSectors}
          date={endYear}
          hovered={hoveredSectorId}
          onHover={handleHover}
          handleClick={handleClick}
          activeSector={activeSectorId}
          parentColor={parentColor}
        />
        )}
        <CardDeck>
          { cardSectors.map((sector, indx) => (
            <CardContainer key={sector.id}>
              <EmissionsCard
                startYear={startYear}
                endYear={endYear}
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
        startYear={startYear}
        endYear={endYear}
        parentColor={activeSectorColor}
      />
      )}
    </>
  );
};

export default EmissionsCardSet;
