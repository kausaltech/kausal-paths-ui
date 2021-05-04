import { useState } from 'react';
import _ from 'lodash';
import { Range } from 'react-range';
import styled from 'styled-components';

const SectionWrapper = styled.div`
display: flex;
  margin-bottom: 2rem;
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

const ActiveYearDisplay = styled.h2`
  flex: 0 1 125px;
  margin: 0 1rem 0 0;
  text-align: center;
`;

const Thumb = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 16px;
  background-color: ${(props) => props.dragged ? props.theme.graphColors.green090 : props.theme.graphColors.green070};
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 2px 6px #AAA;
`;

const RangeSelector = (props) => {
  const { historicalYears, forecastYears, handleChange } = props;

  const allYears = _.union(historicalYears, forecastYears);
  const [selectedValue, setSelectedValue] = useState([_.max(allYears)]);

  const findClosest = (goal, options) => options.reduce((prev, curr) =>
       Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
    );

  const handleSliderChange = (changedValues) => {
    const fixedValue = findClosest(changedValues[0], allYears);
    setSelectedValue([fixedValue]);
    handleChange(fixedValue);
  }

  return (
    <SectionWrapper>
      <ActiveYearDisplay>
        { selectedValue[0] }
        <ForecastNotice>{ _.indexOf(forecastYears, selectedValue[0]) > -1 && '(forecast)' }</ForecastNotice>
      </ActiveYearDisplay>
      <RangeWrapper>
        <Range
          step={1}
          min={_.min(allYears)}
          max={_.max(allYears)}
          values={selectedValue}
          onFinalChange={(values) => handleSliderChange( values )}
          onChange={(values)=>setSelectedValue(values)}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: '6px',
                margin: '1rem 1.5rem', 
                width: '100%',
                borderRadius: '3px',
                backgroundColor: '#999'
              }}
            >
              {children}
            </div>
          )}
          renderThumb={({ props, isDragged }) => (
            <Thumb
              {...props}
              dragged={isDragged}
              style={{
                ...props.style,
              }}
            />
          )}
        />
      </RangeWrapper>
    </SectionWrapper>
  );
};

export default RangeSelector;
