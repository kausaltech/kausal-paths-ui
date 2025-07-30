import type { Theme } from '@kausal/themes/types';
import { useTheme as useMuiTheme } from '@mui/material';

export function useBaseTheme() {
  const muiTheme = useMuiTheme();

  return muiTheme as unknown as Theme;
}
