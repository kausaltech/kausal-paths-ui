import { useState, useContext } from 'react';
import _ from 'lodash';
import { Range, getTrackBackground } from 'react-range';
import { ButtonToggle } from "reactstrap";
import SettingsContext from 'common/settings-context';
import * as Icon from 'react-bootstrap-icons';
import styled from 'styled-components';

const SectionWrapper = styled.div`
  display: flex;
`;

const ForecastNotice = styled.div`
  font-size: ${(props) => props.theme.fontSizeSm };
  color: ${(props) => props.theme.graphColors.grey050 };
  line-height: ${(props) => props.theme.lineHeightSm };
  min-height: ${(props) => props.theme.lineHeightSm }em;
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
  text-align: center;

  .btn {
    color: ${(props) => props.theme.graphColors.grey050 };
  }
`;

const Thumb = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 16px;
  background-color: ${(props) => props.dragged ? props.color : props.color};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RangeSelector = (props) => {
  const { min, max, baseYear } = props;

  const [useBase, setUseBase] = useState(true);
  const [values, setValues] = useState(useBase ? [max] : [min, max]);
  const settings = useContext(SettingsContext);
  //console.log('allyears', allYears);
  //console.log(values)
  const findClosest = (goal, options) => options.reduce((prev, curr) =>
       Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
    );

  const handleSliderChange = (changedValues) => {
    // const fixedValue = findClosest(changedValues[1], allYears);
    setValues(changedValues);
    //console.log(values);
    const newRange = useBase ? [baseYear, changedValues[0]] : [changedValues[0], changedValues[1]];
    settings.setYearRange(newRange);
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
        <ActiveYear>{ useBase ? baseYear : values[0] }</ActiveYear>
        <ButtonToggle
          color="link"
          size="sm"
          outline
          active={useBase}
          onClick={()=>handleBaseYear(!useBase)}
        >
          { useBase ? (
              <span><Icon.PenFill /> Muokkaa</span>
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
        <ActiveYear>{ useBase ? values[0] : values[1] }</ActiveYear>
      </ActiveYearDisplay>
    </SectionWrapper>
  );
};

export default RangeSelector;
