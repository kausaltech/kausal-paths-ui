import { useState } from 'react';
import _ from 'lodash';
import { Range, getTrackBackground } from 'react-range';
import { ButtonToggle } from "reactstrap";
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';

const SectionWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom : 1.5rem;
`;

const ForecastNotice = styled.div`
  font-size: ${(props) => props.theme.fontSizeSm };
  color: ${(props) => props.theme.graphColors.grey050 };
  line-height: ${(props) => props.theme.lineHeightSm };
  min-height: ${(props) => props.theme.lineHeightSm }em;
`;

const RangeWrapper = styled.div`
  display: flex;
  flex: 0 1 360px;
`;

const YearDescription = styled.div`
  font-size: 0.75rem;
`;

const ActiveYearDisplay = styled.div`
  flex: 0 1 125px;
  margin: 0;
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
`;

const Thumb = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 16px;
  background-color: ${(props) => props.dragged ? props.color : props.color};
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 2px 6px #AAA;
`;

const RangeSelector = (props) => {
  const { historicalYears, forecastYears, handleChange, baseYear } = props;
  const allYears = _.union(historicalYears, forecastYears);
  const min = _.min(allYears);
  const max = _.max(allYears);
  const [useBase, setUseBase] = useState(true);
  const [values, setValues] = useState(useBase ? [max] : [min, max]);

  //console.log('allyears', allYears);
  //console.log(values)
  const findClosest = (goal, options) => options.reduce((prev, curr) =>
       Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
    );

  const handleSliderChange = (changedValues) => {
    // const fixedValue = findClosest(changedValues[1], allYears);
    setValues(changedValues);
    //console.log(values);
    handleChange( useBase ? [baseYear, changedValues[0]] : [changedValues[0], changedValues[1]]);
  }

  const handleBaseYear = (usesBaseYear) => {
    if(usesBaseYear) {
      setValues([values[1]]);
      setUseBase(true);
    } else {
      //const currentValue=values[];
      setValues([min, values[0]]);
      setUseBase(false);
    }
  }

  return (
    <SectionWrapper>
      <ActiveYearDisplay>
      <YearDescription>Vertailuvuosi</YearDescription>
      { useBase ? baseYear : values[0] }
      <ButtonToggle
        color="link"
        size="sm"
        outline
        active={useBase}
        onClick={()=>handleBaseYear(!useBase)}
      >
        { useBase ? (
            <span><Icon.PenFill /> Edit</span>
          ) : (
            <span><Icon.ArrowCounterclockwise /> 1990</span>
          )
        }
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
          onChange={(values) => handleSliderChange( values )}
          renderTrack={({ props, children }) => (
            <div
            onMouseDown={props.onMouseDown}
            onTouchStart={props.onTouchStart}
            style={{
              ...props.style,
              height: '36px',
              display: 'flex',
              width: '100%'
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
                  min: min,
                  max: max,
                }),
                alignSelf: 'center'
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
              color={'#107251'}
            >
              <Icon.CaretLeftFill color="#eee"/>
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
      onChange={(values) => handleSliderChange( values )}
      renderTrack={({ props, children }) => (
        <div
        onMouseDown={props.onMouseDown}
        onTouchStart={props.onTouchStart}
        style={{
          ...props.style,
          height: '36px',
          display: 'flex',
          width: '100%'
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
              min: min,
              max: max,
            }),
            alignSelf: 'center'
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
          { index === 0 ? <Icon.CaretRightFill color="#eee"/> : <Icon.CaretLeftFill color="#eee"/> }
        </Thumb>
      )}
    />
  </RangeWrapper>
)}
      <ActiveYearDisplay>
        <YearDescription>Tavoitevuosi</YearDescription>
        { useBase ? values[0] : values[1] }
        <ForecastNotice>{ _.indexOf(forecastYears, useBase ? values[0] : values[1]) > -1 && '(forecast)' }</ForecastNotice>
      </ActiveYearDisplay>
    </SectionWrapper>
  );
};

export default RangeSelector;
