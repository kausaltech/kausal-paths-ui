import { gql, useMutation, useQuery, NetworkStatus, } from '@apollo/client';
import styled from 'styled-components';
import { Row, Col, FormGroup, Label, Input, Button, InputGroup, FormFeedback } from 'reactstrap';

import { GetParametersQuery, SetNormalizationMutation, SetNormalizationMutationVariables } from 'common/__generated__/graphql';
import { useTranslation } from 'react-i18next';

const SwitchWrapper = styled.div`
  max-width: 160px;
  .form-label {
    margin-bottom: 0;
    line-height: 1;
    font-size: 0.8rem;
  }
`;

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
      <SwitchWrapper>
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
      </SwitchWrapper>
  );
}

export default NormalizationWidget;