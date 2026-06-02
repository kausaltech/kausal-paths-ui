import { useEffect, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import { DashCircle, Hash, Plus } from 'react-bootstrap-icons';

import type {
  CreateDataSourceInput,
  DataPointCommentFieldsFragment,
  DataSourceFieldsFragment,
  DatasetDetailFieldsFragment,
  DatasetSourceReferenceFieldsFragment,
} from '@/common/__generated__/graphql';
import { extractYear } from './dataset-grid-data';

export type SelectedCell = {
  year: number;
  metricLabel: string;
  metricUnit: string;
  categoryLabels: readonly string[];
  value: number | null;
};

// A data point comment paired with the id of the data point it belongs to.
export type CommentWithDataPoint = DataPointCommentFieldsFragment & { dataPointId: string };

export type AddCommentInput = {
  text: string;
  isReview: boolean;
};

// Softer pastel backgrounds for the cell-identifier chips. Default text
// colour stays dark enough to be readable on all three.
const YEAR_CHIP_BG = '#dcfce7'; // light green
const METRIC_CHIP_BG = '#dbeafe'; // light blue
const CATEGORY_CHIP_BG = '#fee2e2'; // light salmon

export function SelectedDataPointChips({ cell }: { cell: SelectedCell }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
      <Chip size="small" label={cell.year} sx={{ bgcolor: YEAR_CHIP_BG }} />
      <Chip
        size="small"
        label={cell.metricUnit ? `${cell.metricLabel} (${cell.metricUnit})` : cell.metricLabel}
        sx={{ bgcolor: METRIC_CHIP_BG }}
      />
      {cell.categoryLabels.map((label, i) => (
        <Chip key={`${i}-${label}`} size="small" label={label} sx={{ bgcolor: CATEGORY_CHIP_BG }} />
      ))}
      {cell.value != null && (
        <Chip
          size="small"
          icon={<Hash size={14} />}
          label={cell.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}
          variant="outlined"
        />
      )}
    </Box>
  );
}

export function resolveSelectedCell(
  dataset: DatasetDetailFieldsFragment,
  dataPointId: string
): SelectedCell | null {
  const dp = dataset.dataPoints.find((d) => d.id === dataPointId);
  if (!dp) return null;
  const year = extractYear(dp.date);
  const metric = dataset.metrics.find((m) => m.id === dp.metric.id);
  const dpCatUuids = new Set(dp.dimensionCategories.map((c) => c.uuid));
  const categoryLabels: string[] = [];
  for (const dim of dataset.dimensions) {
    for (const cat of dim.categories) {
      if (dpCatUuids.has(cat.uuid)) {
        categoryLabels.push(cat.label);
        break;
      }
    }
  }
  return {
    year,
    metricLabel: metric?.label ?? dp.metric.id,
    metricUnit: metric?.unit ?? '',
    categoryLabels,
    value: dp.value,
  };
}

export function getUserName(
  user: { firstName: string; lastName: string; email: string } | null,
  t: ReturnType<typeof useTranslations>
): string {
  if (!user) return t('common-unknown');
  const full = `${user.firstName} ${user.lastName}`.trim();
  return full || user.email;
}

export function formatCommentDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Backend's UserModifiableModel sets `created_at` (auto_now_add) and
// `last_modified_at` (auto_now) on the same .save(), but each evaluates
// timezone.now() independently — so they always differ by microseconds.
// Only treat the comment as edited if the gap is at least one second.
export function isCommentEdited(createdAt: string, lastModifiedAt: string): boolean {
  return new Date(lastModifiedAt).getTime() - new Date(createdAt).getTime() >= 1000;
}

// A single attached data source reference card with a detach control. Shared by
// the dataset-scope sources panel and the per-data-point sources section.
export function SourceReferenceCard({
  reference: r,
  onDetach,
  detaching,
}: {
  reference: DatasetSourceReferenceFieldsFragment;
  onDetach: () => void;
  detaching: boolean;
}) {
  const t = useTranslations('model-editor');
  const ds = r.dataSource;
  const meta = [ds.authority, ds.edition].filter((s): s is string => Boolean(s));
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Typography variant="subtitle2">{ds.name}</Typography>
          <Tooltip title={t('datasets-detach-data-source')}>
            <span>
              <IconButton
                size="small"
                onClick={onDetach}
                disabled={detaching}
                aria-label={t('datasets-detach-data-source')}
              >
                <DashCircle size={14} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
        {meta.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {meta.join(' · ')}
          </Typography>
        )}
        {ds.description && (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {ds.description}
          </Typography>
        )}
        {ds.url && (
          <Typography variant="caption">
            <a href={ds.url} target="_blank" rel="noreferrer">
              {ds.url}
            </a>
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
          {t('datasets-attached-by', {
            name: getUserName(r.createdBy ?? null, t),
            date: formatCommentDate(r.createdAt),
          })}
        </Typography>
      </Stack>
    </Paper>
  );
}

