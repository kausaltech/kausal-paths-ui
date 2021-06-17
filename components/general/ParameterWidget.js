import { useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import {
  CustomInput,
} from 'reactstrap';
import { Range, getTrackBackground } from 'react-range';
import styled from 'styled-components';
import { GET_SCENARIOS } from 'common/queries/getScenarios';

const RangeWrapper = styled.div`
  display: flex;
  min-width: 240px;
  max-width: 320px;
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
  background-color: ${(props) => (props.dragged ? props.color : props.color)};
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
  const { id, initialValue, min, max, isCustomized, handleChange, loading } = props;
  const [values, setValues] = useState([initialValue]);

  const handleSlide = (newValues) => {
    handleChange({ parameterId: id, numberValue: newValues[0] });
  };

  return (
    <RangeWrapper>
      <Range
        key="Base"
        step={1}
        min={min}
        max={max}
        values={values}
        onChange={(vals) => setValues(vals)}
        onFinalChange={(vals) => handleSlide(vals)}
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
              disabled={loading}
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
        renderThumb={({ props, isDragged }) => (
          <Thumb
            {...props}
            dragged={isDragged}
            style={{
              ...props.style,
            }}
            color="#107251"
          />
        )}
      />
      <RangeValue>{`${(values[0]).toFixed(0)} %${isCustomized ? '*' : ''}`}</RangeValue>
    </RangeWrapper>
  );
};

const BoolWidget = (props) => {
  const { id, toggled, handleChange, loading, isCustomized } = props;
  const { t } = useTranslation();

  const label = t('will_be_implemented');

  return (
    <>
      <CustomInput
        type="switch"
        id={`${id}-switch`}
        name={id}
        label={`${label} ${isCustomized ? '*' : ''}`}
        checked={toggled}
        onChange={() => handleChange({ parameterId: id, boolValue: !toggled })}
        disabled={loading}
      />
    </>
  );
};

const ParameterWidget = (props) => {
  const { parameter, parameterType, handleChange } = props;

  const [SetParameter, { loading: mutationLoading, error: mutationError }] = useMutation(SET_PARAMETER, {
    refetchQueries: [
      { query: GET_SCENARIOS },
    ],
    onCompleted: () => {
      if (handleChange) handleChange();
    },
  });

  const handleUserSelection = (evt) => {
    SetParameter({ variables: evt });
  };

  let widget = <div>Parameter type missing</div>;

  switch (parameterType) {
    case 'NumberParameterType':
      widget = (
        <NumberWidget
          id={parameter.id}
          initialValue={parameter.numberValue}
          min={parameter.minValue}
          max={parameter.maxValue}
          handleChange={handleUserSelection}
          loading={mutationLoading}
          isCustomized={parameter.isCustomized}
        />
      );
      break;
    case 'StringParameterType': widget = <div>String</div>;
      break;
    case 'BoolParameterType': widget = (
      <BoolWidget
        id={parameter.id}
        toggled={parameter.boolValue}
        handleChange={handleUserSelection}
        loading={mutationLoading}
        isCustomized={parameter.isCustomized}
      />
    );
      break;
    default: return widget;
  }
  return widget;
};

export default ParameterWidget;
