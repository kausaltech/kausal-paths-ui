import { useState } from 'react';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Check2, Filter, Lock, Plus, Trash } from 'react-bootstrap-icons';

import type { EditorPortTransformationFragment } from '@/common/__generated__/graphql';
import {
  toDatasetTransformationInputs,
  toEdgeTransformationInputs,
} from '../portTransformationInputs';
import { useUpdateDatasetBinding, useUpdateEdgeBinding } from '../usePortBindings';

export type BindingEditorValue = {
  id: string;
  kind: 'dataset' | 'edge';
  tags: readonly string[];
  transformations: readonly EditorPortTransformationFragment[];
  metricId?: string;
  metrics?: readonly { id: string; label: string; unit: string }[];
};

type Props = {
  binding: BindingEditorValue;
  onSaved: () => void;
  onDelete: () => Promise<void>;
};

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function transformationLabel(transformation: EditorPortTransformationFragment): string {
  return transformation.kind.replaceAll('_', ' ');
}

function transformationSummary(transformation: EditorPortTransformationFragment): string | null {
  switch (transformation.__typename) {
    case 'FilterTemporalType':
      return [transformation.minYear, transformation.maxYear]
        .filter((year) => year != null)
        .join('–');
    case 'FilterColumnType':
      return `${transformation.column}: ${
        transformation.values.length > 0
          ? transformation.values.join(', ')
          : (transformation.value ?? transformation.ref ?? '—')
      }`;
    case 'RenameColumnType':
      return `${transformation.column} → ${transformation.newName ?? '—'}`;
    case 'RenameItemType':
      return `${transformation.column}: ${transformation.oldItem} → ${transformation.newItem}`;
    case 'SetForecastFromType':
      return String(transformation.year);
    case 'EnsureUnitType':
      return transformation.unit.short;
    case 'TagOperationType':
      return transformation.tag;
    case 'SelectCategoriesType':
      return `${transformation.dimension}: ${transformation.categories.join(', ') || '—'}`;
    case 'AssignCategoryType':
      return `${transformation.dimension}: ${transformation.category}`;
    case 'FlattenType':
      return transformation.dimension;
    default:
      return null;
  }
}

function isStructured(transformation: EditorPortTransformationFragment): boolean {
  return (
    transformation.__typename === 'FilterDimensionType' ||
    transformation.__typename === 'AssignDimensionType'
  );
}

