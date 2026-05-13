import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useMutation, useQuery } from '@apollo/client/react';
import {
  ArrowLeft,
  Bookmarks,
  CaretDownFill,
  CaretRightFill,
  ChatLeft,
  CheckCircle,
  DashCircle,
  Hash,
  Link45deg,
  PencilSquare,
  Plus,
  Sliders,
  Trash,
} from 'react-bootstrap-icons';

import type {
  CreateDataPointCommentMutation,
  CreateDataPointCommentMutationVariables,
  CreateDataSourceInput,
  CreateDataSourceMutation,
  CreateDataSourceMutationVariables,
  CreateSourceReferenceMutation,
  CreateSourceReferenceMutationVariables,
  DataPointCommentFieldsFragment,
  DataSourceFieldsFragment,
  DatasetConnectedNodesQuery,
  DatasetConnectedNodesQueryVariables,
  DatasetDetailFieldsFragment,
  DatasetSourceReferenceFieldsFragment,
  DeleteSourceReferenceMutation,
  DeleteSourceReferenceMutationVariables,
  InstanceDatasetQuery,
  ResolveDataPointCommentMutation,
  ResolveDataPointCommentMutationVariables,
  UnresolveDataPointCommentMutation,
  UnresolveDataPointCommentMutationVariables,
} from '@/common/__generated__/graphql';
import { DataPointCommentReviewState } from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import GraphQLError from '@/components/common/GraphQLError';
import { getNodeStyle } from '../ElkNode';
import { ConnectedNodeChip } from '../node-details/shared';
import DatasetDataGrid from './DatasetDataGrid';
import { extractYear } from './dataset-grid-data';
import {
  CREATE_DATA_POINT_COMMENT,
  CREATE_DATA_SOURCE,
  CREATE_SOURCE_REFERENCE,
  DELETE_SOURCE_REFERENCE,
  GET_DATASET_CONNECTED_NODES,
  GET_INSTANCE_DATASET,
  RESOLVE_DATA_POINT_COMMENT,
  UNRESOLVE_DATA_POINT_COMMENT,
} from './queries';

type Props = {
  datasetId: string;
};

type MetricRow = DatasetDetailFieldsFragment['metrics'][number];
type DimensionRow = DatasetDetailFieldsFragment['dimensions'][number];
type CategoryRow = DimensionRow['categories'][number];

function CategoryChip({ cat, used }: { cat: CategoryRow; used: boolean }) {
  return (
    <Tooltip title={used ? 'Used by data points' : 'Not used by any data point'}>
      <Chip
        label={cat.label}
        size="small"
        variant={used ? 'filled' : 'outlined'}
        color={used ? 'primary' : 'default'}
        sx={used ? undefined : { opacity: 0.6 }}
      />
    </Tooltip>
  );
}

function DimensionCategories({
  dim,
  usedCategoryUuids,
}: {
  dim: DimensionRow;
  usedCategoryUuids: Set<string>;
}) {
  const [showUnused, setShowUnused] = useState(false);
  const used = dim.categories.filter((c) => usedCategoryUuids.has(c.uuid));
  const unused = dim.categories.filter((c) => !usedCategoryUuids.has(c.uuid));

  return (
    <Stack spacing={1}>
      {used.length > 0 ? (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {used.map((cat) => (
            <CategoryChip key={cat.uuid} cat={cat} used />
          ))}
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary">
          No categories used by any data point.
        </Typography>
      )}
      {unused.length > 0 && (
        <>
          <Button
            size="small"
            onClick={() => setShowUnused((v) => !v)}
            startIcon={showUnused ? <CaretDownFill /> : <CaretRightFill />}
            sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
          >
            {showUnused ? 'Hide' : 'Show'} unused ({unused.length})
          </Button>
          <Collapse in={showUnused} unmountOnExit>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {unused.map((cat) => (
                <CategoryChip key={cat.uuid} cat={cat} used={false} />
              ))}
            </Box>
          </Collapse>
        </>
      )}
    </Stack>
  );
}

function getUserName(user: { firstName: string; lastName: string; email: string } | null): string {
  if (!user) return 'Unknown';
  const full = `${user.firstName} ${user.lastName}`.trim();
  return full || user.email;
}

