import { useContext, useState } from 'react';
import { gql, useMutation, useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import { Row, Col, FormGroup, Label, Input, CustomInput, Button } from 'reactstrap';
import { activeScenarioVar } from 'common/cache';
import { GET_SCENARIOS } from 'common/queries/getScenarios';


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
  mutation SetParameter($parameterId: ID!, $boolValue: Boolean, $numberValue: Float, $stringValue: String) {
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
  const activeScenario = useReactiveVar(activeScenarioVar);

  const [SetParameter, { loading: mutationLoading, error: mutationError }] = useMutation(SET_PARAMETER, {
    refetchQueries: [
      { query: GET_SCENARIOS },
    ],
  });

  const handleUserSelection = (evt) => {
    SetParameter({ variables: evt });
  };

  switch(parameter.__typename) { 
    case 'NumberParameterType': return (
      <Col lg="2" md="3" sm="4" xs="6">
          <FormGroup>
          <Label for={parameter.id}>
            {parameter.label || parameter.id}
            {parameter.isCustomized && <span> * </span>}
          </Label>
          <Input
            id={parameter.id}
            name={parameter.id}
            placeholder={mutationLoading ? 'loading' : parameter.numberValue}
            value={mutationLoading ? 'loading' : parameter.numberValue}
            type="text"
            bsSize="sm"
            onChange={(e) => handleUserSelection({ parameterId: parameter.id, numberValue: e.target.value })}
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
            type="text"
            bsSize="sm"
            onChange={(e) => handleUserSelection({ parameterId: parameter.id, stringValue: e.target.value })}
          />
        </FormGroup>
      </Col>);
    case 'BoolParameterType': return (
      <Col lg="2" md="3" sm="4" xs="6">
      <FormGroup>
        <Label for={parameter.id}>
          {parameter.label || parameter.id}
        </Label>
        <CustomInput
          type="switch"
          id={parameter.id}
          name={parameter.id}
          checked={parameter.boolValue}
          onChange={(e) => handleUserSelection({ parameterId: parameter.id, boolValue: !parameter.boolValue })}
        />
        </FormGroup>
      </Col>);
    default: return null;
  };
}

const GlobalParameters = (props) => {
  const { parameters } = props;
  console.log("params", parameters);
  return (
    <GlobalParametersPanel>
      {parameters.map((param) => 
        param.isCustomizable && <ParameterWidget parameterContent={param} key={param.id}/>
      )}
    </GlobalParametersPanel>
  )
}

export default GlobalParameters;
