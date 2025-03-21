import { gql } from '@apollo/client';
import styled from 'styled-components';

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

export const ACTION_PARAMETER_FRAGMENT = gql`
  fragment ActionParameter on ParameterInterface {
    __typename
    id
    label
    description
    nodeRelativeId
    node {
      id
    }
    isCustomized
    isCustomizable
    ... on NumberParameterType {
      numberValue: value
      numberDefaultValue: defaultValue
      minValue
      maxValue
      unit {
        htmlShort
      }
      step
    }
    ... on BoolParameterType {
      boolValue: value
      boolDefaultValue: defaultValue
    }
    ... on StringParameterType {
      stringValue: value
      stringDefaultValue: defaultValue
    }
  }
`;

type ActionParameterType = ActionParameterFragment;

const ActionParameters = (props: { parameters: ActionParameterType[] }) => {
  const { parameters } = props;

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
        <ParameterWidget key={actionParameterSwitch.id} parameter={actionParameterSwitch} />
      )}
      {actionEnabled &&
        actionOtherParameters?.map((parameter) => (
          <ParameterWidget key={parameter.id} parameter={parameter} />
        ))}
    </Parameters>
  );
};

export default ActionParameters;