export function DefineDataSourceDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateDataSourceInput) => Promise<void>;
}) {
  const t = useTranslations('model-editor');
  const [name, setName] = useState('');
  const [authority, setAuthority] = useState('');
  const [edition, setEdition] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset every time the dialog opens — otherwise stale values from the
  // previous session would linger.
  useEffect(() => {
    if (open) {
      setName('');
      setAuthority('');
      setEdition('');
      setUrl('');
      setDescription('');
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate({
        name: name.trim(),
        authority: authority.trim() || null,
        edition: edition.trim() || null,
        url: url.trim() || null,
        description: description.trim() || null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('datasets-define-data-source-title')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={t('datasets-name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            size="small"
            autoFocus
            disabled={submitting}
          />
          <TextField
            label={t('datasets-authority')}
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
            fullWidth
            size="small"
            disabled={submitting}
            helperText={t('datasets-authority-helper')}
          />
          <TextField
            label={t('datasets-edition')}
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
            fullWidth
            size="small"
            disabled={submitting}
            helperText={t('datasets-edition-helper')}
          />
          <TextField
            label={t('datasets-url')}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            size="small"
            type="url"
            disabled={submitting}
          />
          <TextField
            label={t('datasets-description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            size="small"
            disabled={submitting}
          />
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          {t('common-cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={submitting || !name.trim()}
        >
          {submitting ? t('common-creating') : t('common-create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Self-contained "attach a data source" control: a toggle button, a collapsible
// picker form, and the "define new source" dialog. Used at both dataset scope
// and data-point scope; the caller supplies the attach target via `onAttach`
// and the already-attached ids (greyed out in the picker) via `attachedIds`.
export function AttachSourceForm({
  availableDataSources,
  attachedIds,
  onAttach,
  onCreateDataSource,
}: {
  availableDataSources: readonly DataSourceFieldsFragment[];
  attachedIds: Set<string>;
  onAttach: (dataSourceId: string) => Promise<void>;
  onCreateDataSource: (input: CreateDataSourceInput) => Promise<DataSourceFieldsFragment>;
}) {
  const t = useTranslations('model-editor');
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<DataSourceFieldsFragment | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defineOpen, setDefineOpen] = useState(false);

  const reset = () => {
    setOpen(false);
    setPicked(null);
    setError(null);
  };

  const handleAttach = async () => {
    if (!picked || attaching) return;
    setAttaching(true);
    setError(null);
    try {
      await onAttach(picked.id);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAttaching(false);
    }
  };

  return (
    <>
      <Button
        size="small"
        startIcon={<Plus />}
        variant={open ? 'outlined' : 'text'}
        onClick={() => setOpen((v) => !v)}
      >
        {t('datasets-attach-data-source')}
      </Button>
      <Collapse in={open} unmountOnExit>
        <Paper variant="outlined" sx={{ p: 2, mt: 1, mb: 1.5 }}>
          <Stack spacing={1.5}>
            <Autocomplete
              size="small"
              options={availableDataSources}
              value={picked}
              onChange={(_, v) => setPicked(v)}
              getOptionLabel={(o) => o.label || o.name}
              isOptionEqualToValue={(o, v) => o.id === v.id}
              getOptionDisabled={(o) => attachedIds.has(o.id)}
              renderOption={(props, o) => {
                const isAttached = attachedIds.has(o.id);
                return (
                  <li {...props} key={o.id}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{ width: '100%' }}
                    >
                      <span>{o.label || o.name}</span>
                      {isAttached && (
                        <Typography variant="caption" color="text.secondary">
                          {t('datasets-already-in-use')}
                        </Typography>
                      )}
                    </Stack>
                  </li>
                );
              }}
              disabled={attaching}
              renderInput={(params) => (
                <TextField {...params} label={t('datasets-data-source')} autoFocus />
              )}
              noOptionsText={t('datasets-no-data-sources-available')}
            />
            <Button
              size="small"
              variant="text"
              startIcon={<Plus />}
              onClick={() => setDefineOpen(true)}
              disabled={attaching}
              sx={{ alignSelf: 'flex-start' }}
            >
              {t('datasets-define-new')}
            </Button>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button size="small" variant="text" onClick={reset} disabled={attaching}>
                {t('common-cancel')}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => void handleAttach()}
                disabled={attaching || !picked}
              >
                {attaching ? t('common-saving') : t('common-attach')}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>
      <DefineDataSourceDialog
        open={defineOpen}
        onClose={() => setDefineOpen(false)}
        onCreate={async (input) => {
          const created = await onCreateDataSource(input);
          // Preselect the newly created source so the user can hit "Attach"
          // straight away. Also opens the picker if it wasn't already.
          setPicked(created);
          setOpen(true);
        }}
      />
    </>
  );
}
