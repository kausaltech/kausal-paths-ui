import { useState, useEffect } from 'react';
import _ from 'lodash';
import { Range } from 'react-range';
import styled from 'styled-components';

const SectionWrapper = styled.div`
  display: flex;
  margin-bottom: 2rem;
`;

const ForecastNotice = styled.h4`
  margin: 0 1rem;
  line-height: 1.5;
  flex: 3 1 100px;
  text-align: right;
  color: ${(props) => props.theme.graphColors.grey050 };
`;

const RangeWrapper = styled.div`
  display: flex;
  flex: 1 1 480px;
`;

const ActiveYearDisplay = styled.h2`
  flex: 3 1 100px;
  margin: 0 0 0 1rem;
  text-align: left;
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
        <div
          {...props}
          style={{
            ...props.style,
            height: '42px',
            width: '42px',
            borderRadius: '4px',
            backgroundColor: '#074A35',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0px 2px 6px #AAA'
          }}
        >
          <div
            style={{
              height: '16px',
              width: '5px',
              backgroundColor: isDragged ? '#56C38E' : '#CCC'
            }}
          />
        </div>
      )}
    />
    <ActiveYearDisplay>{ selectedValue[0] }</ActiveYearDisplay>
    </RangeWrapper>
    <ForecastNotice>{ _.indexOf(forecastYears, selectedValue[0]) > -1 && '(forecast)' }</ForecastNotice>
    </SectionWrapper>
  );
};

export default RangeSelector;
