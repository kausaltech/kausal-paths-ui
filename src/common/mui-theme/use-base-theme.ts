import { useTheme as useMuiTheme } from '@mui/material';

export function useBaseTheme() {
  const muiTheme = useMuiTheme();

  return muiTheme.base;
}
