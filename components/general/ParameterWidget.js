import { useState, useEffect } from 'react';
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  CustomInput
} from 'reactstrap';
import { Range, getTrackBackground } from 'react-range';
import styled from 'styled-components';

const RangeWrapper = styled.div`
  display: flex;
  min-width: 240px;
`;

const RangeValue = styled.div` 
  min-width: 75px;
  margin-left: 1rem;
  line-height: 2.5;
`;

const Thumb = styled.div`
  height: 24px;
  width: 24px;
  border-radius: 16px;
  background-color: ${(props) => props.dragged ? props.color : props.color};
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0px 2px 6px #AAA;
`;

const SET_PARAMETER = gql`
  mutation SetParameter($parameterId: ID!, $boolValue: Boolean, $numberValue: Float, $stringValue: String) {
    setParameter(id: $parameterId, boolValue: $boolValue, numberValue: $numberValue, stringValue: $stringValue) {
      ok
      parameter {
        isCustomized
        ... on BoolParameterType {
        boolValue: value
        boolDefaultValue: defaultValue
      }
      }
    }
  }
`;

const NumberWidget = (props) => {
  const { initialValue, min, max, isCustomized } = props;
  const [values, setValues] = useState([initialValue]);

  return (
    <RangeWrapper>
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
      />
    )}
  />
  <RangeValue>{`${100*values[0].toFixed(1)} %`}</RangeValue>
  { isCustomized && <span>*</span> }
  </RangeWrapper>
  )
};

const BoolWidget = (props) => {
  const { id, toggled, handleChange, loading, isCustomized} = props;
  return (
    <>
    <CustomInput
      type="switch"
      id={`${id}-switch`}
      name={id}
      label="Toteutetaan"
      checked={toggled}
      onChange={()=> handleChange( { parameterId: id, boolValue: !toggled })}
      disabled={loading}
    />
    { isCustomized && <span>*</span>}
    </>
  )
};

const ParameterWidget = (props) => {
  const { parameter, parameterType, unit, handleChange } = props;

  const [SetParameter, { loading: mutationLoading, error: mutationError }] = useMutation(SET_PARAMETER, {
    onCompleted(data) {
      console.log(data);
      handleChange(data);
    }
  });

  const handleUserSelection = (evt) => {
    SetParameter({variables: evt});
  };

  switch(parameterType) {
    case 'NumberParameterType': return <NumberWidget initialValue={parameter.numberValue} min={parameter.minValue} max={parameter.maxValue} handleChange={handleUserSelection} unit={unit} loading={mutationLoading} isCustomized={parameter.isCustomized}/>
    break;
    case 'StringParameterType': return <div>String</div>
    break;
    case 'BoolParameterType': return <BoolWidget id={parameter.id} toggled={parameter.boolValue} handleChange={handleUserSelection} loading={mutationLoading} isCustomized={parameter.isCustomized}/>
    break;
    default: return <div />
  }

};

export default ParameterWidget;
