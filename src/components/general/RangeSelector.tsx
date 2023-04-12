import { useState, useEffect } from 'react';
import { Range, getTrackBackground } from 'react-range';
import { ButtonToggle, Popover, PopoverBody } from 'reactstrap';
import * as Icon from 'react-bootstrap-icons';
import styled, { useTheme } from 'styled-components';
import { useTranslation } from 'next-i18next';
import Button from 'components/common/Button';

const SectionWrapper = styled.div`
  display: flex;
  min-width: 320px;
  padding: .75rem 0;
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

const RangeWrapper = styled.div`
  display: flex;
  flex: 0 1 150px;
  margin: 0 0.5rem;
`;

const YearDescription = styled.div`
  font-size: 0.75rem;
  line-height: 1;
`;

const ActiveYear = styled.div`
  font-size: 1rem;
  font-weight: 700;
  line-height: 1;
`;

const ActiveYearDisplay = styled.div`
  flex: 0 1 100px;
  margin: 0;
  padding: .25rem 0 .25rem;
  text-align: center;

  .btn {
    color: ${(props) => props.theme.graphColors.grey050};
  }
`;

type ThumbProps = {
  dragged: boolean,
  color: string,
}

const Thumb = styled.div<ThumbProps>`
  height: 28px;
  width: 28px;
  border-radius: 14px;
  background-color: ${(props) => (props.dragged ? props.color : props.color)};
  display: flex;
  justify-content: center;
  align-items: center;
`;

type RangeSelectorProps = {
  min: number,
  max: number,
  baseYear: number | null,
  handleChange: (range: number[]) => void,
  initMin: number,
  initMax: number,
};

const RangeSelector = (props: RangeSelectorProps) => {
  const { min, max, baseYear, handleChange, initMin, initMax } = props;

  const { t } = useTranslation();
  const theme = useTheme();
  const [baseYearActive, setBaseYearActive] = useState(baseYear !== null ? baseYear === initMin : false);
  const [values, setValues] = useState(baseYearActive ? [initMax] : [initMin, initMax]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const toggle = () => setPopoverOpen(!popoverOpen);

  useEffect(() => {
    handleChange([initMin, initMax]);
  }, [initMin, initMax]);

  const handleSliderChange = (changedValues: number[]) => {
    setValues(changedValues);
    const newRange = baseYearActive ? [baseYear!, changedValues[0]] : [changedValues[0], changedValues[1]];
    handleChange(newRange);
  };

  const handleBaseYear = (baseYearIsActive: boolean) => {
    if (baseYearIsActive) {
      setBaseYearActive(true);
      setValues([values[1]]);
      handleChange([baseYear!, values[1]]);
    } else {
      setBaseYearActive(false);
      setValues([min, values[0]]);
      handleChange([min, values[0]]);
    }
  };

  const isCustom =
    (baseYearActive ? initMin !== baseYear : initMin !== values[0])
    || (baseYearActive ? initMax !== values[0] : initMax !== values[1]);

  return (
    <PopoverWrapper>
      <ButtonLabel>{t('comparing-years')}</ButtonLabel>
      <Button id="Popover1" type="button" color={`${isCustom ? 'secondary' : 'light'}`}>
        {`${baseYearActive ? baseYear : values[0]} – ${baseYearActive ? values[0] : values[1]}`}
      </Button>
      <Popover
        placement="bottom"
        isOpen={popoverOpen}
        target="Popover1"
        toggle={toggle}
        trigger="legacy"
      >
        <PopoverBody>
          <SectionWrapper>
            <ActiveYearDisplay>
              <YearDescription>{t('comparison-year')}</YearDescription>
              <ActiveYear>{ baseYearActive ? baseYear : values[0] }</ActiveYear>
              { baseYear && (
              <ButtonToggle
                color="link"
                size="sm"
                outline
                active={baseYearActive}
                onClick={() => handleBaseYear(!baseYearActive)}
              >
                { baseYearActive ? (
                  <span>
                    <Icon.PenFill />
                    {` ${t('edit')}`}
                  </span>
                ) : (
                  <span>
                    <Icon.ArrowCounterclockwise />
                    {' '}
                    { baseYear }
                  </span>
                )}
              </ButtonToggle>
              )}
            </ActiveYearDisplay>
            { baseYearActive ? (
              <RangeWrapper>
                <Range
                  key="Base"
                  step={1}
                  min={min}
                  max={max}
                  values={values}
                  onChange={(values) => handleSliderChange(values)}
                  renderTrack={({ props, children }) => (
                    <div
                      onMouseDown={props.onMouseDown}
                      onTouchStart={props.onTouchStart}
                      style={{
                        ...props.style,
                        height: '36px',
                        display: 'flex',
                        width: '100%',
                      }}
                    >
                      <div
                        ref={props.ref}
                        style={{
                          height: '5px',
                          width: '100%',
                          borderRadius: '4px',
                          background: getTrackBackground({
                            values,
                            colors: [theme.brandDark, theme.graphColors.grey030],
                            min,
                            max,
                          }),
                          alignSelf: 'center',
                        }}
                      >
                        {children}
                      </div>
                    </div>
                  )}
                  renderThumb={({ props, isDragged, index }) => (
                    <Thumb
                      {...props}
                      dragged={isDragged}
                      style={{
                        ...props.style,
                      }}
                      color={theme.brandDark}
                    >
                      <Icon.CaretLeftFill color="#eee" />
                    </Thumb>
                  )}
                />
              </RangeWrapper>
            ) : (
              <RangeWrapper>
                <Range
                  key="noBase"
                  step={1}
                  min={min}
                  max={max}
                  values={values}
                  onChange={(values) => handleSliderChange(values)}
                  renderTrack={({ props, children }) => (
                    <div
                      aria-hidden="true"
                      onMouseDown={props.onMouseDown}
                      onTouchStart={props.onTouchStart}
                      style={{
                        ...props.style,
                        height: '36px',
                        display: 'flex',
                        width: '100%',
                      }}
                    >
                      <div
                        ref={props.ref}
                        style={{
                          height: '5px',
                          width: '100%',
                          borderRadius: '4px',
                          background: getTrackBackground({
                            values,
                            colors: [theme.graphColors.grey030, theme.brandDark, theme.graphColors.grey030],
                            min,
                            max,
                          }),
                          alignSelf: 'center',
                        }}
                      >
                        {children}
                      </div>
                    </div>
                  )}
                  renderThumb={({ props, isDragged, index }) => (
                    <Thumb
                      {...props}
                      dragged={isDragged}
                      style={{
                        ...props.style,
                      }}
                      color={theme.brandDark}
                    >
                      { index === 0 ? <Icon.CaretRightFill color={theme.graphColors.grey000} /> : <Icon.CaretLeftFill color={theme.graphColors.grey010} /> }
                    </Thumb>
                  )}
                />
              </RangeWrapper>
            )}
            <ActiveYearDisplay>
              <YearDescription>{t('target-year')}</YearDescription>
              <ActiveYear>{ baseYearActive ? values[0] : values[1] }</ActiveYear>
            </ActiveYearDisplay>
          </SectionWrapper>
        </PopoverBody>
      </Popover>
    </PopoverWrapper>
  );
};

export default RangeSelector;
