import { useEffect, useState } from 'react';
import { gql, useMutation, useQuery, NetworkStatus, } from '@apollo/client';
import type { ObservableQuery } from '@apollo/client';
import styled from 'styled-components';
import { Row, Col, FormGroup, Label, Input, Button, InputGroup, FormFeedback } from 'reactstrap';
import { ArrowCounterclockwise } from 'react-bootstrap-icons';
import ContentLoader from 'components/common/ContentLoader';
import { GET_SCENARIOS } from 'common/queries/getScenarios';
import { GET_PARAMETERS } from 'common/queries/getParameters';
import { GET_ACTION_LIST } from 'common/queries/getActionList';
import { GetParametersQuery, SetNormalizationMutation, SetNormalizationMutationVariables } from 'common/__generated__/graphql';
import { useTranslation } from 'react-i18next';
import { useSite } from 'context/site';
import { GET_INSTANCE_GOAL_OUTCOME } from './GoalOutcomeBar';


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

type StyledInputProps = {
  customized: boolean,
}

const StyledInput = styled(Input)<StyledInputProps>`
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

type ParameterWidgetProps = {
  param: GetParametersQuery['parameters'][0],
  refetching: boolean,
  refetch: ObservableQuery['refetch'],
}

const ParameterWidget = (props: ParameterWidgetProps) => {
  const { refetch, refetching, param } = props;
  const {
    __typename,
    id,
    isCustomizable,
    isCustomized,
    label,
    numberValue,
    boolValue,
    stringValue,
  } = props.param;
  const [invalid, setInvalid] = useState(false);
  const [parameterValue, setParameterValue] = useState(numberValue || boolValue || stringValue);
  
  const [SetParameter, { loading: mutationLoading, error: mutationError }] = useMutation(SET_PARAMETER, {
    notifyOnNetworkStatusChange: true,
    refetchQueries: 'all',
    onCompleted: (dat) => {
      //console.log("set param---------", dat);
    },
  });

  useEffect(() => {
    const validity = isInvalid({
      __typename,
      numberValue,
      stringValue,
      boolValue,
    });
    setInvalid(validity);
  }, [numberValue, stringValue, boolValue]);

  const isInvalid = (input) => {
    switch (__typename) {
      case 'NumberParameterType':
        if (isNaN(input.numberValue)) return 'Please provide a number';
        if (input.numberValue >= param.minValue && input.numberValue <= param.maxValue) return false;
        else return `Value must be between ${param.minValue} - ${param.maxValue}`;
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

  switch(param.__typename) { 
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
          <Label for={param.id}>
            {param.label || param.id}
          </Label>
          <Input
            id={param.id!}
            name={param.id!}
            placeholder={mutationLoading ? 'loading' : param.stringValue!}
            defaultValue={mutationLoading ? 'loading' : param.stringValue!}
            type="text"
            bsSize="sm"
            onKeyPress={(e) => handleUserSelection({ type: 'StringParameterType', parameterId: param.id, stringValue: e.target.value, char: e.key })}
          />
        </FormGroup>
      </Col>);
    case 'BoolParameterType': return (
      <Col lg="2" md="3" sm="4" xs="6">
      <FormGroup switch>
        <Label for={param.id}>
          {param.label || param.id}
        </Label>
        <Input
          type="switch"
          role="switch"
          id={param.id!}
          name={param.id!}
          checked={param.boolValue!}
          onChange={(e) => handleUserSelection({ type: 'BoolParameterType', parameterId: param.id, boolValue: !param.boolValue, char: 'Enter' })}
        />
        </FormGroup>
      </Col>);
    default: return null;
  };
}


const SET_NORMALIZATION_MUTATION = gql`
  mutation SetNormalization($id: ID) {
    setNormalizer(id: $id) {
      ok
    }
  }
`;

type NormalizationWidgetProps = {
  availableNormalizations: GetParametersQuery['availableNormalizations']
}
function NormalizationWidget(props: NormalizationWidgetProps) {
  const { t } = useTranslation();
  const { availableNormalizations } = props;
  const [setNormalization, { data, loading, error }] =
    useMutation<SetNormalizationMutation, SetNormalizationMutationVariables>(SET_NORMALIZATION_MUTATION, {
      refetchQueries: 'active',
    });

  if (!availableNormalizations.length) return null;
  const norm = availableNormalizations[0];
  const label = t('normalize-by', { node: norm.label });
  return (
    <Col lg="2" md="3" sm="4" xs="6">
      <FormGroup switch>
        <Label for={norm.id}>
          {label}
        </Label>
        <Input
          type="switch"
          role="switch"
          id={norm.id}
          name={norm.id}
          checked={norm.isActive}
          onChange={(e) => {
            setNormalization({
              variables: {
                id: norm.isActive ? null : norm.id,
              },
            })
          }}
        />
      </FormGroup>
    </Col>
  );
}

type GlobalParametersProps = {
}

const GlobalParameters = (props: GlobalParametersProps) => {
  const { loading, error, data, previousData, refetch, networkStatus } = useQuery<GetParametersQuery>(GET_PARAMETERS, {
    notifyOnNetworkStatusChange: true,
  });
  const { t } = useTranslation();

  const refetching = (networkStatus === NetworkStatus.refetch);

  if ((loading && !previousData) || !data || !data.parameters) {
    return <><ContentLoader /></>;
  } if (error) {
    return <><div>{ t('error-loading-data') }</div></>;
  }

  const { availableNormalizations, parameters } = data;

  return (
    <GlobalParametersPanel>
      {parameters.map((param) => 
        param.isCustomizable && <ParameterWidget
          key={param.id}
          param={param}
          refetch={refetch}
          refetching={refetching}
          />
      )}
    </GlobalParametersPanel>
  )
}

export default GlobalParameters;
