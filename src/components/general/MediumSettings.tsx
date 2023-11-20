import { useCallback, useRef, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { Row, Col, Container, Popover, PopoverBody } from 'reactstrap';
import styled from 'styled-components';
import { useTranslation } from 'next-i18next';
import { useSite } from 'context/site';
import { yearRangeVar } from 'common/cache';
import { useInstance } from 'common/instance';
import ScenarioSelector from 'components/general/ScenarioSelector';
import RangeSelector from 'components/general/RangeSelector';
import GoalSelector from 'components/general/GoalSelector';
import GoalOutcomeBar from 'components/general/GoalOutcomeBar';

const PanelContent = styled.div`
  padding: ${({ theme }) =>
    `${theme.spaces.s150} ${theme.spaces.s050} ${theme.spaces.s050}`};
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

const StyledButton = styled.button<{ ref: HTMLButtonElement }>`
  width: 100%;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  font-weight: 400;
  font-size: 0.9rem;
  padding: ${({ theme }) => theme.spaces.s050};

  &:focus {
    box-shadow: 0 0 0 0.25rem ${(props) => props.theme.inputBtnFocusColor};
  }
`;

const YearRangeSelector = (props) => {
  const { minYear, maxYear, referenceYear } = props;
  const inputReference = useRef<HTMLDivElement>(null);
  const triggerReference = useRef<HTMLButtonElement>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const toggle = () => {
    setPopoverOpen(!popoverOpen);
    // Focus on the input when the popover is opened
    setTimeout(() => {
      if (popoverOpen) {
        triggerReference?.current?.focus();
      } else {
        inputReference?.current?.focus();
      }
    }, 0);
  };

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
    <div>
      <ButtonLabel>{t('comparing-years')}</ButtonLabel>
      <StyledButton
        className="btn btn-light"
        id="rangeSelector"
        aria-expanded={popoverOpen}
        aria-haspopup="dialog"
        aria-controls="rangeSelectorPopover"
        ref={triggerReference}
      >
        {`${yearRange[0]}–${yearRange[1]}`}
      </StyledButton>
      <Popover
        placement="bottom"
        isOpen={popoverOpen}
        target="rangeSelector"
        toggle={toggle}
        trigger="click"
        aria-modal="true"
      >
        <PopoverBody>
          <div tabIndex={-1} ref={inputReference}>
            <RangeSelector
              min={minYear}
              max={maxYear}
              defaultMin={yearRange[0]}
              defaultMax={yearRange[1]}
              referenceYear={referenceYear}
              handleChange={setYearRange}
            />
          </div>
        </PopoverBody>
      </Popover>
    </div>
  );
};

function getColumnSizes(hasMultipleGoals: boolean) {
  if (hasMultipleGoals) {
    return {
      scenario: { xs: 4, md: 2 },
      yearRange: { xs: 3, md: 2 },
      goal: { xs: 5, md: 3 },
      outcome: { md: 5 },
    };
  }

  return {
    scenario: { xs: 6, md: 3 },
    yearRange: { xs: 6, md: 3 },
    goal: undefined,
    outcome: { md: 6 },
  };
}

const MediumSettings = (props) => {
  if (!process.browser) {
    return null;
  }
  const site = useSite();
  const instance = useInstance();

  // Target
  const nrGoals = instance.goals.length;
  const hasMultipleGoals = nrGoals > 1;
  const columnSizes = getColumnSizes(hasMultipleGoals);

  return (
    <Container fluid="xl">
      <PanelContent>
        <StyledRow>
          <StyledDropdownCol {...columnSizes.scenario}>
            <ScenarioSelector />
          </StyledDropdownCol>
          <StyledDropdownCol {...columnSizes.yearRange}>
            <YearRangeSelector
              minYear={site.minYear}
              maxYear={site.maxYear}
              referenceYear={instance.referenceYear ?? site.referenceYear}
            />
          </StyledDropdownCol>
          {hasMultipleGoals && (
            <StyledDropdownCol {...columnSizes.goal}>
              <GoalSelector />
            </StyledDropdownCol>
          )}
          <StyledOutcomeCol className="text-right" {...columnSizes.outcome}>
            <GoalOutcomeBar compact />
          </StyledOutcomeCol>
        </StyledRow>
      </PanelContent>
    </Container>
  );
};

export default MediumSettings;
