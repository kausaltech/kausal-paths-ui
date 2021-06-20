import { useState } from 'react';
import { Range, getTrackBackground } from 'react-range';
import { ButtonToggle, Button, Popover, PopoverBody } from 'reactstrap';
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';

const SectionWrapper = styled.div`
  display: flex;
  min-width: 320px;
  padding: .5rem 0 0 0;
`;

const PopoverWrapper = styled.div`
  .btn{
    white-space: nowrap;
  }
`;

const RangeWrapper = styled.div`
  display: flex;
  flex: 0 1 150px;
`;

const YearDescription = styled.div`
  font-size: 0.75rem;
`;

const ActiveYear = styled.div`
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
`;

const ActiveYearDisplay = styled.div`
  flex: 0 1 125px;
  margin: 0;
  padding: .25rem 0 .25rem;
  text-align: center;

  .btn {
    color: ${(props) => props.theme.graphColors.grey050};
  }
`;

const Thumb = styled.div`
  height: 28px;
  width: 28px;
  border-radius: 14px;
  background-color: ${(props) => (props.dragged ? props.color : props.color)};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RangeSelector = (props) => {
  const { min, max, baseYear, handleChange, initMin, initMax } = props;
  const { t } = useTranslation();
  const [useBase, setUseBase] = useState(baseYear === initMin);
  const [values, setValues] = useState(useBase ? [initMax] : [initMin, initMax]);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const toggle = () => setPopoverOpen(!popoverOpen);

  const handleSliderChange = (changedValues) => {
    setValues(changedValues);
    const newRange = useBase ? [baseYear, changedValues[0]] : [changedValues[0], changedValues[1]];
    handleChange(newRange);
  };

  const handleBaseYear = (usesBaseYear) => {
    if (usesBaseYear) {
      setValues([values[1]]);
      setUseBase(true);
    } else {
      // const currentValue=values[];
      setValues([min, values[0]]);
      setUseBase(false);
    }
  };

  return (
    <PopoverWrapper>
      <Button id="Popover1" type="button" color="light">
        {`${t('comparing-years')}: ${useBase ? baseYear : values[0]} - ${useBase ? values[0] : values[1]}`}
      </Button>
      <Popover placement="bottom" isOpen={popoverOpen} target="Popover1" toggle={toggle}>
        <PopoverBody>
          <SectionWrapper>
            <ActiveYearDisplay>
              <YearDescription>{t('comparison-year')}</YearDescription>
              <ActiveYear>{ useBase ? baseYear : values[0] }</ActiveYear>
              <ButtonToggle
                color="link"
                size="sm"
                outline
                active={useBase}
                onClick={() => handleBaseYear(!useBase)}
              >
                { useBase ? (
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
            </ActiveYearDisplay>
            { useBase ? (
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
                            colors: ['#107251', '#B5B1A9'],
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
                      color="#107251"
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
                            colors: ['#B5B1A9', '#107251', '#B5B1A9'],
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
                      color={index == 0 ? '#107251' : '#107251'}
                    >
                      { index === 0 ? <Icon.CaretRightFill color="#eee" /> : <Icon.CaretLeftFill color="#eee" /> }
                    </Thumb>
                  )}
                />
              </RangeWrapper>
            )}
            <ActiveYearDisplay>
              <YearDescription>{t('target-year')}</YearDescription>
              <ActiveYear>{ useBase ? values[0] : values[1] }</ActiveYear>
            </ActiveYearDisplay>
          </SectionWrapper>
        </PopoverBody>
      </Popover>
    </PopoverWrapper>
  );
};

export default RangeSelector;
