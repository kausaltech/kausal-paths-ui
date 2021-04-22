import { useState, useEffect } from 'react';
import _ from 'lodash';
import { Range } from 'react-range';
import styled from 'styled-components';

const RangeWrapper = styled.div`
  display: flex;
  margin-bottom: 2rem;
  max-width: 480px;
`;

const ActiveYearDisplay = styled.h2`
  flex: 0 0 100px;
  margin: 0 1rem 0 0;
  text-align: right;
`;

const RangeSelector = (props) => {
  const { values, handleChange } = props;

  const [selectedValue, setSelectedValue] = useState([_.max(values)]);

  const findClosest = (goal, options) => options.reduce((prev, curr) =>
       Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
    );

  const handleSliderChange = (changedValues) => {
    const fixedValue = findClosest(changedValues[0], values);
    setSelectedValue([fixedValue]);
    handleChange(fixedValue);
  }

  return (
    <RangeWrapper>
              <ActiveYearDisplay>{ selectedValue[0] }</ActiveYearDisplay>
    <Range
      step={1}
      min={_.min(values)}
      max={_.max(values)}
      values={selectedValue}
      onChange={(values) => handleSliderChange( values )}
      renderTrack={({ props, children }) => (
        <div
          {...props}
          style={{
            ...props.style,
            height: '6px',
            margin: '1rem 1.5rem', 
            width: '100%',
            borderRadius: '3px',
            backgroundColor: '#666'
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
    </RangeWrapper>
  );
};

export default RangeSelector;
