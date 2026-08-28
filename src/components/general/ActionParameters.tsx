import styled from '@common/themes/styled';

import type { ActionParameterFragment } from '@/common/__generated__/graphql';
import ParameterWidget from '@/components/general/ParameterWidget';

const Parameters = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;

  & > div {
    margin-bottom: 0.5rem;
  }
`;

type ActionParameterType = ActionParameterFragment;

const ActionParameters = (props: {
  parameters: ActionParameterType[];
  onScenarioCustomized?: () => void;
}) => {
  const { parameters, onScenarioCustomized } = props;

  if (!parameters) {
    return null;
  }
  // Separate mandatory on/off parameter with standard id
  const actionParameterSwitch = parameters.find(
    (param) => param.node && param.id === `${param.node.id}.enabled`
  ) as (ActionParameterType & { __typename: 'BoolParameterType' }) | null;
  const actionOtherParameters = parameters.filter(
    (param) => param.id !== actionParameterSwitch?.id
  );
  const actionEnabled = actionParameterSwitch?.boolValue;

  return (
    <Parameters>
      {actionParameterSwitch && (
        <ParameterWidget
          key={actionParameterSwitch.id}
          parameter={actionParameterSwitch}
          onScenarioCustomized={onScenarioCustomized}
        />
      )}
      {actionEnabled &&
        actionOtherParameters?.map((parameter) => (
          <ParameterWidget
            key={parameter.id}
            parameter={parameter}
            onScenarioCustomized={onScenarioCustomized}
          />
        ))}
    </Parameters>
  );
};

export default ActionParameters;
