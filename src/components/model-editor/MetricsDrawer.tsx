import { Suspense, lazy, useEffect } from 'react';

import { Box, CircularProgress, Drawer, IconButton, Typography } from '@mui/material';

import { X } from 'react-bootstrap-icons';

import { useNodeMetric } from './metric-viewer/useNodeMetric';

const MetricDataViewer = lazy(() => import('./metric-viewer/MetricDataViewer'));

type Props = {
  nodeId: string | null;
  nodeName: string | null;
  open: boolean;
  onClose: () => void;
  width: number;
  zIndex?: number;
};

export default function MetricsDrawer({ nodeId, nodeName, open, onClose, width, zIndex }: Props) {
  const { portMetrics, loading, fetch } = useNodeMetric(nodeId);

  useEffect(() => {
    if (open && nodeId) fetch();
    // fetch on open (and when node changes while open)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId]);

  return (
    <Drawer
      variant="persistent"
      anchor="right"
      open={open}
      slotProps={{
        paper: {
          sx: {
            width,
            maxWidth: '100vw',
            boxShadow: 14,
            zIndex: zIndex ?? ((theme) => theme.zIndex.drawer + 1),
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 600 }}>
          Output data {nodeName ? `: ${nodeName}` : ''}
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </Box>
      <Box sx={{ p: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {loading && portMetrics.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              flex: 1,
              minHeight: 0,
            }}
          >
            {portMetrics.map((pm) => (
              <Box
                key={pm.portId}
                sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
              >
                <Typography variant="subtitle2" sx={{ mb: 0.5, flexShrink: 0 }}>
                  {pm.portLabel ?? pm.quantity ?? pm.portId}
                </Typography>
                {pm.metric ? (
                  <Suspense fallback={<CircularProgress size={20} />}>
                    <MetricDataViewer metric={pm.metric} fillHeight />
                  </Suspense>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No data available
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
