import { useEffect, useState } from 'react';

import { gql, useMutation } from '@apollo/client';
import styled from '@emotion/styled';
import {
  CircularProgress,
  FormControlLabel,
  InputAdornment,
  Slider,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useTranslation } from 'next-i18next';

import { startInteraction } from '@common/sentry/helpers';

import type {
  ActionParameterFragment,
  SetParameterMutation,
  SetParameterMutationVariables,
} from '@/common/__generated__/graphql';
import { activeScenarioVar } from '@/common/cache';
import { useSiteWithSetter } from '@/context/site';

const WidgetWrapper = styled.div`
  font-size: 0.8rem;
  margin-bottom: 1rem;
  width: 100%;
`;

const SET_PARAMETER = gql`
  mutation SetParameter(
    $parameterId: ID!
    $boolValue: Boolean
    $numberValue: Float
    $stringValue: String
  ) {
    setParameter(
      id: $parameterId
      boolValue: $boolValue
      numberValue: $numberValue
      stringValue: $stringValue
    ) {
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

type NumberWidgetProps = {
  id: string;
  initialValue: number;
  defaultValue: number;
  min: number;
  max: number;
  isCustomized: boolean;
  handleChange: (opts: { parameterId: string; numberValue: number }) => void;
  loading: boolean;
  description: string;
  label: string;
  unit: string;
  step: number | null;
};

const NumberWidget = (props: NumberWidgetProps) => {
  const {
    id,
    initialValue,
    defaultValue,
    min,
    max,
    isCustomized,
    handleChange,
    loading,
    description,
    label,
    unit,
    step: defaultStep,
  } = props;

  const [value, setValue] = useState(initialValue);
  const [inputValue, setInputValue] = useState(initialValue.toString());
  const [error, setError] = useState(false);

  const marks = defaultValue ? [{ value: defaultValue, label: '' }] : [];

  // If the parameter is customized, but the value is the same as the default,
  // it is not really customized.
  const isReallyCustomized = isCustomized && initialValue !== defaultValue;

  // Try to guess a good step value if not provided
  const getStep = (min: number, max: number, step: number | null, defaultValue: number) => {
    if (step) return step;
    const range = max - min;
    const digitsAfterDefaultDecimal = defaultValue.toString().split('.')[1]?.length ?? 0;
    const digitsAfterRangeDecimal = range.toString().split('.')[1]?.length ?? 0;
    if (digitsAfterDefaultDecimal > 0) return Math.pow(10, -digitsAfterDefaultDecimal);
    if (digitsAfterRangeDecimal > 0) return Math.pow(10, -digitsAfterRangeDecimal);
    return 1;
  };

  const step = getStep(min, max, defaultStep, defaultValue);

  useEffect(() => {
    setValue(initialValue);
    setInputValue(initialValue.toString());
  }, [initialValue]);

  const validateNumber = (value: number) => {
    const isValid = value >= min && value <= max && !isNaN(value);
    setError(!isValid);
    return isValid;
  };

  const handleSlide = (event: Event, newValue: number) => {
    setValue(newValue);
    setInputValue(newValue.toString());
    validateNumber(newValue);
  };

  const handleSlideCommitted = (event: Event, newValue: number) => {
    setValue(newValue);
    setInputValue(newValue.toString());
    const isValid = validateNumber(newValue);
    if (isValid) handleChange({ parameterId: id, numberValue: newValue });
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = event.target.value;
    setInputValue(inputVal);

    // Convert comma to dot for number parsing, but keep original input for display
    const normalizedVal = inputVal.replace(',', '.');
    const numericValue = Number(normalizedVal);

    if (inputVal === '' || (!isNaN(numericValue) && normalizedVal !== '.')) {
      setValue(inputVal === '' ? 0 : numericValue);
      validateNumber(inputVal === '' ? 0 : numericValue);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const inputVal = event.target.value;
    const normalizedVal = inputVal.replace(',', '.');
    const numericValue = Number(normalizedVal);

    // If input is empty or just a decimal point/comma, reset to current value
    if (inputVal === '' || inputVal === '.' || inputVal === ',' || isNaN(numericValue)) {
      setInputValue(value.toString());
      validateNumber(value);
      return;
    }

    setValue(numericValue);
    // Convert comma to dot in the final display
    setInputValue(normalizedVal);
    const isValid = validateNumber(numericValue);
    if (isValid) handleChange({ parameterId: id, numberValue: numericValue });
  };

  if (min == null || max == null) return null;

  return (
    <WidgetWrapper>
      <Stack spacing={0.5} direction="column" sx={{ alignItems: 'flex-start', width: '100%' }}>
        <div>
          {description || label} {isReallyCustomized ? '*' : null}
        </div>
        <TextField
          value={inputValue}
          size="small"
          onChange={handleInputChange}
          onBlur={handleBlur}
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="start">{unit}</InputAdornment>,
            },
          }}
          error={error}
          helperText={error ? 'Value must be between ' + min + ' and ' + max : ''}
          sx={{
            width: '100%',
            backgroundColor: isReallyCustomized ? 'theme.graphColors.yellow030' : 'grey.100',
          }}
        />
        <Slider
          aria-label={description || label}
          value={value}
          onChangeCommitted={handleSlideCommitted}
          onChange={handleSlide}
          min={min}
          max={max}
          step={step}
          disabled={loading}
          id={id}
          name={id}
          marks={marks}
        />
      </Stack>
    </WidgetWrapper>
  );
};

type BoolWidgetProps = {
  parameter: ActionParameterFragment & { __typename: 'BoolParameterType' };
  handleChange: (opts: { parameterId: string; boolValue: boolean }) => void;
  loading: boolean;
  WidgetWrapper: typeof WidgetWrapper;
  disabled?: boolean;
};

export const BoolWidget = (props: BoolWidgetProps) => {
  const { parameter, handleChange, loading, WidgetWrapper, disabled } = props;
  const { id, boolValue, isCustomizable } = parameter;
  const { t } = useTranslation();

  const label = parameter.label || parameter.description || t('included-in-scenario');

  return (
    <WidgetWrapper>
      <FormControlLabel
        control={
          <Switch
            onChange={() => handleChange({ parameterId: id, boolValue: !boolValue })}
            disabled={!isCustomizable || loading || disabled}
            checked={boolValue ?? false}
            size="small"
          />
        }
        label={label}
        sx={{
          m: 0,
          p: 0,
        }}
        slotProps={{
          typography: {
            variant: 'caption',
          },
        }}
      />
      {loading && <CircularProgress size={10} sx={{ ml: 0.5, mb: -0.1 }} />}
    </WidgetWrapper>
  );
};

type ParameterWidgetProps = {
  parameter: ActionParameterFragment;
  WidgetWrapper?: typeof WidgetWrapper;
  disabled?: boolean;
};

const ParameterWidget = (props: ParameterWidgetProps) => {
  const { parameter, disabled = false } = props;
  const [site] = useSiteWithSetter();

  const [setParameter, { loading: mutationLoading, error: mutationError }] = useMutation<
    SetParameterMutation,
    SetParameterMutationVariables
  >(SET_PARAMETER, {
    refetchQueries: 'active',
    onCompleted: () => {
      const customScenario = site.scenarios.find((scen) => scen.id === 'custom');
      // NOTE: We KNOW this mutation results in active scenario to be set to custom in backend
      // Although the mutation does not return the active scenario, so we need to set it manually
      // We  want to update activeScenarioVar only in onCompleted mutations
      if (customScenario) {
        activeScenarioVar({ ...customScenario, isUserSelected: false });
      }
    },
  });

  type UserSelection =
    | { parameterId: string; numberValue: number }
    | { parameterId: string; boolValue: boolean }
    | { parameterId: string; stringValue: string };
  const handleUserSelection = (evt: UserSelection) => {
    const variables: SetParameterMutationVariables = {
      parameterId: evt.parameterId,
      numberValue: 'numberValue' in evt ? evt.numberValue : null,
      boolValue: 'boolValue' in evt ? evt.boolValue : null,
      stringValue: 'stringValue' in evt ? evt.stringValue : null,
    };
    void startInteraction(() => setParameter({ variables: variables }), {
      name: 'setParameter',
      componentName: 'ParameterWidget',
      attributes: { parameter_id: parameter.id },
    });
  };

  switch (parameter.__typename) {
    case 'NumberParameterType':
      return (
        <NumberWidget
          id={parameter.id}
          initialValue={parameter.numberValue ?? 0}
          defaultValue={parameter.numberDefaultValue ?? 0}
          min={parameter.minValue ?? 0}
          max={parameter.maxValue ?? 0}
          handleChange={handleUserSelection}
          loading={mutationLoading}
          isCustomized={parameter.isCustomized}
          description={parameter.description ?? ''}
          label={parameter.label ?? ''}
          unit={parameter.unit?.htmlShort ?? ''}
          step={parameter.step}
        />
      );

    case 'StringParameterType':
      return null;

    case 'BoolParameterType':
      return (
        <BoolWidget
          parameter={parameter}
          handleChange={handleUserSelection}
          loading={mutationLoading}
          WidgetWrapper={props.WidgetWrapper ?? WidgetWrapper}
          disabled={disabled}
        />
      );

    default:
      return null;
  }
};

export default ParameterWidget;
