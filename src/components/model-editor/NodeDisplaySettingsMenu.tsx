import { useState } from 'react';

import { Box, Button, Divider, FormControlLabel, Popover, Switch, Typography } from '@mui/material';

import { useReactiveVar } from '@apollo/client/react';
import { ControlButton } from '@xyflow/react';
import { useTranslations } from 'next-intl';
import { ArrowCounterclockwise, Eye } from 'react-bootstrap-icons';

import {
  type NodeDisplaySettings,
  nodeDisplaySettingsVar,
  setNodeDisplaySetting,
} from './displaySettings';

type Props = {
  onResetLayout: () => void;
};

/**
 * Eye button for the React Flow controls (bottom left) that opens a popover
 * of node display toggles. Toggles write to `nodeDisplaySettingsVar`, which
 * each node card subscribes to directly.
 */
export default function NodeDisplaySettingsMenu({ onResetLayout }: Props) {
  const t = useTranslations('model-editor');
  const settings = useReactiveVar(nodeDisplaySettingsVar);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const toggles: { key: keyof NodeDisplaySettings; label: string }[] = [
    { key: 'showNodeType', label: t('nodes-display-node-type') },
  ];

  return (
    <>
      <ControlButton
        onClick={(event) => setAnchorEl(event.currentTarget)}
        title={t('nodes-display-settings')}
        aria-label={t('nodes-display-settings')}
      >
        <Eye />
      </ControlButton>
      <Popover
        open={anchorEl !== null}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', flexDirection: 'column', minWidth: 180 }}>
          <Typography variant="overline" sx={{ lineHeight: 2 }}>
            {t('nodes-display-settings')}
          </Typography>
          {toggles.map(({ key, label }) => (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  size="small"
                  checked={settings[key]}
                  onChange={(event) => setNodeDisplaySetting(key, event.target.checked)}
                />
              }
              label={<Typography variant="body2">{label}</Typography>}
            />
          ))}
          <Divider sx={{ my: 1 }} />
          <Button
            size="small"
            color="inherit"
            startIcon={<ArrowCounterclockwise size={14} />}
            onClick={() => {
              setAnchorEl(null);
              onResetLayout();
            }}
            sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
          >
            {t('nodes-reset-layout')}
          </Button>
        </Box>
      </Popover>
    </>
  );
}
