import { useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';

import type { DatasetDetailFieldsFragment } from '@/common/__generated__/graphql';
import { extractYear } from '../dataset-grid-data';
import type { DetectedTable } from './parse';
import {
  type ColumnMapping,
  type DatasetSchema,
  type ImportPlan,
  type LabelResolution,
  type PlanDimension,
  type TriageItem,
  buildImportPlan,
  collectTriageItems,
  defaultResolution,
  inferColumnMapping,
  resolutionKey,
} from './plan';

export interface ImportCommit {
  matrix: string[][];
  detected: DetectedTable;
  mapping: ColumnMapping;
  pinnedCategoryByDimension: Record<string, string>;
  metricId: string;
  /** Effective decision per triage key (defaults already applied). */
  resolutions: Record<string, LabelResolution>;
  /** The triage items, so the commit step can recover labels for new categories. */
  triage: TriageItem[];
}

export interface ImportModalProps {
  open: boolean;
  /** Clipboard matrix + detected structure for the active session, or null. */
  matrix: string[][] | null;
  detected: DetectedTable | null;
  dataset: DatasetDetailFieldsFragment;
  existingYears: number[];
  /** dimId -> uuid auto-pins derived from the grid's active category filter. */
  filterPins: Record<string, string>;
  /** Reserved for surfacing a staging-time validation error (rare). */
  committing: boolean;
  error: string | null;
  onClose: () => void;
  /** Stages the import into the grid's edit state (see useDatasetImport). */
  onCommit: (commit: ImportCommit) => void;
}

const IGNORE = '';

function pickDefaultMetricId(metrics: DatasetDetailFieldsFragment['metrics']): string {
  const value = metrics.find((m) => m.label.toLowerCase() === 'value' || m.name === 'Value');
  return value?.id ?? metrics[0]?.id ?? '';
}

export default function ImportModal({
  open,
  matrix,
  detected,
  dataset,
  existingYears,
  filterPins,
  committing,
  error,
  onClose,
  onCommit,
}: ImportModalProps) {
  const t = useTranslations('model-editor');
  const planDimensions = useMemo<PlanDimension[]>(
    () =>
      dataset.dimensions.map((d) => ({
        id: d.id,
        label: d.name,
        categories: d.categories.map((c) => ({
          uuid: c.uuid,
          identifier: c.identifier ?? null,
          label: c.label,
        })),
      })),
    [dataset.dimensions]
  );

  const schema = useMemo<DatasetSchema>(
    () => ({
      dimensions: planDimensions,
      metrics: dataset.metrics.map((m) => ({
        id: m.id,
        label: m.label,
        name: m.name,
        unit: m.unit,
      })),
      existingPoints: dataset.dataPoints.map((dp) => ({
        metricId: dp.metric.id,
        categoryUuids: dp.dimensionCategories.map((c) => c.uuid),
        year: extractYear(dp.date),
        value: dp.value,
      })),
      existingYears,
    }),
    [planDimensions, dataset.metrics, dataset.dataPoints, existingYears]
  );

  // Session-scoped UI state. Re-initialised whenever a new paste arrives
  // (keyed on the `detected` object identity).
  const [mapping, setMapping] = useState<ColumnMapping>({ dimensionByColumn: {} });
  const [pins, setPins] = useState<Record<string, string>>({});
  const [metricId, setMetricId] = useState('');
  const [resolutions, setResolutions] = useState<Record<string, LabelResolution>>({});

  useEffect(() => {
    if (!detected) return;
    setMapping(inferColumnMapping(detected, planDimensions));
    setMetricId(pickDefaultMetricId(dataset.metrics));
    setPins({});
    setResolutions({});
  }, [detected, planDimensions, dataset.metrics]);

  const mappedDimIds = useMemo(() => new Set(Object.values(mapping.dimensionByColumn)), [mapping]);
  const mappedDimCount = mappedDimIds.size;
  const pinnableDims = useMemo(
    () => planDimensions.filter((d) => !mappedDimIds.has(d.id)),
    [planDimensions, mappedDimIds]
  );

  // Effective pin = explicit override, else the filter-derived auto-pin.
  const effectivePin = (dimId: string) => pins[dimId] ?? filterPins[dimId] ?? '';
  const pinnedCategoryByDimension = useMemo(() => {
    const out: Record<string, string> = {};
    for (const d of pinnableDims) {
      const v = effectivePin(d.id);
      if (v !== '') out[d.id] = v;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinnableDims, pins, filterPins]);

  const plan = useMemo<ImportPlan | null>(() => {
    if (!matrix || !detected || metricId === '' || mappedDimCount === 0) return null;
    return buildImportPlan(matrix, detected, schema, mapping, {
      pinnedCategoryByDimension,
      metricId,
    });
  }, [matrix, detected, schema, mapping, pinnedCategoryByDimension, metricId, mappedDimCount]);

  const triage = useMemo(
    () => (plan ? collectTriageItems(plan, planDimensions) : []),
    [plan, planDimensions]
  );

  const resolutionFor = (item: TriageItem): LabelResolution =>
    resolutions[resolutionKey(item.dimensionId, item.label)] ?? defaultResolution(item);

  // Live tallies that reflect triage decisions (the plan's own counts predate them).
  const newCategoryCount = triage.filter((it) => resolutionFor(it).kind === 'create').length;
  const discardCount = triage.filter((it) => resolutionFor(it).kind === 'discard').length;

  const allPinned = pinnableDims.every((d) => effectivePin(d.id) !== '');
  const canCommit =
    !committing && plan !== null && metricId !== '' && mappedDimCount > 0 && allPinned;

  function setColumnDimension(col: number, dimId: string) {
    setMapping((prev) => {
      const next: Record<number, string> = {};
      // Keep other columns, but ensure a dimension maps to at most one column.
      for (const [c, d] of Object.entries(prev.dimensionByColumn)) {
        if (Number(c) === col) continue;
        if (dimId !== IGNORE && d === dimId) continue;
        next[Number(c)] = d;
      }
      if (dimId !== IGNORE) next[col] = dimId;
      return { dimensionByColumn: next };
    });
  }

  function setResolution(item: TriageItem, res: LabelResolution) {
    setResolutions((prev) => ({ ...prev, [resolutionKey(item.dimensionId, item.label)]: res }));
  }

  function handleImport() {
    if (!canCommit || !matrix || !detected) return;
    const effective: Record<string, LabelResolution> = {};
    for (const it of triage) {
      effective[resolutionKey(it.dimensionId, it.label)] = resolutionFor(it);
    }
    onCommit({
      matrix,
      detected,
      mapping,
      pinnedCategoryByDimension,
      metricId,
      resolutions: effective,
      triage,
    });
  }

  const years = detected?.yearColumns.map((y) => y.year) ?? [];

  return (
    <Dialog open={open} onClose={committing ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{t('import-title')}</DialogTitle>
      <DialogContent dividers>
        {!detected ? (
          <Typography color="text.secondary">{t('import-no-data')}</Typography>
        ) : (
          <Stack spacing={3}>
            {/* Structure */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('import-detected')}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={t('import-data-rows', { count: detected.dataRowIndices.length })}
                />
                <Chip
                  size="small"
                  label={
                    years.length > 0
                      ? t('import-years-range', {
                          first: years[0],
                          last: years[years.length - 1],
                          count: years.length,
                        })
                      : t('import-no-years')
                  }
                />
              </Stack>
            </Box>

            {/* Mapping */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('datasets-columns')}
              </Typography>
              <Stack spacing={1.5}>
                {detected.textColumns.map((col, i) => (
                  <Stack key={col} direction="row" spacing={2} alignItems="center">
                    <Typography sx={{ minWidth: 180 }} variant="body2">
                      {detected.textColumnHeaders[i] || (
                        <em>{t('import-column-n', { number: col + 1 })}</em>
                      )}
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <InputLabel>{t('import-maps-to-dimension')}</InputLabel>
                      <Select
                        label={t('import-maps-to-dimension')}
                        value={mapping.dimensionByColumn[col] ?? IGNORE}
                        onChange={(e) => setColumnDimension(col, e.target.value)}
                      >
                        <MenuItem value={IGNORE}>
                          <em>{t('import-ignore-column')}</em>
                        </MenuItem>
                        {planDimensions.map((d) => (
                          <MenuItem key={d.id} value={d.id}>
                            {d.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                ))}
                {mappedDimCount === 0 && (
                  <Alert severity="warning">{t('import-map-one-warning')}</Alert>
                )}
              </Stack>
            </Box>

            {/* Fixed pins for dimensions absent from the paste + metric */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('import-applies-to')}
              </Typography>
              <Stack spacing={1.5}>
                <FormControl size="small" sx={{ minWidth: 260 }}>
                  <InputLabel>{t('datasets-metric')}</InputLabel>
                  <Select
                    label={t('datasets-metric')}
                    value={metricId}
                    onChange={(e) => setMetricId(e.target.value)}
                  >
                    {dataset.metrics.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.unit ? `${m.label} (${m.unit})` : m.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {pinnableDims.map((d) => {
                  const isFromFilter = pins[d.id] === undefined && filterPins[d.id] !== undefined;
                  return (
                    <Stack key={d.id} direction="row" spacing={2} alignItems="center">
                      <Typography sx={{ minWidth: 180 }} variant="body2">
                        {d.label}
                      </Typography>
                      <FormControl
                        size="small"
                        sx={{ minWidth: 220 }}
                        error={effectivePin(d.id) === ''}
                      >
                        <InputLabel>{t('import-category')}</InputLabel>
                        <Select
                          label={t('import-category')}
                          value={effectivePin(d.id)}
                          onChange={(e) => setPins((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        >
                          {d.categories.map((c) => (
                            <MenuItem key={c.uuid} value={c.uuid}>
                              {c.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {isFromFilter && (
                        <Chip
                          size="small"
                          color="info"
                          variant="outlined"
                          label={t('import-from-filter')}
                        />
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </Box>

            {/* Preview */}
            {plan && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('import-preview')}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    size="small"
                    color="success"
                    label={t('import-matched', { count: plan.counts.greenRows })}
                  />
                  {plan.counts.yellowRows > 0 && (
                    <Chip
                      size="small"
                      color="warning"
                      label={t('import-fuzzy', { count: plan.counts.yellowRows })}
                    />
                  )}
                  {plan.counts.redRows > 0 && (
                    <Chip
                      size="small"
                      color="error"
                      label={t('import-unmatched', { count: plan.counts.redRows })}
                    />
                  )}
                  <Chip
                    size="small"
                    variant="outlined"
                    label={t('import-values-to-add', { count: plan.counts.cellsToCreate })}
                  />
                  {plan.counts.cellsToOverwrite > 0 && (
                    <Chip
                      size="small"
                      color="warning"
                      label={t('import-values-overwritten', {
                        count: plan.counts.cellsToOverwrite,
                      })}
                    />
                  )}
                  {plan.newYears.length > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={t('import-new-year-columns', { count: plan.newYears.length })}
                    />
                  )}
                  {newCategoryCount > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={t('import-new-categories', { count: newCategoryCount })}
                    />
                  )}
                  {discardCount > 0 && (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={t('import-discarded', { count: discardCount })}
                    />
                  )}
                </Stack>
              </Box>
            )}

            {/* Triage */}
            {triage.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  {t('import-needs-attention', { count: triage.length })}
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('import-pasted-label')}</TableCell>
                      <TableCell>{t('datasets-dimension')}</TableCell>
                      <TableCell>{t('import-decision')}</TableCell>
                      <TableCell>{t('import-map-to')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {triage.map((item) => {
                      const res = resolutionFor(item);
                      const dim = planDimensions.find((d) => d.id === item.dimensionId);
                      const selectedCat =
                        res.kind === 'existing'
                          ? (dim?.categories.find((c) => c.uuid === res.categoryUuid) ?? null)
                          : null;
                      return (
                        <TableRow key={resolutionKey(item.dimensionId, item.label)}>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                color={item.matchClass === 'fuzzy' ? 'warning' : 'error'}
                                label={item.label}
                              />
                            </Stack>
                          </TableCell>
                          <TableCell>{item.dimensionLabel}</TableCell>
                          <TableCell>
                            <ToggleButtonGroup
                              size="small"
                              exclusive
                              value={res.kind}
                              onChange={(_, kind: LabelResolution['kind'] | null) => {
                                if (!kind) return;
                                if (kind === 'existing') {
                                  setResolution(item, {
                                    kind: 'existing',
                                    categoryUuid: item.candidates[0]?.uuid ?? '',
                                  });
                                } else {
                                  setResolution(item, { kind });
                                }
                              }}
                            >
                              <ToggleButton value="existing">
                                {t('import-decision-map')}
                              </ToggleButton>
                              <ToggleButton value="create">{t('import-decision-new')}</ToggleButton>
                              <ToggleButton value="discard">{t('common-discard')}</ToggleButton>
                            </ToggleButtonGroup>
                          </TableCell>
                          <TableCell sx={{ minWidth: 260 }}>
                            {res.kind === 'existing' && dim && (
                              <Autocomplete
                                size="small"
                                options={dim.categories}
                                getOptionLabel={(c) => c.label}
                                isOptionEqualToValue={(a, b) => a.uuid === b.uuid}
                                value={selectedCat}
                                onChange={(_, v) =>
                                  setResolution(
                                    item,
                                    v
                                      ? { kind: 'existing', categoryUuid: v.uuid }
                                      : { kind: 'create' }
                                  )
                                }
                                renderInput={(params) => (
                                  <TextField {...params} label={t('import-existing-category')} />
                                )}
                              />
                            )}
                            {res.kind === 'create' && (
                              <Typography variant="caption" color="text.secondary">
                                {t('import-creates', { label: item.label })}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        )}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>
          {t('import-stage-hint')}
        </Typography>
        <Box>
          <Button onClick={onClose} disabled={committing}>
            {t('common-cancel')}
          </Button>
          <Button variant="contained" onClick={handleImport} disabled={!canCommit}>
            {plan
              ? t('import-stage-confirm', {
                  count: plan.counts.cellsToCreate + plan.counts.cellsToOverwrite,
                })
              : t('import-action')}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
