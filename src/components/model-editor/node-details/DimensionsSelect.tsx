import { Autocomplete, TextField } from '@mui/material';

import { useQuery } from '@apollo/client/react';

import { GET_INSTANCE_DIMENSIONS } from '../dimensions/queries';

type Props = {
  label: string;
  value: readonly string[];
  disabled?: boolean;
  onChange: (dimensions: string[]) => void;
};

/**
 * Multi-select over the instance's dimension identifiers, for port/node
 * dimension lists. freeSolo because specs may reference dimensions that
 * aren't (or aren't yet) among the instance's editor dimensions — an
 * unknown identifier renders as-is instead of being unrepresentable.
 */
export default function DimensionsSelect({ label, value, disabled, onChange }: Props) {
  const { data } = useQuery(GET_INSTANCE_DIMENSIONS, {
    fetchPolicy: 'cache-first',
  });
  const dimensions = data?.instance?.editor?.dimensions ?? [];
  const labelFor = (identifier: string) => {
    const dim = dimensions.find((d) => d.identifier === identifier);
    return dim ? `${dim.name} (${dim.identifier})` : identifier;
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      options={dimensions.map((d) => d.identifier)}
      value={[...value]}
      disabled={disabled}
      getOptionLabel={labelFor}
      onChange={(_, next) => onChange(next)}
      size="small"
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          slotProps={{
            ...params.slotProps,
            input: { ...params.slotProps.input, sx: { fontSize: 13 } },
          }}
        />
      )}
    />
  );
}
