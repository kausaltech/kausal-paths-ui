import { useState } from 'react';
import {
  CustomInput
} from 'reactstrap';
import { Range, getTrackBackground } from 'react-range';
import styled from 'styled-components';

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

const NumberWidget = (props) => {
  const { currentValue, min, max } = props;
  const [values, setValues] = useState([currentValue]);
  return (
    <Range
    key="Base"
    step={1}
    min={min}
    max={max}
    values={values}
    onChange={(values) => setValues( values )}
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
        X
      </Thumb>
    )}
  />
  )
};

const BoolWidget = (props) => {
  const { id, toggled } = props;
  return <CustomInput type="switch" size="lg" id={`${id}-switch`} name={id} label="Toteutetaan" checked={toggled} />
};

const ParameterWidget = (props) => {
  const { parameter, parameterType } = props;
  let widget  = null;
  switch(parameterType) {
    case 'NumberParameterType': return <NumberWidget initialValue={parameter.numberValue} min={parameter.minValue} max={parameter.maxValue} />
    break;
    case 'StringParameterType': return <div>String</div>
    break;
    case 'BoolParameterType': return <BoolWidget id={parameter.id} toggled={parameter.boolValue}/>
    break;
    default: return <div />
  }

};

export default ParameterWidget;
