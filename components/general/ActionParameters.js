import styled from 'styled-components';
import ParameterWidget from 'components/general/ParameterWidget';

const Parameters = styled.div` 
margin: 1rem 0;
`;

const ActionParameters = (props) => {
  const { parameters } = props;

  // Separate mandatory on/off parameter with standard id
  const actionParameterSwitch = parameters.find((param) => param.id === `${param.node.id}.enabled`);
  const actionOtherParameters = parameters.filter((param) => param.id !== actionParameterSwitch?.id);

  return (
    <Parameters>
      { actionParameterSwitch && (
        <ParameterWidget
          key={actionParameterSwitch.id}
          parameter={actionParameterSwitch}
          parameterType={actionParameterSwitch.__typename}
        />
      )}
      { actionParameterSwitch.boolValue && actionOtherParameters?.map((parameter) => (
        <ParameterWidget
          key={parameter.id}
          parameter={parameter}
          parameterType={parameter.__typename}
        />
      ))}
    </Parameters>
  );
};

export default ActionParameters;
