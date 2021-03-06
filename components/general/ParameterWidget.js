import { useState, useEffect } from 'react';
import { gql, useMutation, useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import {
  CustomInput,
  Button,
} from 'reactstrap';
import { ArrowCounterclockwise } from 'react-bootstrap-icons';
import { Range, getTrackBackground } from 'react-range';
import styled, { useTheme } from 'styled-components';
import { activeScenarioVar } from 'common/cache';
import { GET_SCENARIOS } from 'common/queries/getScenarios';

const RangeWrapper = styled.div`
  display: flex;
  min-width: 240px;
  max-width: 320px;
`;

const WidgetWrapper = styled.div`
  font-size: 0.8rem;

  .custom-switch {
    margin-top: .25rem;
  }
`;

const RangeValue = styled.div`
  display: flex;
  white-space: nowrap;
  min-width: 75px;
  margin-left: 1rem;
  line-height: 3;
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
  const { id, initialValue, defaultValue, min, max, isCustomized, handleChange, loading, description, unit } = props;
  const theme = useTheme();
  const [values, setValues] = useState([initialValue]);

  useEffect(() => {
    setValues([initialValue]);
  }, [initialValue]);

  const handleSlide = (newValues) => {
    handleChange({ parameterId: id, numberValue: newValues[0] });
  };

  const Reset = () => defaultValue && (
    <Button
      id="reset-button"
      color="link"
      size="sm"
      outline
      on
      onClick={() => setValues([defaultValue])}
    >
      <ArrowCounterclockwise />
    </Button>
  );

  return (
    <WidgetWrapper>
      <div>
        { description }
      </div>
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
          renderThumb={({ props, isDragged }) => (
            <Thumb
              {...props}
              dragged={isDragged}
              style={{
                ...props.style,
              }}
              color={theme.brandDark}
            />
          )}
        />
        <RangeValue>
          {`${(values[0]).toFixed(0)} ${unit?.htmlShort || ''}`}
          {isCustomized && <Reset />}
        </RangeValue>
      </RangeWrapper>
    </WidgetWrapper>
  );
};

const BoolWidget = (props) => {
  const { id, toggled, handleChange, loading, isCustomized, description } = props;
  const { t } = useTranslation();

  const label = description || t('will_be_implemented');

  return (
    <WidgetWrapper>
      <div>
        { label }
      </div>
      <CustomInput
        type="switch"
        id={`${id}-switch`}
        name={id}
        label={isCustomized ? '*' : ''}
        checked={toggled}
        onChange={() => handleChange({ parameterId: id, boolValue: !toggled })}
        disabled={loading}
      />
    </WidgetWrapper>
  );
};

const ParameterWidget = (props) => {
  const { parameter, parameterType } = props;
  const activeScenario = useReactiveVar(activeScenarioVar);

  const [SetParameter, { loading: mutationLoading, error: mutationError }] = useMutation(SET_PARAMETER, {
    refetchQueries: [
      { query: GET_SCENARIOS },
    ],
    onCompleted: () => {
      activeScenarioVar({ ...activeScenario, stamp: Date.now() });
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
          defaultValue={parameter.numberDefaultValue}
          min={parameter.minValue}
          max={parameter.maxValue}
          handleChange={handleUserSelection}
          loading={mutationLoading}
          isCustomized={parameter.isCustomized}
          description={parameter.description}
          unit={parameter.unit}
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
        description={parameter.description}
      />
    );
      break;
    default: return widget;
  }
  return widget;
};

export default ParameterWidget;
