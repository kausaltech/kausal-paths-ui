import { useEffect, useState } from 'react';
import { gql, useMutation, useQuery, NetworkStatus } from '@apollo/client';
import styled from 'styled-components';
import { Row, Col, FormGroup, Label, Input, CustomInput, Button, InputGroup, FormFeedback } from 'reactstrap';
import { ArrowCounterclockwise } from 'react-bootstrap-icons';
import ContentLoader from 'components/common/ContentLoader';
import { GET_SCENARIOS } from 'common/queries/getScenarios';
import { GET_PARAMETERS } from 'common/queries/getParameters';
import { GET_ACTION_LIST } from 'common/queries/getActionList';
import { number } from 'prop-types';

const GlobalParametersPanel = styled(Row)`
  .form-group {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  label {
    font-size: ${(props) => props.theme.fontSizeSm};
    line-height: 1;
    overflow-wrap: break-word;
    max-width: 100%;
  }
`;

const StyledInput = styled(Input)`
  background-color: ${(props) => props.customized ? props.theme.graphColors.blue010 : props.theme.themeColors.white};
`;

const SET_PARAMETER = gql`
  mutation SetGlobalParameter($parameterId: ID!, $boolValue: Boolean, $numberValue: Float, $stringValue: String) {
    setParameter(id: $parameterId, boolValue: $boolValue, numberValue: $numberValue, stringValue: $stringValue) {
      ok
      parameter {
        isCustomized
        isCustomizable
        ... on BoolParameterType {
        boolValue: value
        boolDefaultValue: defaultValue
      }
      }
    }
  }
`;

const NumericParameter = (props) => {
  const { 
    id,
    isCustomized,
    refetching,
    value,
    invalid,
    handleUserSelection,
   } = props;

  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleInput = (e) => {
    setCurrentValue(e.target.value);
    // Do a fake submit on every input to check validity
    handleUserSelection({ type: 'NumberParameterType', parameterId: id, numberValue: +currentValue, char: undefined })
    // Do a real submit if user leaves the field or presses enter
    const okToSubmit = !invalid || e.type === 'blur' || e?.charCode === 13;
    if (okToSubmit) {
      handleUserSelection({ type: 'NumberParameterType', parameterId: id, numberValue: +currentValue, char: 'Enter' })
    }
  };

  return (
    <InputGroup>
      <StyledInput
        invalid={invalid !== false}
        customized = {isCustomized}
        id={id}
        name={id}
        placeholder={refetching ? '///' : currentValue}
        value={refetching ? '///' : currentValue}
        type="text"
        bsSize="sm"
        onChange={(e) => handleInput(e)}
        onBlur={(e) => handleInput(e)}
        onKeyPress={(e) => handleInput(e)}
      />
      <FormFeedback tooltip>
        {invalid}
      </FormFeedback>
      { false && <Button size="sm" outline color="black" disabled={!parameter.isCustomized}><ArrowCounterclockwise /></Button> }
    </InputGroup>
  )
};

