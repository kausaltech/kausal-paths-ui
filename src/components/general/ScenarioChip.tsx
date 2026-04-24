import * as React from 'react';

import { Chip, TableCell } from '@mui/material';

import { Check, X } from 'react-bootstrap-icons';

import { useTheme } from '@common/themes';

import { scenarioEditorDrawerOpenVar } from '@/common/cache';

type ScenarioChipProps = {
  checked: boolean;
  label: string;
  width?: number | string;
};

function ScenarioChip({ checked, label, width = 64 }: ScenarioChipProps) {
  const theme = useTheme();

  const bg = checked
    ? (theme.graphColors?.blue010 ?? theme.palette.action.selected)
    : (theme.graphColors?.red010 ?? theme.palette.error.light);

  const fg = checked
    ? (theme.graphColors?.blue090 ?? theme.palette.primary.main)
    : (theme.graphColors?.red090 ?? theme.palette.error.main);

  const border = checked
    ? (theme.graphColors?.blue030 ?? 'transparent')
    : (theme.graphColors?.red030 ?? 'transparent');

  return (
    <TableCell sx={{ width }}>
      <Chip
        size="small"
        icon={checked ? <Check size={16} /> : <X size={16} />}
        label={'\u200B'}
        clickable
        aria-label={label}
        onClick={() => scenarioEditorDrawerOpenVar(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            scenarioEditorDrawerOpenVar(true);
          }
        }}
        sx={{
          height: 32,
          width: 32,
          minWidth: 32,
          p: 0,
          borderRadius: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: bg,
          color: fg,
          border: `1px solid ${border}`,
          '& .MuiChip-icon': {
            color: 'inherit',
            m: 0,
            width: 18,
            height: 18,
          },
          '& .MuiChip-label': {
            p: 0,
            width: 0,
            overflow: 'hidden',
          },
          '&:hover': { bgcolor: bg },
          '& .MuiTouchRipple-root': { display: 'none' },
        }}
      />
    </TableCell>
  );
}
const MemoizedScenarioChip = React.memo(ScenarioChip);
ScenarioChip.displayName = 'ScenarioChip';
export default MemoizedScenarioChip;