function formatCommentDate(iso: string): string {
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
function isCommentEdited(createdAt: string, lastModifiedAt: string): boolean {
  return new Date(lastModifiedAt).getTime() - new Date(createdAt).getTime() >= 1000;
}

type SelectedCell = {
  year: number;
  metricLabel: string;
  metricUnit: string;
  categoryLabels: readonly string[];
  value: number | null;
};

// Softer pastel backgrounds for the cell-identifier chips. Default text
// colour stays dark enough to be readable on all three.
const YEAR_CHIP_BG = '#dcfce7'; // light green
const METRIC_CHIP_BG = '#dbeafe'; // light blue
const CATEGORY_CHIP_BG = '#fee2e2'; // light salmon

function SelectedDataPointChips({ cell }: { cell: SelectedCell }) {
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

function resolveSelectedCell(
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

type CommentWithDataPoint = DataPointCommentFieldsFragment & { dataPointId: string };

export type AddCommentInput = {
  text: string;
  isReview: boolean;
};

function CommentsPanel({
  comments,
  selectedDataPointId,
  selectedCell,
  onSubmitComment,
  onSetResolved,
  onClearSelection,
}: {
  comments: readonly CommentWithDataPoint[];
  selectedDataPointId: string | null;
  selectedCell: SelectedCell | null;
  onSubmitComment: (dataPointId: string, input: AddCommentInput) => Promise<void>;
  onSetResolved: (commentId: string, resolved: boolean) => Promise<void>;
  onClearSelection: () => void;
}) {
  const hasSelection = selectedDataPointId !== null;
  const visibleComments = hasSelection
    ? comments.filter((c) => c.dataPointId === selectedDataPointId)
    : comments;
  const heading = hasSelection ? 'Comments on datapoint' : 'All comments in dataset';

  const [formOpen, setFormOpen] = useState(false);
  const [text, setText] = useState('');
  const [isReview, setIsReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Per-comment busy state while a resolve/unresolve mutation is in flight,
  // so multiple comments can be toggled independently.
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(() => new Set());

  // Close & reset the form when the selection changes — the form targets a
  // specific data point, so silently re-pointing it would be confusing.
  useEffect(() => {
    setFormOpen(false);
    setText('');
    setIsReview(false);
    setSubmitError(null);
  }, [selectedDataPointId]);

  const handleSubmit = async () => {
    if (selectedDataPointId === null || text.trim() === '' || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitComment(selectedDataPointId, { text: text.trim(), isReview });
      setFormOpen(false);
      setText('');
      setIsReview(false);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolved = async (commentId: string, resolved: boolean) => {
    if (resolvingIds.has(commentId)) return;
    setResolvingIds((prev) => new Set(prev).add(commentId));
    try {
      await onSetResolved(commentId, resolved);
    } catch {
      // Swallow — the Apollo cache won't update, so the checkbox snaps back.
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  const addButton = (
    <Button
      fullWidth
      variant={formOpen ? 'outlined' : 'contained'}
      size="small"
      startIcon={<Plus />}
      disabled={!hasSelection}
      onClick={() => setFormOpen((v) => !v)}
      sx={{ mb: formOpen ? 1 : 2 }}
    >
      {hasSelection ? 'Comment this datapoint' : 'Select a datapoint to comment'}
    </Button>
  );

  const form = (
    <Collapse in={formOpen && hasSelection} unmountOnExit>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack spacing={1.5}>
          <TextField
            label="Comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            size="small"
            autoFocus
            disabled={submitting}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={isReview}
                onChange={(e) => setIsReview(e.target.checked)}
                disabled={submitting}
              />
            }
            label="Needs review"
          />
          {submitError && (
            <Alert severity="error" onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              variant="text"
              onClick={() => {
                setFormOpen(false);
                setText('');
                setIsReview(false);
                setSubmitError(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => void handleSubmit()}
              disabled={submitting || text.trim() === ''}
            >
              {submitting ? 'Saving…' : 'Submit'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Collapse>
  );

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6">
          {heading}{' '}
          <Typography component="span" variant="body2" color="text.secondary">
            ({visibleComments.length})
          </Typography>
        </Typography>
        {hasSelection && (
          <Button size="small" variant="text" onClick={onClearSelection}>
            Show all
          </Button>
        )}
      </Stack>
      {selectedCell && <SelectedDataPointChips cell={selectedCell} />}
      {addButton}
      {form}
      {visibleComments.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {hasSelection
            ? 'No comments on the selected data point yet.'
            : 'No comments on any data point yet.'}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {visibleComments.map((c) => {
            const resolved = c.reviewState === DataPointCommentReviewState.Resolved;
            const isResolving = resolvingIds.has(c.id);
            const needsReview = c.isReview && !resolved;
            return (
              <Paper
                key={c.id}
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: needsReview ? 'warning.lighter' : undefined,
                  borderColor: needsReview ? 'warning.light' : undefined,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">{getUserName(c.createdBy ?? null)}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                  {c.text}
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    {formatCommentDate(c.createdAt)}
                    {isCommentEdited(c.createdAt, c.lastModifiedAt) && ' · edited'}
                  </Typography>
                  {c.isReview && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={resolved}
                          disabled={isResolving}
                          onChange={(e) => {
                            void handleToggleResolved(c.id, e.target.checked);
                          }}
                          icon={<CheckCircle size={14} />}
                          checkedIcon={<CheckCircle size={14} />}
                        />
                      }
                      label={
                        <Typography variant="caption">
                          {resolved ? 'Resolved' : 'Resolve'}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  )}
                </Stack>
                {resolved && c.resolvedAt && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'right', mt: 0.25 }}
                  >
                    by {getUserName(c.resolvedBy ?? null)} · {formatCommentDate(c.resolvedAt)}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </>
  );
}

function DefineDataSourceDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateDataSourceInput) => Promise<void>;
}) {
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
      <DialogTitle>Define a new data source</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
            size="small"
            autoFocus
            disabled={submitting}
          />
          <TextField
            label="Authority"
            value={authority}
            onChange={(e) => setAuthority(e.target.value)}
            fullWidth
            size="small"
            disabled={submitting}
            helperText="Publisher / agency behind the source (optional)."
          />
          <TextField
            label="Edition"
            value={edition}
            onChange={(e) => setEdition(e.target.value)}
            fullWidth
            size="small"
            disabled={submitting}
            helperText="Version, year, or release identifier (optional)."
          />
          <TextField
            label="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            size="small"
            type="url"
            disabled={submitting}
          />
          <TextField
            label="Description"
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
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={submitting || !name.trim()}
        >
          {submitting ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SourceReferenceCard({
  reference: r,
  onDetach,
  detaching,
}: {
  reference: DatasetSourceReferenceFieldsFragment;
  onDetach: () => void;
  detaching: boolean;
}) {
  const ds = r.dataSource;
  const meta = [ds.authority, ds.edition].filter((s): s is string => Boolean(s));
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Typography variant="subtitle2">{ds.name}</Typography>
          <Tooltip title="Detach data source">
            <span>
              <IconButton
                size="small"
                onClick={onDetach}
                disabled={detaching}
                aria-label="Detach data source"
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
          attached by {getUserName(r.createdBy ?? null)} · {formatCommentDate(r.createdAt)}
        </Typography>
      </Stack>
    </Paper>
  );
}

function SourcesPanel({
  refs,
  availableDataSources,
  selectedDataPointId,
  selectedCell,
  onAttachToDataset,
  onDetach,
  onCreateDataSource,
  onClearSelection,
}: {
  refs: readonly DatasetSourceReferenceFieldsFragment[];
  availableDataSources: readonly DataSourceFieldsFragment[];
  selectedDataPointId: string | null;
  selectedCell: SelectedCell | null;
  onAttachToDataset: (dataSourceId: string) => Promise<void>;
  onDetach: (referenceId: string) => Promise<void>;
  onCreateDataSource: (input: CreateDataSourceInput) => Promise<DataSourceFieldsFragment>;
  onClearSelection: () => void;
}) {
  const hasSelection = selectedDataPointId !== null;
  const datasetScopeRefs = refs.filter((r) => r.dataPoint === null);
  const dataPointRefs = refs.filter((r) => r.dataPoint !== null);
  const selectedRefs = hasSelection
    ? dataPointRefs.filter((r) => r.dataPoint?.id === selectedDataPointId)
    : dataPointRefs;
  const heading = hasSelection ? 'Sources on datapoint' : 'Data sources';
  const visibleCount = hasSelection
    ? selectedRefs.length
    : datasetScopeRefs.length + dataPointRefs.length;

  // Dataset-scope attach form. Kept inside the panel so it stays simple;
  // hidden whenever a cell is selected because the form targets the dataset,
  // not a data point.
  const [attachOpen, setAttachOpen] = useState(false);
  const [pickedSource, setPickedSource] = useState<DataSourceFieldsFragment | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const resetAttachForm = () => {
    setAttachOpen(false);
    setPickedSource(null);
    setAttachError(null);
  };
  const handleAttach = async () => {
    if (!pickedSource || attaching) return;
    setAttaching(true);
    setAttachError(null);
    try {
      await onAttachToDataset(pickedSource.id);
      resetAttachForm();
    } catch (e) {
      setAttachError(e instanceof Error ? e.message : String(e));
    } finally {
      setAttaching(false);
    }
  };

  // dataSource ids already attached at dataset scope — used to grey out
  // those options in the picker (the backend would also reject duplicates,
  // but disabling them upfront is a clearer signal).
  const datasetScopeAttachedIds = useMemo(
    () => new Set(datasetScopeRefs.map((r) => r.dataSource.id)),
    [datasetScopeRefs]
  );

  // "Define new" dialog state. On success we auto-select the new source in
  // the picker; the parent's cache update inserts it into availableDataSources.
  const [defineDialogOpen, setDefineDialogOpen] = useState(false);

  // Per-ref busy state so multiple detach actions can be in flight.
  const [detachingIds, setDetachingIds] = useState<Set<string>>(() => new Set());
  const handleDetach = async (referenceId: string) => {
    if (detachingIds.has(referenceId)) return;
    setDetachingIds((prev) => new Set(prev).add(referenceId));
    try {
      await onDetach(referenceId);
    } catch {
      // Swallow — the card stays in the list until the cache is updated.
    } finally {
      setDetachingIds((prev) => {
        const next = new Set(prev);
        next.delete(referenceId);
        return next;
      });
    }
  };
  const renderCard = (r: DatasetSourceReferenceFieldsFragment) => (
    <SourceReferenceCard
      key={r.id}
      reference={r}
      onDetach={() => void handleDetach(r.id)}
      detaching={detachingIds.has(r.id)}
    />
  );

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">
          {heading}{' '}
          <Typography component="span" variant="body2" color="text.secondary">
            ({visibleCount})
          </Typography>
        </Typography>
        {hasSelection && (
          <Button size="small" variant="text" onClick={onClearSelection}>
            Show all
          </Button>
        )}
      </Stack>
      {selectedCell && <SelectedDataPointChips cell={selectedCell} />}

      {hasSelection ? (
        selectedRefs.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No sources attached to this data point.
          </Typography>
        ) : (
          <Stack spacing={1.5}>{selectedRefs.map((r) => renderCard(r))}</Stack>
        )
      ) : (
        <Stack spacing={3}>
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2">
                Attached to the dataset{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  ({datasetScopeRefs.length})
                </Typography>
              </Typography>
              <Button
                size="small"
                startIcon={<Plus />}
                variant={attachOpen ? 'outlined' : 'text'}
                onClick={() => setAttachOpen((v) => !v)}
              >
                Set data source
              </Button>
            </Stack>
            <Collapse in={attachOpen} unmountOnExit>
              <Paper variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                <Stack spacing={1.5}>
                  <Autocomplete
                    size="small"
                    options={availableDataSources}
                    value={pickedSource}
                    onChange={(_, v) => setPickedSource(v)}
                    getOptionLabel={(o) => o.label || o.name}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    getOptionDisabled={(o) => datasetScopeAttachedIds.has(o.id)}
                    renderOption={(props, o) => {
                      const isAttached = datasetScopeAttachedIds.has(o.id);
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
                                already in use
                              </Typography>
                            )}
                          </Stack>
                        </li>
                      );
                    }}
                    disabled={attaching}
                    renderInput={(params) => (
                      <TextField {...params} label="Data source" autoFocus />
                    )}
                    noOptionsText="No data sources defined in this instance yet."
                  />
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Plus />}
                    onClick={() => setDefineDialogOpen(true)}
                    disabled={attaching}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Define new
                  </Button>
                  {attachError && (
                    <Alert severity="error" onClose={() => setAttachError(null)}>
                      {attachError}
                    </Alert>
                  )}
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="text"
                      onClick={resetAttachForm}
                      disabled={attaching}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => void handleAttach()}
                      disabled={attaching || !pickedSource}
                    >
                      {attaching ? 'Saving…' : 'Attach'}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Collapse>
            {datasetScopeRefs.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No sources attached to the dataset.
              </Typography>
            ) : (
              <Stack spacing={1.5}>{datasetScopeRefs.map((r) => renderCard(r))}</Stack>
            )}
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Attached to data points{' '}
              <Typography component="span" variant="caption" color="text.secondary">
                ({dataPointRefs.length})
              </Typography>
            </Typography>
            {dataPointRefs.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                No sources attached to any data point.
              </Typography>
            ) : (
              <Stack spacing={1.5}>{dataPointRefs.map((r) => renderCard(r))}</Stack>
            )}
          </Box>
        </Stack>
      )}
      <DefineDataSourceDialog
        open={defineDialogOpen}
        onClose={() => setDefineDialogOpen(false)}
        onCreate={async (input) => {
          const created = await onCreateDataSource(input);
          // Preselect the newly created source so the user can hit "Attach"
          // straight away. Also opens the attach form if it wasn't already.
          setPickedSource(created);
          setAttachOpen(true);
        }}
      />
    </>
  );
}

function getListBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model/datasets' : '/model/datasets';
}

function getModelEditorBase(pathname: string): string {
  const idx = pathname.indexOf('/model');
  return idx >= 0 ? pathname.slice(0, idx) + '/model' : '/model';
}

/** Topologically sort metrics by previousSibling/nextSibling linked list. */
function sortMetricsBySiblings(metrics: readonly MetricRow[]): MetricRow[] {
  if (metrics.length === 0) return [];
  const byId = new Map(metrics.map((m) => [m.id, m]));
  // Find the head: a metric no other metric points to as its nextSibling.
  const pointedToAsNext = new Set(
    metrics.map((m) => m.previousSibling).filter((id): id is string => id !== null)
  );
  const heads = metrics.filter((m) => m.previousSibling === null || !byId.has(m.previousSibling));
  const head = heads.find((m) => !pointedToAsNext.has(m.id)) ?? heads[0] ?? metrics[0];

  const sorted: MetricRow[] = [];
  const visited = new Set<string>();
  let current: MetricRow | undefined = head;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    sorted.push(current);
    current = current.nextSibling ? byId.get(current.nextSibling) : undefined;
  }
  // Any metrics not reached by the walk (orphans / broken links) — append in insertion order.
  for (const m of metrics) {
    if (!visited.has(m.id)) sorted.push(m);
  }
  return sorted;
}

export default function DatasetEditor({ datasetId }: Props) {
  const { data, loading, error, refetch } = useQuery<InstanceDatasetQuery>(GET_INSTANCE_DATASET, {
    fetchPolicy: 'cache-and-network',
  });
  const instance = useInstance();
  const [createComment] = useMutation<
    CreateDataPointCommentMutation,
    CreateDataPointCommentMutationVariables
  >(CREATE_DATA_POINT_COMMENT);
  const [resolveComment] = useMutation<
    ResolveDataPointCommentMutation,
    ResolveDataPointCommentMutationVariables
  >(RESOLVE_DATA_POINT_COMMENT);
  const [unresolveComment] = useMutation<
    UnresolveDataPointCommentMutation,
    UnresolveDataPointCommentMutationVariables
  >(UNRESOLVE_DATA_POINT_COMMENT);
  const [createSourceReference] = useMutation<
    CreateSourceReferenceMutation,
    CreateSourceReferenceMutationVariables
  >(CREATE_SOURCE_REFERENCE);
  const [deleteSourceReference] = useMutation<
    DeleteSourceReferenceMutation,
    DeleteSourceReferenceMutationVariables
  >(DELETE_SOURCE_REFERENCE);
  const [createDataSource] = useMutation<
    CreateDataSourceMutation,
    CreateDataSourceMutationVariables
  >(CREATE_DATA_SOURCE);
  const router = useRouter();
  const pathname = usePathname();
  const listBase = getListBase(pathname);
  const modelEditorBase = getModelEditorBase(pathname);

  const dataset = useMemo(
    () => data?.instance.editor?.datasets.find((d) => d.id === datasetId) ?? null,
    [data, datasetId]
  );

  const [name, setName] = useState('');
  const [syncedName, setSyncedName] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<'details' | 'comments' | 'sources' | null>(null);
  const [selectedDataPointId, setSelectedDataPointId] = useState<string | null>(null);
  // Bumped to ask DatasetDataGrid to clear its internal cell selection (so
  // "Show all" in the comments panel also drops the visual cell highlight).
  const [clearSelectionNonce, setClearSelectionNonce] = useState(0);
  const drawerOpen = openPanel !== null;
  const DETAILS_WIDTH = 420;

  const commentsWithDataPoint = useMemo<CommentWithDataPoint[]>(() => {
    if (!dataset) return [];
    const all: CommentWithDataPoint[] = [];
    for (const dp of dataset.dataPoints) {
      for (const c of dp.comments) all.push({ ...c, dataPointId: dp.id });
    }
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all;
  }, [dataset]);

  const sourceReferences = useMemo<readonly DatasetSourceReferenceFieldsFragment[]>(
    () => dataset?.sourceReferences ?? [],
    [dataset]
  );
  const availableDataSources = useMemo<readonly DataSourceFieldsFragment[]>(
    () => data?.instance.editor?.dataSources ?? [],
    [data]
  );
  const selectedCell = useMemo<SelectedCell | null>(
    () =>
      dataset && selectedDataPointId ? resolveSelectedCell(dataset, selectedDataPointId) : null,
    [dataset, selectedDataPointId]
  );

  // Sync local editable name with the fetched dataset whenever it changes.
  if (dataset && dataset.name !== syncedName) {
    setSyncedName(dataset.name);
    setName(dataset.name);
  }

  const sortedMetrics = useMemo(
    () => (dataset ? sortMetricsBySiblings(dataset.metrics) : []),
    [dataset]
  );

  const usedCategoryUuids = useMemo(() => {
    const used = new Set<string>();
    if (!dataset) return used;
    for (const dp of dataset.dataPoints) {
      for (const cat of dp.dimensionCategories) used.add(cat.uuid);
    }
    return used;
  }, [dataset]);

  const connectedNodeIds = useMemo(() => {
    if (!dataset) return [] as string[];
    const ids = new Set<string>();
    for (const binding of dataset.portBindings) ids.add(binding.nodeRef.nodeId);
    return [...ids];
  }, [dataset]);
  const connectedNodeCount = connectedNodeIds.length;

  const { data: connectedNodesData } = useQuery<
    DatasetConnectedNodesQuery,
    DatasetConnectedNodesQueryVariables
  >(GET_DATASET_CONNECTED_NODES, {
    variables: { ids: connectedNodeIds },
    skip: connectedNodeIds.length === 0,
    fetchPolicy: 'cache-and-network',
  });
  const connectedNodes = connectedNodesData?.instance.nodes ?? [];

  if (loading && !data) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <GraphQLError error={error} />;
  if (!dataset) {
    return (
      <Box sx={{ pt: 20, pb: 3, px: 3 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push(listBase)}>
          Back to datasets
        </Button>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Dataset not found.
        </Alert>
      </Box>
    );
  }

  const isExternal = dataset.isExternalPlaceholder;
  const nameDirty = name !== dataset.name;

  return (
    <Box sx={{ display: 'flex', width: '100%' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          height: '100vh',
          pt: 20,
          pb: 3,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          transition: (theme) =>
            theme.transitions.create('margin', {
              easing: drawerOpen
                ? theme.transitions.easing.easeOut
                : theme.transitions.easing.sharp,
              duration: drawerOpen
                ? theme.transitions.duration.enteringScreen
                : theme.transitions.duration.leavingScreen,
            }),
          marginRight: drawerOpen ? `${DETAILS_WIDTH}px` : 0,
        }}
      >
        <Button
          startIcon={<ArrowLeft />}
          onClick={() => router.push(listBase)}
          sx={{ mb: 2, alignSelf: 'flex-start' }}
        >
          Back to datasets
        </Button>

        {/* Data points */}
        <Paper
          sx={{
            p: 3,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h3">{dataset.name}</Typography>
              {dataset.identifier && (
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ fontFamily: 'monospace' }}
                >
                  {dataset.identifier}
                </Typography>
              )}
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<ChatLeft />}
                variant={openPanel === 'comments' ? 'contained' : 'text'}
                onClick={() => setOpenPanel((p) => (p === 'comments' ? null : 'comments'))}
              >
                Comments
                {commentsWithDataPoint.length > 0 && (
                  <Chip
                    label={commentsWithDataPoint.length}
                    size="small"
                    sx={{ ml: 1, height: 18, '& .MuiChip-label': { px: 0.75, fontSize: 11 } }}
                  />
                )}
              </Button>
              <Button
                startIcon={<Bookmarks />}
                variant={openPanel === 'sources' ? 'contained' : 'text'}
                onClick={() => setOpenPanel((p) => (p === 'sources' ? null : 'sources'))}
              >
                Data sources
                {sourceReferences.length > 0 && (
                  <Chip
                    label={sourceReferences.length}
                    size="small"
                    sx={{ ml: 1, height: 18, '& .MuiChip-label': { px: 0.75, fontSize: 11 } }}
                  />
                )}
              </Button>
              <Button
                startIcon={<Sliders />}
                variant={openPanel === 'details' ? 'contained' : 'text'}
                onClick={() => setOpenPanel((p) => (p === 'details' ? null : 'details'))}
              >
                Dataset details
              </Button>
            </Stack>
          </Stack>
          {isExternal ? (
            <Alert severity="info">
              This is an external placeholder dataset. Data points are stored in the external
              repository and are not editable here.
            </Alert>
          ) : (
            <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <DatasetDataGrid
                dataset={dataset}
                onMutated={() => {
                  void refetch();
                }}
                onSelectedDataPointChange={setSelectedDataPointId}
                clearSelectionNonce={clearSelectionNonce}
                onOpenPanel={setOpenPanel}
              />
            </Box>
          )}
        </Paper>
      </Box>

      <Drawer
        variant="persistent"
        anchor="right"
        open={drawerOpen}
        sx={{
          '& .MuiDrawer-paper': {
            width: DETAILS_WIDTH,
            boxSizing: 'border-box',
            height: '100vh',
            boxShadow: (theme) => theme.shadows[4],
          },
        }}
      >
        <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
          {openPanel === 'comments' ? (
            <CommentsPanel
              comments={commentsWithDataPoint}
              selectedDataPointId={selectedDataPointId}
              selectedCell={selectedCell}
              onClearSelection={() => {
                setSelectedDataPointId(null);
                setClearSelectionNonce((n) => n + 1);
              }}
              onSubmitComment={async (dataPointId, input) => {
                const result = await createComment({
                  variables: {
                    instanceId: instance.id,
                    datasetId: dataset.id,
                    dataPointId,
                    input: {
                      text: input.text,
                      isReview: input.isReview,
                      isSticky: false,
                      reviewState: input.isReview ? DataPointCommentReviewState.Unresolved : null,
                    },
                  },
                  // Append the new comment to its DataPoint's `comments` field
                  // directly in the normalised cache. Avoids refetching the
                  // whole InstanceDataset query (~48s on slow connections).
                  update: (cache, { data }) => {
                    const payload = data?.instanceEditor.datasetEditor.createDataPointComment;
                    if (payload?.__typename !== 'DataPointComment') return;
                    const dpId = cache.identify({
                      __typename: 'DataPoint',
                      id: dataPointId,
                    });
                    const commentRef = cache.identify(payload);
                    if (!dpId || !commentRef) return;
                    cache.modify({
                      id: dpId,
                      fields: {
                        comments: (existing: readonly { __ref: string }[] = []) => [
                          ...existing,
                          { __ref: commentRef },
                        ],
                      },
                    });
                  },
                });
                const payload = result.data?.instanceEditor.datasetEditor.createDataPointComment;
                if (payload?.__typename === 'OperationInfo') {
                  throw new Error(payload.messages.map((m) => m.message).join('; '));
                }
              }}
              onSetResolved={async (commentId, resolved) => {
                const variables = {
                  instanceId: instance.id,
                  datasetId: dataset.id,
                  commentId,
                };
                const payload = resolved
                  ? (await resolveComment({ variables })).data?.instanceEditor.datasetEditor
                      .resolveDataPointComment
                  : (await unresolveComment({ variables })).data?.instanceEditor.datasetEditor
                      .unresolveDataPointComment;
                if (payload?.__typename === 'OperationInfo') {
                  throw new Error(payload.messages.map((m) => m.message).join('; '));
                }
              }}
            />
          ) : openPanel === 'sources' ? (
            <SourcesPanel
              refs={sourceReferences}
              availableDataSources={availableDataSources}
              selectedDataPointId={selectedDataPointId}
              selectedCell={selectedCell}
              onClearSelection={() => {
                setSelectedDataPointId(null);
                setClearSelectionNonce((n) => n + 1);
              }}
              onAttachToDataset={async (dataSourceId) => {
                const result = await createSourceReference({
                  variables: {
                    instanceId: instance.id,
                    datasetId: dataset.id,
                    input: { dataSourceId, toDataset: true, dataPointId: null },
                  },
                  // Append the new ref to the Dataset.sourceReferences(target: ALL)
                  // cache entry so the panel updates without a 48s refetch.
                  update: (cache, { data: muData }) => {
                    const payload = muData?.instanceEditor.datasetEditor.createSourceReference;
                    if (payload?.__typename !== 'DatasetSourceReference') return;
                    const dsId = cache.identify({
                      __typename: 'Dataset',
                      id: dataset.id,
                    });
                    const refId = cache.identify(payload);
                    if (!dsId || !refId) return;
                    cache.modify({
                      id: dsId,
                      fields: {
                        sourceReferences: (
                          existing: readonly { __ref: string }[] = [],
                          { storeFieldName }
                        ) => {
                          // Only modify the ALL-target list (the one we read).
                          if (!storeFieldName.includes('"ALL"')) return existing;
                          return [...existing, { __ref: refId }];
                        },
                      },
                    });
                  },
                });
                const payload = result.data?.instanceEditor.datasetEditor.createSourceReference;
                if (payload?.__typename === 'OperationInfo') {
                  throw new Error(payload.messages.map((m) => m.message).join('; '));
                }
              }}
              onDetach={async (referenceId) => {
                const result = await deleteSourceReference({
                  variables: {
                    instanceId: instance.id,
                    datasetId: dataset.id,
                    referenceId,
                  },
                  // Evict the normalised entity so Apollo automatically drops
                  // dangling refs from every cached sourceReferences list.
                  update: (cache, { data: muData }) => {
                    const messages =
                      muData?.instanceEditor.datasetEditor.deleteSourceReference?.messages ?? [];
                    if (messages.length > 0) return;
                    cache.evict({
                      id: cache.identify({
                        __typename: 'DatasetSourceReference',
                        id: referenceId,
                      }),
                    });
                    cache.gc();
                  },
                });
                const messages =
                  result.data?.instanceEditor.datasetEditor.deleteSourceReference?.messages ?? [];
                if (messages.length > 0) {
                  throw new Error(messages.map((m) => m.message).join('; '));
                }
              }}
              onCreateDataSource={async (input) => {
                const result = await createDataSource({
                  variables: { instanceId: instance.id, input },
                  // Append the new source to instance.editor.dataSources via
                  // updateQuery so the picker list refreshes without a full
                  // refetch of the InstanceDataset query.
                  update: (cache, { data: muData }) => {
                    const payload = muData?.instanceEditor.createDataSource;
                    if (payload?.__typename !== 'DataSource') return;
                    cache.updateQuery<InstanceDatasetQuery>(
                      { query: GET_INSTANCE_DATASET },
                      (existing) => {
                        if (!existing?.instance.editor) return existing;
                        return {
                          ...existing,
                          instance: {
                            ...existing.instance,
                            editor: {
                              ...existing.instance.editor,
                              dataSources: [...existing.instance.editor.dataSources, payload],
                            },
                          },
                        };
                      }
                    );
                  },
                });
                const payload = result.data?.instanceEditor.createDataSource;
                if (!payload) {
                  throw new Error('Create data source returned no payload.');
                }
                if (payload.__typename === 'OperationInfo') {
                  throw new Error(payload.messages.map((m) => m.message).join('; '));
                }
                return payload;
              }}
            />
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Dataset details
              </Typography>

              {/* Metadata */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Dataset
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Identifier"
                    value={dataset.identifier ?? ''}
                    disabled
                    helperText="The identifier cannot be changed."
                    fullWidth
                    size="small"
                  />
                  {dataset.externalRef && (
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Link45deg />
                        <Typography variant="subtitle2">External source</Typography>
                        {isExternal && <Chip label="Placeholder" size="small" color="warning" />}
                      </Stack>
                      <Stack spacing={1}>
                        <TextField
                          label="Repository URL"
                          value={dataset.externalRef.repoUrl}
                          disabled
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="Dataset path"
                          value={dataset.externalRef.datasetId}
                          disabled
                          fullWidth
                          size="small"
                        />
                        {dataset.externalRef.commit && (
                          <TextField
                            label="Commit"
                            value={dataset.externalRef.commit}
                            disabled
                            fullWidth
                            size="small"
                            slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
                          />
                        )}
                      </Stack>
                    </Paper>
                  )}
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={!nameDirty}
                      onClick={() => setName(dataset.name)}
                    >
                      Discard
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!nameDirty}
                      onClick={() =>
                        setNotice('Saving dataset metadata is not yet implemented on the backend.')
                      }
                    >
                      Save changes
                    </Button>
                  </Stack>
                </Stack>
              </Paper>

              {/* Connected nodes */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Connected nodes{' '}
                  <Typography component="span" variant="body2" color="text.secondary">
                    ({connectedNodeCount})
                  </Typography>
                </Typography>
                {connectedNodeCount === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No nodes are bound to this dataset.
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {connectedNodes.map((node) => {
                      const nodeClass =
                        node.editor?.spec?.typeConfig && 'nodeClass' in node.editor.spec.typeConfig
                          ? node.editor.spec.typeConfig.nodeClass
                          : (node.editor?.nodeType ?? '');
                      const isOutcome =
                        node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
                      const style = getNodeStyle(node.kind ?? '', nodeClass, isOutcome);
                      return (
                        <ConnectedNodeChip
                          key={node.id}
                          nodeId={node.id}
                          label={node.name ?? node.id}
                          style={style}
                          onSelect={(id) =>
                            router.push(`${modelEditorBase}/nodes?node=${encodeURIComponent(id)}`)
                          }
                          onHover={() => {}}
                        />
                      );
                    })}
                  </Box>
                )}
              </Paper>

              {/* Dimensions */}
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle1">Dimensions</Typography>
                  <Button
                    size="small"
                    startIcon={<Plus />}
                    onClick={() =>
                      setNotice('Attaching dimensions is not yet implemented on the backend.')
                    }
                  >
                    Add
                  </Button>
                </Stack>
                {dataset.dimensions.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No dimensions attached.
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {dataset.dimensions.map((dim) => (
                      <Paper key={dim.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          sx={{ mb: 1 }}
                        >
                          <Typography variant="subtitle2">{dim.name}</Typography>
                          <Stack direction="row">
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                component={Link}
                                href={`${modelEditorBase}/dimensions/${encodeURIComponent(dim.id)}`}
                              >
                                <PencilSquare />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Detach dimension">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setNotice(
                                      'Detaching dimensions is not yet implemented on the backend.'
                                    )
                                  }
                                >
                                  <Trash />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Stack>
                        </Stack>
                        <DimensionCategories dim={dim} usedCategoryUuids={usedCategoryUuids} />
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Paper>

              {/* Metrics */}
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle1">Metrics</Typography>
                  <Button
                    size="small"
                    startIcon={<Plus />}
                    onClick={() =>
                      setNotice('Creating metrics is not yet implemented on the backend.')
                    }
                  >
                    Add
                  </Button>
                </Stack>
                {sortedMetrics.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    No metrics defined.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {sortedMetrics.map((m) => (
                      <Paper key={m.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Stack spacing={0.5}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle2">{m.label}</Typography>
                            <Stack direction="row">
                              <Tooltip title="Edit">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setNotice(
                                        'Editing metrics is not yet implemented on the backend.'
                                      )
                                    }
                                  >
                                    <PencilSquare />
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      setNotice(
                                        'Deleting metrics is not yet implemented on the backend.'
                                      )
                                    }
                                  >
                                    <Trash />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Stack>
                          </Stack>
                          <Stack direction="row" spacing={2}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: 'monospace' }}
                            >
                              {m.name ?? '—'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {m.unit}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Paper>
            </>
          )}
        </Box>
      </Drawer>

      <Snackbar
        open={notice !== null}
        autoHideDuration={4000}
        onClose={() => setNotice(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
