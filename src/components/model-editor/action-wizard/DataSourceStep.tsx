import {
  Alert,
  Box,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import type { DataSourceConfig, DataSourceType } from './types';

type DataSourceStepProps = {
  dataSource: DataSourceConfig;
  onChange: (dataSource: DataSourceConfig) => void;
};

export default function DataSourceStep({ dataSource, onChange }: DataSourceStepProps) {
  const update = (partial: Partial<DataSourceConfig>) =>
    onChange({ ...dataSource, ...partial });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="body1">
        Choose where the copied action will get its impact data. The system will not assume the
        original dataset binding carries over.
      </Typography>

      <RadioGroup
        value={dataSource.type}
        onChange={(e) => update({ type: e.target.value as DataSourceType })}
      >
        <FormControlLabel
          value="existing"
          control={<Radio />}
          label="Use an existing dataset/table"
        />
        <FormControlLabel
          value="new"
          control={<Radio />}
          label="Create a new dedicated dataset"
        />
      </RadioGroup>

      {dataSource.type === 'existing' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pl: 4 }}>
          <TextField
            label="Dataset ID"
            value={dataSource.datasetId}
            onChange={(e) => update({ datasetId: e.target.value })}
            helperText='e.g. "aarhus/energy_actions"'
            size="small"
            fullWidth
          />
          <TextField
            label="Selector Column"
            value={dataSource.selectorColumn}
            onChange={(e) => update({ selectorColumn: e.target.value })}
            helperText='The column used to filter rows for this action. Usually "action".'
            size="small"
            fullWidth
          />
          <TextField
            label="Selector Value"
            value={dataSource.selectorValue}
            onChange={(e) => update({ selectorValue: e.target.value })}
            helperText="The value that identifies this action's rows in the dataset."
            size="small"
            fullWidth
          />
        </Box>
      )}

      {dataSource.type === 'new' && (
        <Alert severity="info" variant="outlined" sx={{ ml: 4 }}>
          New dataset creation will be available in a future version. For now, create the dataset
          through the Datasets admin and reference it here.
        </Alert>
      )}
    </Box>
  );
}
