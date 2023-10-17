import { useCallback, useRef, useState, useEffect } from 'react';
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
  padding: ${({ theme }) =>
    `${theme.spaces.s150} ${theme.spaces.s050} ${theme.spaces.s050}`};
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

const YearRangeSelector = (props) => {
  const { minYear, maxYear, referenceYear } = props;
  const inputReference = useRef(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const toggle = () => setPopoverOpen(!popoverOpen);

  // Focus on this when visible
  useEffect(() => {
    inputReference?.current?.focus();
  }, []);
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

  return (
    <PopoverWrapper>
      <ButtonLabel>{t('comparing-years')}</ButtonLabel>
      <Button
        id="rangeSelector"
        type="button"
        color="light"
        aria-expanded={popoverOpen}
        aria-haspopup="dialog"
      >
        {`${yearRange[0]} – ${yearRange[1]}`}
      </Button>
      <Popover
        placement="bottom"
        isOpen={popoverOpen}
        target="rangeSelector"
        toggle={toggle}
        trigger="legacy"
        role="dialog"
        aria-modal="true"
      >
        <PopoverBody role="dialog">
          <RangeSelector
            min={minYear}
            max={maxYear}
            defaultMin={yearRange[0]}
            defaultMax={yearRange[1]}
            referenceYear={referenceYear}
            handleChange={setYearRange}
            ref={inputReference}
          />
        </PopoverBody>
      </Popover>
    </PopoverWrapper>
  );
};

const MediumSettings = (props) => {
  if (!process.browser) {
    return null;
  }
  const site = useSite();
  const instance = useInstance();

  // Target
  const nrGoals = instance.goals.length;
  const hasMultipleGoals = nrGoals > 1;
  const dropdownColProps = hasMultipleGoals
    ? { xs: 4, md: 2 }
    : { xs: 6, md: 3 };

  return (
    <Container fluid="lg">
      <PanelContent>
        <StyledRow>
          <StyledDropdownCol {...dropdownColProps}>
            <ScenarioSelector />
          </StyledDropdownCol>
          <StyledDropdownCol {...dropdownColProps}>
            <YearRangeSelector
              minYear={site.minYear}
              maxYear={site.maxYear}
              referenceYear={instance.referenceYear ?? site.referenceYear}
            />
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
