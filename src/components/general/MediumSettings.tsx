import { useCallback, useContext, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { Range, getTrackBackground } from 'react-range';
import { Row, Col, Container, Popover, PopoverBody } from 'reactstrap';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'next-i18next';
import { useSite } from 'context/site';
import { yearRangeVar } from 'common/cache';
import { useInstance } from 'common/instance';
import ScenarioSelector from 'components/general/ScenarioSelector';
import Button from 'components/common/Button';
import RangeSelector from 'components/general/RangeSelector';
import GoalSelector from 'components/general/GoalSelector';
import GoalOutcomeBar from 'components/general/GoalOutcomeBar';

const PanelContent = styled.div`
  padding: 0.5rem;
`;

const PopoverWrapper = styled.div`
  .btn {
    width: 100%;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 400;
  }
`;

const ButtonLabel = styled.div`
  white-space: nowrap;
  font-size: 0.8rem;
`;

const StyledRow = styled(Row)`
  --bs-gutter-x: ${({ theme }) => theme.spaces.s100};

  @media (max-width: ${(props) => props.theme.breakpointMd}) {
    --bs-gutter-x: ${({ theme }) => theme.spaces.s050};
  }
`;

const StyledDropdownCol = styled(Col)`
  display: flex;
  justify-content: stretch;
  align-items: center;

  > div {
    width: 100%;
  }
`;

const StyledOutcomeCol = styled(Col)`
  @media (max-width: ${(props) => props.theme.breakpointMd}) {
    display: none;
  }
`;

const MediumSettings = (props) => {
  if (!process.browser) {
    return null;
  }
  const site = useSite();
  const instance = useInstance();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const toggle = () => setPopoverOpen(!popoverOpen);

  // State of display settings
  // Year range
  const yearRange = useReactiveVar(yearRangeVar);
  const setYearRange = useCallback(
    (newRange: [number, number]) => {
      yearRangeVar(newRange);
    },
    [yearRangeVar]
  );
  const { t } = useTranslation();

  // Target
  const nrGoals = instance.goals.length;
  const hasMultipleGoals = nrGoals > 1;
  const dropdownColProps = hasMultipleGoals
    ? { xs: 4, md: 2 }
    : { xs: 6, md: 3 };

  // Normalization
  const availableNormalizations = site.availableNormalizations;
  return (
    <Container fluid="lg">
      <PanelContent>
        <StyledRow>
          <StyledDropdownCol {...dropdownColProps}>
            <ScenarioSelector />
          </StyledDropdownCol>
          <StyledDropdownCol {...dropdownColProps}>
            <PopoverWrapper>
              <ButtonLabel>{t('comparing-years')}</ButtonLabel>
              <Button id="Popover1" type="button" color="light">
                {`${yearRange[0]} – ${yearRange[1]}`}
              </Button>
              <Popover
                placement="bottom"
                isOpen={popoverOpen}
                target="Popover1"
                toggle={toggle}
                trigger="legacy"
              >
                <PopoverBody>
                  <RangeSelector
                    min={site.minYear}
                    max={site.maxYear}
                    defaultMin={yearRange[0]}
                    defaultMax={yearRange[1]}
                    referenceYear={instance.referenceYear ?? site.referenceYear}
                    handleChange={setYearRange}
                  />
                </PopoverBody>
              </Popover>
            </PopoverWrapper>
          </StyledDropdownCol>
          {hasMultipleGoals && (
            <StyledDropdownCol {...dropdownColProps}>
              <GoalSelector />
            </StyledDropdownCol>
          )}
          <StyledOutcomeCol className="text-right">
            {true && <GoalOutcomeBar compact />}
          </StyledOutcomeCol>
        </StyledRow>
      </PanelContent>
    </Container>
  );
};

export default MediumSettings;
