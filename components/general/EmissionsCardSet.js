import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useSpring, animated, config } from 'react-spring';
import useScrollTo from 'react-spring-scroll-to-hook';
import { getMetricValue, getSectorsTotal } from 'common/preprocess';
import EmissionSectorContent from 'components/general/EmissionSectorContent';
import EmissionsCard from './EmissionsCard';

const CardSet = styled(animated.div)`
  position: relative;
  padding: 0.5rem;
  margin-top: 1rem;
  background-color: ${(props) => props.theme.themeColors.white};
  border-radius:  ${(props) => props.theme.cardBorderRadius};
  border: 2px solid ${(props) => props.color || props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33,33,33,0.15);
`;

const CardDeck = styled.div`
  display: flex;
  overflow: scroll;
  align-items: stretch;
`;

const CardContainer = styled.div`
  position: relative;
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
  const { t } = useTranslation();
  const sectorsTotal = getSectorsTotal(sectors, date);

  return (
    <>
      <BarHeader>
        { `${t('emissions')} ${date}`}
      </BarHeader>
      <Bar color={parentColor}>
        { sectors.map((sector) => (
          <Segment
            key={sector.id}
            style={{
              width: `${(getMetricValue(sector.node, date) / sectorsTotal) * 100 || 0}%`,
              backgroundColor: sector.color || parentColor,
              display: `${getMetricValue(sector.node, date) ? '' : 'none'}`,
            }}
            className={`${hovered === sector.id ? 'hovered' : ''} ${activeSector === sector.id ? 'active' : ''}`}
            onMouseEnter={() => onHover(sector.id)}
            onMouseLeave={() => onHover(undefined)}
            onClick={() => handleClick(sector.id)}
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
  const {
    sectors,
    rootSector,
    parentColor,
    startYear,
    endYear,
    activeSectorId,
    lastActiveSectorId,
    setLastActiveSectorId,
  } = props;

  const [hoveredSectorId, setHoveredSectorId] = useState(undefined);
  const { scrollTo } = useScrollTo(config.molasses);
  // const [activeSectorId, setActiveSectorId] = useState(undefined);
  const cardSectors = sectors.filter((sector) => sector.parent?.id === rootSector?.id);

  // If this is the last active scenario, scroll to view after render
  useEffect(() => {
    if (lastActiveSectorId === rootSector.id) scrollTo(document.querySelector(`#${lastActiveSectorId}`), -150);
  }, []);

  const fadeIn = useSpring({
    to: { opacity: 1 },
    from: { opacity: 0 },
  });

  const handleHover = (evt) => {
    setHoveredSectorId(evt);
  };

  const handleClick = (segmentId) => {
    // if active sector clicked, make its parent active sector
    const newActiveSector = segmentId === activeSectorId ? rootSector.id : segmentId;
    setLastActiveSectorId(newActiveSector);
  };

  // const sectorsTotal = getMetricValue(rootSector.node, endYear);
  // const sectorsBase = getMetricValue(rootSector.node, startYear);
  // const emissionsChange = getMetricChange(sectorsBase, sectorsTotal);

  return (
    <>
      <CardSet
        id={rootSector.id}
        style={fadeIn}
        color={rootSector.color}
      >
        <ContentArea>
          <EmissionSectorContent
            sector={rootSector}
            subSectors={cardSectors}
            color={parentColor}
            startYear={startYear}
            endYear={endYear}
          />
        </ContentArea>
        { cardSectors.length > 1 && (
        <>
          <EmissionsBar
            sectors={cardSectors}
            date={endYear}
            hovered={hoveredSectorId}
            onHover={handleHover}
            handleClick={handleClick}
            activeSector={activeSectorId}
            parentColor={parentColor}
          />
        </>
        )}
        <CardDeck>
          { cardSectors.map((sector, indx) => (
            <CardContainer key={sector.id}>
              <EmissionsCard
                startYear={startYear}
                endYear={endYear}
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
    </>
  );
};

export default EmissionsCardSet;
