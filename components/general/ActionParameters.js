import styled from 'styled-components';
import ParameterWidget from 'components/general/ParameterWidget';

const Parameters = styled.div` 
margin: 1rem 0;
`;

const ActionParameters = (props) => {
  const { parameters, handleParamChange } = props;

  const actionParameterSwitch = parameters.find((param) => param.__typename === 'BoolParameterType');
  const actionOtherParameters = parameters.filter((param) => param.id !== actionParameterSwitch?.id);

  return (
    <Parameters>
      { actionParameterSwitch && (
        <ParameterWidget
          key={actionParameterSwitch.id}
          parameter={actionParameterSwitch}
          parameterType={actionParameterSwitch.__typename}
          handleChange={handleParamChange}
        />
      )}
      { actionParameterSwitch.boolValue && actionOtherParameters?.map((parameter) => (
        <ParameterWidget
          key={parameter.id}
          parameter={parameter}
          parameterType={parameter.__typename}
          handleChange={handleParamChange}
        />
      ))}
    </Parameters>
  );
};

export default ActionParameters;
