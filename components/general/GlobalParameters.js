import { useContext, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import styled from 'styled-components';
import { Row, Col, FormGroup, Label, Input, CustomInput, Button, InputGroup, FormFeedback } from 'reactstrap';
import { ArrowCounterclockwise } from 'react-bootstrap-icons';
import { activeScenarioVar } from 'common/cache';
import ContentLoader from 'components/common/ContentLoader';
import { GET_SCENARIOS } from 'common/queries/getScenarios';
import { GET_PARAMETERS } from 'common/queries/getParameters';

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

const ParameterWidget = (props) => {
  const { parameterContent: parameter } = props;
  const [invalid, setInvalid] = useState(false);

  const [SetParameter, { loading: mutationLoading, error: mutationError }] = useMutation(SET_PARAMETER, {
    refetchQueries: [
      { query: GET_SCENARIOS },
      { query: GET_PARAMETERS },
    ],
  });

  const isInvalid = (input) => {
    //console.log()
    switch(parameter.__typename) {
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
    console.log("param event", evt)
    if(evt?.char==='Enter') {
      console.log("enter", evt)
      const validity = isInvalid(evt);
      setInvalid(validity);
      if (!validity) SetParameter({ variables: evt });
    }
  };

  switch(parameter.__typename) { 
    case 'NumberParameterType': return (
      <Col lg="2" md="3" sm="4" xs="6">
        <FormGroup className="position-relative">
          <Label for={parameter.id}>
            {parameter.label || parameter.id}
            {parameter.isCustomized && <span> * </span>}
          </Label>
          <InputGroup>
            <Input
              invalid={invalid !== false}
              valid = {parameter.isCustomized}
              id={parameter.id}
              name={parameter.id}
              placeholder={mutationLoading ? 'loading' : parameter.numberValue}
              defaultValue={mutationLoading ? 'loading' : parameter.numberValue}
              type="text"
              bsSize="sm"
              onKeyPress={(e) => handleUserSelection({ parameterId: parameter.id, numberValue: +e.target.value, char: e.key })}
            />
            <FormFeedback tooltip>
              {invalid}
            </FormFeedback>
            { false && <Button size="sm" outline color="black" disabled={!parameter.isCustomized}><ArrowCounterclockwise /></Button> }
          </InputGroup>
        </FormGroup>
      </Col>);
    case 'StringParameterType': return (
      <Col lg="2" md="3" sm="4" xs="6">
          <FormGroup>
          <Label for={parameter.id}>
            {parameter.label || parameter.id}
            {parameter.isCustomized && <span> * </span>}
          </Label>
          <Input
            id={parameter.id}
            name={parameter.id}
            placeholder={mutationLoading ? 'loading' : parameter.stringValue}
            defaultValue={mutationLoading ? 'loading' : parameter.stringValue}
            type="text"
            bsSize="sm"
            onKeyPress={(e) => handleUserSelection({ parameterId: parameter.id, stringValue: e.target.value, char: e.key })}
          />
        </FormGroup>
      </Col>);
    case 'BoolParameterType': return (
      <Col lg="2" md="3" sm="4" xs="6">
      <FormGroup switch>
        <Label for={parameter.id}>
          {parameter.label || parameter.id}
          {parameter.isCustomized && <span> * </span>}
        </Label>
        <Input
          type="switch"
          role="switch"
          id={parameter.id}
          name={parameter?.id || 'something'}
          checked={parameter.boolValue}
          onChange={(e) => handleUserSelection({ parameterId: parameter.id, boolValue: !parameter.boolValue, char: 'Enter' })}
        />
        </FormGroup>
      </Col>);
    default: return null;
  };
}

const GlobalParameters = (props) => {
  //const { parameters } = props;
  
  //console.log("Global params", parameters);

  const { loading, error, data, refetch } = useQuery(GET_PARAMETERS);

  if (loading) {
    return <><ContentLoader /></>;
  } if (error) {
    return <><div>{ t('error-loading-data') }</div></>;
  }

  //console.log("parameters", data);
  const parameters = data.parameters;

  return (
    <GlobalParametersPanel>
      {parameters.map((param) => 
        param.isCustomizable && <ParameterWidget parameterContent={param} key={param.id} refresh={refetch}/>
      )}
    </GlobalParametersPanel>
  )
}

export default GlobalParameters;