export default function BindingEditor({ binding, onSaved, onDelete }: Props) {
  const t = useTranslations('model-editor');
  const updateDatasetBinding = useUpdateDatasetBinding();
  const updateEdgeBinding = useUpdateEdgeBinding();
  const [transformations, setTransformations] = useState<EditorPortTransformationFragment[]>(() =>
    binding.transformations.map((entry) => ({
      ...entry,
      ...('groups' in entry ? { groups: [...entry.groups] } : {}),
      ...('categories' in entry ? { categories: [...entry.categories] } : {}),
      ...('values' in entry ? { values: [...entry.values] } : {}),
    }))
  );
  const [tags, setTags] = useState(binding.tags.join(', '));
  const [metricId, setMetricId] = useState(binding.metricId ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchTransformation = (index: number, patch: Partial<EditorPortTransformationFragment>) => {
    setTransformations((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? ({ ...entry, ...patch } as EditorPortTransformationFragment) : entry
      )
    );
  };

  const moveTransformation = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (
      target < 0 ||
      target >= transformations.length ||
      transformations[index].isSystemManaged ||
      transformations[target].isSystemManaged
    ) {
      return;
    }
    setTransformations((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addFilter = () => {
    setTransformations((current) => [
      ...current,
      {
        __typename: 'FilterDimensionType',
        kind: 'filter_dimension',
        isSystemManaged: false,
        dimension: '',
        groups: [],
        categories: [],
        exclude: false,
        flatten: false,
      },
    ]);
  };

  const addAssignment = () => {
    setTransformations((current) => [
      ...current,
      {
        __typename: 'AssignDimensionType',
        kind: 'assign_dimension',
        isSystemManaged: false,
        dimension: '',
        category: '',
      },
    ]);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (binding.kind === 'dataset') {
        await updateDatasetBinding({
          bindingId: binding.id,
          transformations: toDatasetTransformationInputs(transformations),
          tags: splitList(tags),
          metricId: metricId || undefined,
        });
      } else {
        await updateEdgeBinding({
          bindingId: binding.id,
          transformations: toEdgeTransformationInputs(transformations),
          tags: splitList(tags),
        });
      }
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('bindings-save-failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await onDelete();
      onSaved();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('bindings-delete-failed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label={t('bindings-tags')}
        value={tags}
        onChange={(event) => setTags(event.target.value)}
        helperText={t('bindings-tags-help')}
        size="small"
        fullWidth
      />
      {binding.kind === 'dataset' && binding.metrics && binding.metrics.length > 0 && (
        <TextField
          select
          label={t('bindings-metric')}
          value={metricId}
          onChange={(event) => setMetricId(event.target.value)}
          size="small"
          fullWidth
        >
          {binding.metrics.map((metric) => (
            <MenuItem key={metric.id} value={metric.id}>
              {metric.label} ({metric.unit})
            </MenuItem>
          ))}
        </TextField>
      )}

      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t('bindings-transformations')}
        </Typography>
        <Stack spacing={1}>
          {transformations.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {t('bindings-no-transformations')}
            </Typography>
          )}
          {transformations.map((transformation, index) => {
            const structured = isStructured(transformation);
            const readOnly = transformation.isSystemManaged || !structured;
            const summary = transformationSummary(transformation);
            const previous = transformations[index - 1];
            const next = transformations[index + 1];
            return (
              <Paper key={`${transformation.kind}-${index}`} variant="outlined" sx={{ p: 1.25 }}>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, textTransform: 'capitalize', flex: 1 }}
                    >
                      {transformationLabel(transformation)}
                    </Typography>
                    {transformation.isSystemManaged && (
                      <Chip
                        icon={<Lock size={11} />}
                        label={t('bindings-system-managed')}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: 10 }}
                      />
                    )}
                    {!transformation.isSystemManaged && !structured && (
                      <Chip
                        label={t('bindings-read-only')}
                        size="small"
                        variant="outlined"
                        sx={{ height: 22, fontSize: 10 }}
                      />
                    )}
                    {!readOnly && (
                      <>
                        <Tooltip title={t('bindings-move-up')}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={index === 0 || previous?.isSystemManaged}
                              onClick={() => moveTransformation(index, -1)}
                            >
                              <ArrowUp size={13} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={t('bindings-move-down')}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={
                                index === transformations.length - 1 || next?.isSystemManaged
                              }
                              onClick={() => moveTransformation(index, 1)}
                            >
                              <ArrowDown size={13} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={t('common-delete')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() =>
                              setTransformations((current) =>
                                current.filter((_, entryIndex) => entryIndex !== index)
                              )
                            }
                          >
                            <Trash size={13} />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Stack>
                  {summary && readOnly && (
                    <Typography variant="caption" color="text.secondary">
                      {summary}
                    </Typography>
                  )}

                  {transformation.__typename === 'FilterDimensionType' && (
                    <>
                      <TextField
                        label={t('bindings-dimension')}
                        value={transformation.dimension}
                        disabled={readOnly}
                        onChange={(event) =>
                          patchTransformation(index, { dimension: event.target.value })
                        }
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label={t('bindings-categories')}
                        value={transformation.categories.join(', ')}
                        disabled={readOnly}
                        onChange={(event) =>
                          patchTransformation(index, { categories: splitList(event.target.value) })
                        }
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label={t('bindings-groups')}
                        value={transformation.groups.join(', ')}
                        disabled={readOnly}
                        onChange={(event) =>
                          patchTransformation(index, { groups: splitList(event.target.value) })
                        }
                        size="small"
                        fullWidth
                      />
                      <Stack direction="row" spacing={1}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={transformation.exclude}
                              disabled={readOnly}
                              onChange={(_, checked) =>
                                patchTransformation(index, { exclude: checked })
                              }
                            />
                          }
                          label={t('bindings-exclude')}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              size="small"
                              checked={transformation.flatten}
                              disabled={readOnly}
                              onChange={(_, checked) =>
                                patchTransformation(index, { flatten: checked })
                              }
                            />
                          }
                          label={t('bindings-flatten')}
                        />
                      </Stack>
                    </>
                  )}

                  {transformation.__typename === 'AssignDimensionType' && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                      <TextField
                        label={t('bindings-dimension')}
                        value={transformation.dimension}
                        disabled={readOnly}
                        onChange={(event) =>
                          patchTransformation(index, { dimension: event.target.value })
                        }
                        size="small"
                        fullWidth
                      />
                      <TextField
                        label={t('bindings-category')}
                        value={transformation.category}
                        disabled={readOnly}
                        onChange={(event) =>
                          patchTransformation(index, { category: event.target.value })
                        }
                        size="small"
                        fullWidth
                      />
                    </Stack>
                  )}
                </Stack>
              </Paper>
            );
          })}
        </Stack>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button size="small" variant="outlined" startIcon={<Filter />} onClick={addFilter}>
            {t('bindings-add-filter')}
          </Button>
          <Button size="small" variant="outlined" startIcon={<Plus />} onClick={addAssignment}>
            {t('bindings-add-assignment')}
          </Button>
        </Stack>
      </Box>

      <Stack direction="row" justifyContent="space-between">
        <Button
          color="error"
          startIcon={<Trash />}
          disabled={saving || deleting}
          onClick={() => void handleDelete()}
        >
          {t('bindings-delete')}
        </Button>
        <Button
          variant="contained"
          startIcon={<Check2 />}
          disabled={saving || deleting}
          onClick={() => void handleSave()}
        >
          {saving ? t('common-saving') : t('common-save-changes')}
        </Button>
      </Stack>
    </Stack>
  );
}