const ParameterWidget = (props) => {
  const {
  id,
  type,
  isCustomizable,
  isCustomized,
  label,
  numberValue,
  boolValue,
  stringValue,
  parameterContent: parameter,
  refresh,
  refetching } = props;
  const [invalid, setInvalid] = useState(false);
  const [parameterValue, setParameterValue] = useState(numberValue || boolValue || stringValue);
  
  //console.log("param", id, numberValue || stringValue || boolValue );
  const [SetParameter, { loading: mutationLoading, error: mutationError }] = useMutation(SET_PARAMETER, {
    notifyOnNetworkStatusChange: true,
    refetchQueries: [
      GET_SCENARIOS,
      GET_PARAMETERS,
      GET_ACTION_LIST,
    ],
    onCompleted: (dat) => {
      //console.log("set param---------", dat);
    },
  });

  useEffect(() => {
    const validity = isInvalid({
      type,
      numberValue,
      stringValue,
      boolValue,
    });
    setInvalid(validity);
  }, [numberValue, stringValue, boolValue]);

  const isInvalid = (input) => {
    switch(type) {
      case 'NumberParameterType':
        if (isNaN(input.numberValue)) return 'Please provide a number';
        if (input.numberValue >= parameter.minValue && input.numberValue <= parameter.maxValue) return false;
        else return `Value must be between ${parameter.minValue} - ${parameter.maxValue}`;
      case 'StringParameterType':
        return false;
      case 'BoolParameterType':
        return false;
    }
  };

  const handleUserSelection = (evt) => {
    // Don't send mutation if value is not valid
    const validity = isInvalid(evt);
    setInvalid(validity);
    if (validity) return;

    // Don't send mutation if value hasn't changed
    switch(evt.type) {
      case 'NumberParameterType':
        if (evt.numberValue === numberValue) return;
      break;
      case 'StringParameterType':
        if (evt.stringValue === stringValue) return;
      break;
      case 'BoolParameterType':
        if (evt.boolValue === boolValue) return;
      break;
    }

    // Send mutation if checks pass (and user presses enter)
    if(evt?.char==='Enter') {
      SetParameter({ variables: evt })
    }
  };

  switch(type) { 
    case 'NumberParameterType': return (
      <Col lg="2" md="3" sm="4" xs="6">
        <FormGroup className="position-relative">
          <Label for={id}>
            {label || id}
            { numberValue }
          </Label>
          <NumericParameter
            id={id}
            invalid={invalid}
            isCustomized={isCustomized}
            refetching={refetching}
            value={numberValue}
            handleUserSelection={handleUserSelection}
          />
        </FormGroup>
      </Col>);
    case 'StringParameterType': return (
      <Col lg="2" md="3" sm="4" xs="6">
          <FormGroup>
          <Label for={parameter.id}>
            {parameter.label || parameter.id}
          </Label>
          <Input
            id={parameter.id}
            name={parameter.id}
            placeholder={mutationLoading ? 'loading' : parameter.stringValue}
            defaultValue={mutationLoading ? 'loading' : parameter.stringValue}
            type="text"
            bsSize="sm"
            onKeyPress={(e) => handleUserSelection({ type: 'StringParameterType', parameterId: parameter.id, stringValue: e.target.value, char: e.key })}
          />
        </FormGroup>
      </Col>);
    case 'BoolParameterType': return (
      <Col lg="2" md="3" sm="4" xs="6">
      <FormGroup switch>
        <Label for={parameter.id}>
          {parameter.label || parameter.id}
        </Label>
        <Input
          type="switch"
          role="switch"
          id={parameter.id}
          name={parameter?.id || 'something'}
          checked={parameter.boolValue}
          onChange={(e) => handleUserSelection({ type: 'BoolParameterType', parameterId: parameter.id, boolValue: !parameter.boolValue, char: 'Enter' })}
        />
        </FormGroup>
      </Col>);
    default: return null;
  };
}

const GlobalParameters = (props) => {
  const { loading, error, data, previousData, refetch, networkStatus } = useQuery(GET_PARAMETERS, {
    notifyOnNetworkStatusChange: true,
  });

  const refetching = (networkStatus === NetworkStatus.refetch);

  if (loading && !previousData) {
    return <><ContentLoader /></>;
  } if (error) {
    return <><div>{ t('error-loading-data') }</div></>;
  }

  const parameters = data.parameters;
  return (
    <GlobalParametersPanel>
      {parameters.map((param) => 
        param.isCustomizable && <ParameterWidget
          key={param.id}
          id={param.id}
          type={param.__typename}
          isCustomizable={param.isCustomizable}
          isCustomized={param.isCustomized}
          label={param.label}
          numberValue={param.numberValue}
          boolValue={param.boolValue}
          stringValue={param.stringValue}
          parameterContent={param}
          refresh={refetch}
          refetching={refetching}
          />
      )}
    </GlobalParametersPanel>
  )
}

export default GlobalParameters;
