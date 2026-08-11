import { Suspense, lazy, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Box,
  CircularProgress,
  Drawer,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import { X } from 'react-bootstrap-icons';

import type { ModelEditorDimensionalMetricFieldsFragment } from '@/common/__generated__/graphql';
import { useSiteWithSetter } from '@/context/site';
import DimensionalNodeVisualisation from '../general/DimensionalNodeVisualisation';
import type { DimensionalMetric } from './dimensional-metric';
import { useActionImpact } from './metric-viewer/useActionImpact';
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

type YearRange = { startYear: number; endYear: number };

/** One titled metric block rendered as either a data table or a graph. */
function MetricSection({
  title,
  metric,
  rawMetric,
  errorMessage,
  view,
  yearRange,
}: {
  title: string;
  metric: DimensionalMetric | null;
  rawMetric: ModelEditorDimensionalMetricFieldsFragment | null;
  errorMessage?: string | null;
  view: ViewMode;
  yearRange: YearRange;
}) {
  const t = useTranslations('model-editor');
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5, flexShrink: 0 }}>
        {title}
      </Typography>
      {errorMessage && !rawMetric ? (
        <Alert severity="error" sx={{ fontSize: 12 }}>
          {t('metric-output-error', { error: errorMessage })}
        </Alert>
      ) : view === 'table' ? (
        metric ? (
          <Suspense fallback={<CircularProgress size={20} />}>
            <MetricDataViewer metric={metric} fillHeight />
          </Suspense>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('metric-no-data')}
          </Typography>
        )
      ) : rawMetric ? (
        <DimensionalNodeVisualisation
          title={title}
          metric={rawMetric}
          startYear={yearRange.startYear}
          endYear={yearRange.endYear}
          withTools={false}
        />
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('metric-no-data')}
        </Typography>
      )}
    </Box>
  );
}

export default function MetricsDrawer({ nodeId, nodeName, open, onClose, width, zIndex }: Props) {
  const t = useTranslations('model-editor');
  const { portMetrics, action, loading, error, fetch } = useNodeMetric(nodeId);
  const [view, setView] = useState<ViewMode>('table');
  const [site] = useSiteWithSetter();

  // Impact target for action nodes; initialised to the first downstream
  // outcome node once the node data arrives.
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  const [lastNodeId, setLastNodeId] = useState(nodeId);
  if (nodeId !== lastNodeId) {
    setLastNodeId(nodeId);
    setTargetNodeId(null);
  }
  const effectiveTargetId =
    targetNodeId && action?.downstreamNodes.some((n) => n.id === targetNodeId)
      ? targetNodeId
      : (action?.defaultTargetId ?? null);
  const impact = useActionImpact(
    open && action ? nodeId : null,
    open && action ? effectiveTargetId : null
  );

  useEffect(() => {
    if (open && nodeId) fetch();
    // fetch on open (and when node changes while open)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId]);

  // Graph view needs year bounds from the site context. Fall back to the
  // metric's own year range if the site doesn't expose one yet.
  const yearRange = useMemo(() => {
    const first = portMetrics[0]?.rawMetric ?? action?.effect;
    const metricYears = first?.years ?? [];
    const metricStart = metricYears[0] ?? new Date().getFullYear() - 10;
    const metricEnd = metricYears[metricYears.length - 1] ?? new Date().getFullYear() + 10;
    return {
      startYear: site?.minYear ?? metricStart,
      endYear: site?.maxYear ?? metricEnd,
    };
  }, [portMetrics, action, site?.minYear, site?.maxYear]);

  const hasContent = action != null || portMetrics.length > 0;
  const targetName =
    action?.downstreamNodes.find((n) => n.id === effectiveTargetId)?.name ?? effectiveTargetId;

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
          {t('metric-output-data', { nodeName: nodeName ? `: ${nodeName}` : '' })}
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
        <Tab value="table" label={t('metric-table')} sx={{ minHeight: 36, py: 0.5 }} />
        <Tab value="graph" label={t('metric-graph')} sx={{ minHeight: 36, py: 0.5 }} />
      </Tabs>
      <Box sx={{ p: 2, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {loading && !hasContent ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : error && !hasContent ? (
          // Nothing rendered at all (network failure, or the whole query
          // errored): surface the message instead of an empty drawer.
          <Alert severity="error" sx={{ fontSize: 12 }}>
            {t('metric-output-error', { error: error.message })}
          </Alert>
        ) : action ? (
          // Action nodes: the per-port output is not available, so show the
          // action's own effect series plus its impact on a downstream node.
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            {!action.isEnabled && (
              <Alert severity="info" sx={{ fontSize: 12, flexShrink: 0 }}>
                {t('metric-action-disabled')}
              </Alert>
            )}
            <MetricSection
              title={t('metric-action-effect')}
              metric={action.effectMetric}
              rawMetric={action.effect}
              view={view}
              yearRange={yearRange}
            />
            {action.downstreamNodes.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <FormControl size="small" sx={{ mb: 1.5, flexShrink: 0 }}>
                  <InputLabel id="impact-target-label">
                    {t('metric-action-impact-target')}
                  </InputLabel>
                  <Select
                    labelId="impact-target-label"
                    label={t('metric-action-impact-target')}
                    value={effectiveTargetId ?? ''}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                  >
                    {action.downstreamNodes.map((n) => (
                      <MenuItem key={n.id} value={n.id}>
                        {n.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {impact.loading && !impact.rawMetric ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={20} />
                  </Box>
                ) : (
                  <MetricSection
                    title={t('metric-action-impact-on', { nodeName: targetName ?? '' })}
                    metric={impact.metric}
                    rawMetric={impact.rawMetric}
                    errorMessage={impact.error?.message ?? null}
                    view={view}
                    yearRange={yearRange}
                  />
                )}
              </Box>
            )}
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
            {portMetrics.map((pm) => (
              <MetricSection
                key={pm.portId}
                title={pm.portLabel ?? pm.quantity ?? pm.portId}
                metric={pm.metric}
                rawMetric={pm.rawMetric}
                errorMessage={pm.errorMessage}
                view={view}
                yearRange={yearRange}
              />
            ))}
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
