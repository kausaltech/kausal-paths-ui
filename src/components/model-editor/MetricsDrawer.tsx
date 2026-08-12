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
  /**
   * The model's outcome nodes: candidate targets for the action impact
   * section, whether or not the inspected action actually affects them.
   */
  outcomeNodes: readonly { id: string; name: string }[];
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

/** Uppercase strip naming a drawer section, above its picker and content. */
function SectionHeader({ children }: { children: string }) {
  return (
    <Typography
      variant="overline"
      sx={{
        fontSize: 11,
        fontWeight: 600,
        lineHeight: 1.5,
        color: 'text.secondary',
        flexShrink: 0,
      }}
    >
      {children}
    </Typography>
  );
}

export default function MetricsDrawer({
  nodeId,
  nodeName,
  outcomeNodes,
  open,
  onClose,
  width,
  zIndex,
}: Props) {
  const t = useTranslations('model-editor');
  const { portMetrics, action, loading, error, fetch } = useNodeMetric(nodeId);
  const [view, setView] = useState<ViewMode>('table');
  const [site] = useSiteWithSetter();

  // Impact target for action nodes; defaults to the model's first outcome
  // node. All outcome nodes are offered, even ones this action can't reach.
  const [targetNodeId, setTargetNodeId] = useState<string | null>(null);
  // Effect-preview target: only relevant for multi-output actions, whose own
  // effect series (metricDim) is null; the preview then shows the impact on a
  // chosen direct downstream neighbour instead.
  const [effectNodeId, setEffectNodeId] = useState<string | null>(null);
  const [lastNodeId, setLastNodeId] = useState(nodeId);
  if (nodeId !== lastNodeId) {
    setLastNodeId(nodeId);
    setTargetNodeId(null);
    setEffectNodeId(null);
  }
  const effectiveTargetId =
    targetNodeId && outcomeNodes.some((n) => n.id === targetNodeId)
      ? targetNodeId
      : (outcomeNodes[0]?.id ?? null);
  const impact = useActionImpact(
    open && action ? nodeId : null,
    open && action ? effectiveTargetId : null
  );
  const needsEffectFallback = action != null && !action.effect;
  const effectiveEffectId =
    effectNodeId && action?.directDownstream.some((n) => n.id === effectNodeId)
      ? effectNodeId
      : (action?.directDownstream[0]?.id ?? null);
  const effectImpact = useActionImpact(
    open && needsEffectFallback ? nodeId : null,
    open && needsEffectFallback ? effectiveEffectId : null
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
    outcomeNodes.find((n) => n.id === effectiveTargetId)?.name ?? effectiveTargetId;

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
          {t(action ? 'metric-action-impact-title' : 'metric-output-data', {
            nodeName: nodeName ? `: ${nodeName}` : '',
          })}
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
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <SectionHeader>{t('metric-action-section-direct')}</SectionHeader>
              {!needsEffectFallback ? (
                <MetricSection
                  title={t('metric-action-effect')}
                  metric={action.effectMetric}
                  rawMetric={action.effect}
                  view={view}
                  yearRange={yearRange}
                />
              ) : action.directDownstream.length > 0 ? (
                // Multi-output action: no single own effect series exists, so
                // preview the effect as the impact on a direct downstream node.
                <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                  {action.directDownstream.length > 1 && (
                    // mt gives the floating label headroom so the scroll
                    // container doesn't clip it at the top.
                    <FormControl size="small" sx={{ mt: 1, mb: 1.5, flexShrink: 0 }}>
                      <InputLabel id="effect-target-label">
                        {t('metric-action-effect-target')}
                      </InputLabel>
                      <Select
                        labelId="effect-target-label"
                        label={t('metric-action-effect-target')}
                        value={effectiveEffectId ?? ''}
                        onChange={(e) => setEffectNodeId(e.target.value)}
                      >
                        {action.directDownstream.map((n) => (
                          <MenuItem key={n.id} value={n.id}>
                            {n.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {effectImpact.loading && !effectImpact.rawMetric ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress size={20} />
                    </Box>
                  ) : (
                    <MetricSection
                      title={t('metric-action-effect-on', {
                        nodeName:
                          action.directDownstream.find((n) => n.id === effectiveEffectId)?.name ??
                          '',
                      })}
                      metric={effectImpact.metric}
                      rawMetric={effectImpact.rawMetric}
                      errorMessage={effectImpact.error?.message ?? null}
                      view={view}
                      yearRange={yearRange}
                    />
                  )}
                </Box>
              ) : (
                <MetricSection
                  title={t('metric-action-effect')}
                  metric={null}
                  rawMetric={null}
                  view={view}
                  yearRange={yearRange}
                />
              )}
            </Box>
            {outcomeNodes.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                <SectionHeader>{t('metric-action-section-outcome')}</SectionHeader>
                <FormControl size="small" sx={{ mt: 1, mb: 1.5, flexShrink: 0 }}>
                  <InputLabel id="impact-target-label">
                    {t('metric-action-impact-target')}
                  </InputLabel>
                  <Select
                    labelId="impact-target-label"
                    label={t('metric-action-impact-target')}
                    value={effectiveTargetId ?? ''}
                    onChange={(e) => setTargetNodeId(e.target.value)}
                  >
                    {outcomeNodes.map((n) => (
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
