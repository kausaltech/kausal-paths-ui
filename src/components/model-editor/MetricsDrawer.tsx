import { Suspense, lazy, useEffect, useMemo, useState } from 'react';

import { Box, CircularProgress, Drawer, IconButton, Tab, Tabs, Typography } from '@mui/material';

import { X } from 'react-bootstrap-icons';

import { useSiteWithSetter } from '@/context/site';
import DimensionalNodeVisualisation from '../general/DimensionalNodeVisualisation';
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

type ViewMode = 'table' | 'graph';

export default function MetricsDrawer({ nodeId, nodeName, open, onClose, width, zIndex }: Props) {
  const { portMetrics, loading, fetch } = useNodeMetric(nodeId);
  const [view, setView] = useState<ViewMode>('table');
  const [site] = useSiteWithSetter();

  useEffect(() => {
    if (open && nodeId) fetch();
    // fetch on open (and when node changes while open)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId]);

  // Graph view needs year bounds from the site context. Fall back to the
  // metric's own year range if the site doesn't expose one yet.
  const yearRange = useMemo(() => {
    const first = portMetrics[0]?.rawMetric;
    const metricYears = first?.years ?? [];
    const metricStart = metricYears[0] ?? new Date().getFullYear() - 10;
    const metricEnd = metricYears[metricYears.length - 1] ?? new Date().getFullYear() + 10;
    return {
      startYear: site?.minYear ?? metricStart,
      endYear: site?.maxYear ?? metricEnd,
    };
  }, [portMetrics, site?.minYear, site?.maxYear]);

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
      <Tabs
        value={view}
        onChange={(_, v: ViewMode) => setView(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0, minHeight: 36 }}
      >
        <Tab value="table" label="Table" sx={{ minHeight: 36, py: 0.5 }} />
        <Tab value="graph" label="Graph" sx={{ minHeight: 36, py: 0.5 }} />
      </Tabs>
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
              overflowY: view === 'graph' ? 'auto' : undefined,
            }}
          >
            {portMetrics.map((pm) => {
              const portLabel = pm.portLabel ?? pm.quantity ?? pm.portId;
              return (
                <Box
                  key={pm.portId}
                  sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 0.5, flexShrink: 0 }}>
                    {portLabel}
                  </Typography>
                  {view === 'table' ? (
                    pm.metric ? (
                      <Suspense fallback={<CircularProgress size={20} />}>
                        <MetricDataViewer metric={pm.metric} fillHeight />
                      </Suspense>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No data available
                      </Typography>
                    )
                  ) : pm.rawMetric ? (
                    <DimensionalNodeVisualisation
                      title={portLabel}
                      metric={pm.rawMetric}
                      startYear={yearRange.startYear}
                      endYear={yearRange.endYear}
                      withTools={false}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data available
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
