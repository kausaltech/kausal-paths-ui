import { useState } from 'react';

import {
  Alert,
  Autocomplete,
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

import { useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowUp, Check2, Filter, Lock, Plus, Trash } from 'react-bootstrap-icons';

import type {
  EditorPortTransformationFragment,
  InstanceDimensionFieldsFragment,
} from '@/common/__generated__/graphql';
import { GET_INSTANCE_DIMENSIONS } from '../dimensions/queries';
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
  metrics?: readonly {
    id: string;
    label: string;
    unitInfo: { standard: string } | null;
  }[];
};

type Props = {
  binding: BindingEditorValue;
  onSaved: () => void;
  onDelete: () => Promise<void>;
};

/**
 * Cross-cutting tags that backend node classes react to. Tags are free-form
 * (the field stays freeSolo): many classes grep for their own specific tags,
 * and the first tag on an edge doubles as the input's alias in formulas —
 * but these general ones are worth discovering from the editor.
 */
const TAG_SUGGESTIONS = ['non_additive', 'impute', 'other_node', 'historical', 'goal', 'emissions'];

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

/**
 * Select over the instance's dimensions; transformation `dimension` values are
 * dimension identifiers. Falls back to a plain text field while the dimension
 * list is unavailable, and keeps an out-of-list value selectable so opening an
 * older transformation never silently clears it.
 */
function DimensionSelect({
  value,
  disabled,
  options,
  onChange,
}: {
  value: string;
  disabled: boolean;
  options: readonly InstanceDimensionFieldsFragment[];
  onChange: (value: string) => void;
}) {
  const t = useTranslations('model-editor');
  if (options.length === 0) {
    return (
      <TextField
        label={t('bindings-dimension')}
        value={value}
        disabled={disabled}
        placeholder={t('bindings-dimension-placeholder')}
        // Keep the label floated so the placeholder shows while unfocused,
        // matching the categories field.
        slotProps={{ inputLabel: { shrink: true } }}
        onChange={(event) => onChange(event.target.value)}
        size="small"
        fullWidth
      />
    );
  }
  const known = options.some((dim) => dim.identifier === value);
  return (
    <TextField
      select
      label={t('bindings-dimension')}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      size="small"
      fullWidth
      // Selects have no native placeholder: float the label and render the
      // empty value as placeholder-styled text, matching the categories field.
      slotProps={{
        inputLabel: { shrink: true },
        select: {
          displayEmpty: true,
          renderValue: (selected) => {
            const identifier = selected as string;
            if (identifier === '') {
              return (
                <Box component="span" sx={{ color: 'text.disabled' }}>
                  {t('bindings-dimension-placeholder')}
                </Box>
              );
            }
            const dim = options.find((entry) => entry.identifier === identifier);
            return dim ? `${dim.name} (${dim.identifier})` : identifier;
          },
        },
      }}
    >
      {value !== '' && !known && <MenuItem value={value}>{value}</MenuItem>}
      {options.map((dim) => (
        <MenuItem key={dim.id} value={dim.identifier}>
          {dim.name} ({dim.identifier})
        </MenuItem>
      ))}
    </TextField>
  );
}

type CategoryOption = { identifier: string; label: string };

function categoryOptionsFor(dimension: InstanceDimensionFieldsFragment | null): CategoryOption[] {
  return (dimension?.categories ?? [])
    .filter((category) => category.identifier != null)
    .map((category) => ({ identifier: category.identifier!, label: category.label }));
}

function categoryOptionLabel(option: string | CategoryOption): string {
  return typeof option === 'string' ? option : option.label;
}

function categoryOptionEquals(
  option: string | CategoryOption,
  selected: string | CategoryOption
): boolean {
  const optionId = typeof option === 'string' ? option : option.identifier;
  const selectedId = typeof selected === 'string' ? selected : selected.identifier;
  return optionId === selectedId;
}

/**
 * Normalize a committed Autocomplete item to a category identifier. Free-typed
 * text may be a label (the input displays labels), so match it against the
 * options before falling back to the raw string.
 */
function toCategoryIdentifier(
  options: readonly CategoryOption[],
  item: string | CategoryOption
): string {
  if (typeof item !== 'string') return item.identifier;
  const match = options.find(
    (option) =>
      option.identifier === item || option.label.toLowerCase() === item.trim().toLowerCase()
  );
  return match ? match.identifier : item;
}

function renderCategoryOption(
  props: React.HTMLAttributes<HTMLLIElement> & { key: React.Key },
  option: string | CategoryOption
) {
  const identifier = typeof option === 'string' ? option : option.identifier;
  return (
    <li {...props} key={identifier}>
      {typeof option === 'string' ? option : `${option.label} (${option.identifier})`}
    </li>
  );
}

/**
 * Multi-select over the chosen dimension's categories; transformation
 * `categories` values are category identifiers. Known identifiers render as
 * labeled chips, out-of-list values stay selectable as raw identifiers, and
 * freeSolo keeps arbitrary identifiers typeable. Falls back to the
 * comma-separated text field when the dimension's categories are unknown.
 */
function CategoryMultiSelect({
  value,
  disabled,
  dimension,
  onChange,
}: {
  value: readonly string[];
  disabled: boolean;
  dimension: InstanceDimensionFieldsFragment | null;
  onChange: (values: string[]) => void;
}) {
  const t = useTranslations('model-editor');
  const options = categoryOptionsFor(dimension);
  // An empty selection means the filter passes every category through, so
  // surface that as a placeholder while nothing is selected.
  const emptyPlaceholder = dimension
    ? t('bindings-categories-all-placeholder', { dimension: dimension.name })
    : undefined;
  if (options.length === 0) {
    return (
      <TextField
        label={t('bindings-categories')}
        value={value.join(', ')}
        disabled={disabled}
        placeholder={emptyPlaceholder}
        // Keep the label floated so the placeholder shows while unfocused.
        slotProps={{ inputLabel: { shrink: true } }}
        onChange={(event) => onChange(splitList(event.target.value))}
        size="small"
        fullWidth
      />
    );
  }
  const byIdentifier = new Map(options.map((option) => [option.identifier, option]));
  return (
    <Autocomplete
      multiple
      freeSolo
      disabled={disabled}
      options={options}
      value={value.map((identifier) => byIdentifier.get(identifier) ?? identifier)}
      onChange={(_, next) => onChange(next.map((item) => toCategoryIdentifier(options, item)))}
      getOptionLabel={categoryOptionLabel}
      isOptionEqualToValue={categoryOptionEquals}
      renderOption={renderCategoryOption}
      size="small"
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('bindings-categories')}
          placeholder={value.length === 0 ? emptyPlaceholder : undefined}
          // Keep the label floated so the placeholder shows while unfocused.
          slotProps={{ inputLabel: { ...params.InputLabelProps, shrink: true } }}
        />
      )}
    />
  );
}

/**
 * Single-select counterpart of CategoryMultiSelect, for `assign_dimension`'s
 * category. Same conventions: identifier values, label display, out-of-list
 * values preserved, text-field fallback when the dimension is unknown.
 */
function CategorySelect({
  value,
  disabled,
  dimension,
  onChange,
}: {
  value: string;
  disabled: boolean;
  dimension: InstanceDimensionFieldsFragment | null;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('model-editor');
  const options = categoryOptionsFor(dimension);
  if (options.length === 0) {
    return (
      <TextField
        label={t('bindings-category')}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        size="small"
        fullWidth
      />
    );
  }
  const byIdentifier = new Map(options.map((option) => [option.identifier, option]));
  return (
    <Autocomplete
      // No autoSelect: it commits the input's *text* (the label, not the
      // identifier) on blur, and a late blur — e.g. clicking straight into the
      // dimension select — would overwrite a just-cleared value.
      freeSolo
      disabled={disabled}
      options={options}
      value={value === '' ? null : (byIdentifier.get(value) ?? value)}
      onChange={(_, next) => onChange(next == null ? '' : toCategoryIdentifier(options, next))}
      getOptionLabel={categoryOptionLabel}
      isOptionEqualToValue={categoryOptionEquals}
      renderOption={renderCategoryOption}
      size="small"
      fullWidth
      renderInput={(params) => <TextField {...params} label={t('bindings-category')} />}
    />
  );
}

export default function BindingEditor({ binding, onSaved, onDelete }: Props) {
  const t = useTranslations('model-editor');
  const updateDatasetBinding = useUpdateDatasetBinding();
  const updateEdgeBinding = useUpdateEdgeBinding();
  const { data: dimensionsData } = useQuery(GET_INSTANCE_DIMENSIONS, {
    fetchPolicy: 'cache-first',
  });
  const dimensionOptions = dimensionsData?.instance?.editor?.dimensions ?? [];
  const [transformations, setTransformations] = useState<EditorPortTransformationFragment[]>(() =>
    binding.transformations.map((entry) => ({
      ...entry,
      ...('groups' in entry ? { groups: [...entry.groups] } : {}),
      ...('categories' in entry ? { categories: [...entry.categories] } : {}),
      ...('values' in entry ? { values: [...entry.values] } : {}),
    }))
  );
  const [tags, setTags] = useState<string[]>([...binding.tags]);
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

  // Change a transformation's dimension, clearing its dimension-scoped fields
  // (categories/groups/category). Done inside the updater against the current
  // entry, so it stays correct even if events interleave (e.g. a blur-commit
  // from the category field landing around the same click).
  const changeTransformationDimension = (index: number, dimension: string) => {
    setTransformations((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== index) return entry;
        if (entry.__typename === 'FilterDimensionType') {
          if (entry.dimension === dimension) return entry;
          return { ...entry, dimension, categories: [], groups: [], exclude: false };
        }
        if (entry.__typename === 'AssignDimensionType') {
          if (entry.dimension === dimension) return entry;
          return { ...entry, dimension, category: '' };
        }
        return entry;
      })
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
          tags,
          metricId: metricId || undefined,
        });
      } else {
        await updateEdgeBinding({
          bindingId: binding.id,
          transformations: toEdgeTransformationInputs(transformations),
          tags,
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
    <Stack spacing={2.5}>
      {error && <Alert severity="error">{error}</Alert>}
      <Autocomplete
        multiple
        freeSolo
        autoSelect
        options={TAG_SUGGESTIONS}
        value={tags}
        onChange={(_, next) => setTags(next)}
        size="small"
        renderInput={(params) => (
          <TextField {...params} label={t('bindings-tags')} helperText={t('bindings-tags-help')} />
        )}
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
              {metric.label} ({metric.unitInfo?.standard ?? '—'})
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
                <Stack spacing={1.5}>
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
                      {/* Padding, not margin: the parent Stack zeroes child
                          margins with a higher-specificity selector. */}
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', pb: 1.5 }}
                      >
                        {t('bindings-filter-dimension-help')}
                      </Typography>
                      <DimensionSelect
                        value={transformation.dimension}
                        disabled={readOnly}
                        options={dimensionOptions}
                        onChange={(dimension) => changeTransformationDimension(index, dimension)}
                      />
                      <CategoryMultiSelect
                        // Remount on dimension change so the Autocomplete's
                        // internal input state can never survive it.
                        key={transformation.dimension || 'no-dimension'}
                        value={transformation.categories}
                        disabled={readOnly || transformation.dimension === ''}
                        dimension={
                          dimensionOptions.find(
                            (dim) => dim.identifier === transformation.dimension
                          ) ?? null
                        }
                        onChange={(categories) =>
                          // Exclude is only meaningful against selected
                          // categories (the backend skips the filter entirely
                          // when none are set), so clearing them resets it
                          // rather than leaving a no-op exclude on the binding.
                          patchTransformation(index, {
                            categories,
                            ...(categories.length === 0 ? { exclude: false } : {}),
                          })
                        }
                      />
                      {/* Category groups only exist on YAML-era dimensions (the
                          editor's DB-backed dimensions have none), so the field
                          only shows for imported transformations that already
                          filter by group. No options to offer — freeSolo chips. */}
                      {transformation.groups.length > 0 && (
                        <Autocomplete
                          multiple
                          freeSolo
                          options={[] as string[]}
                          value={[...transformation.groups]}
                          disabled={readOnly}
                          onChange={(_, groups) => patchTransformation(index, { groups })}
                          size="small"
                          renderInput={(params) => (
                            <TextField {...params} label={t('bindings-groups')} />
                          )}
                        />
                      )}
                      <Stack direction="row" spacing={1}>
                        <Tooltip
                          title={
                            transformation.categories.length === 0
                              ? t('bindings-exclude-needs-categories')
                              : ''
                          }
                        >
                          <span>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={transformation.exclude}
                                  disabled={readOnly || transformation.categories.length === 0}
                                  onChange={(_, checked) =>
                                    patchTransformation(index, { exclude: checked })
                                  }
                                />
                              }
                              label={t('bindings-exclude')}
                            />
                          </span>
                        </Tooltip>
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
                    <>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', pb: 1.5 }}
                      >
                        {t('bindings-assign-dimension-help')}
                      </Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <DimensionSelect
                          value={transformation.dimension}
                          disabled={readOnly}
                          options={dimensionOptions}
                          onChange={(dimension) => changeTransformationDimension(index, dimension)}
                        />
                        <CategorySelect
                          // Remount on dimension change: the single-select's
                          // uncontrolled input text otherwise survives an
                          // external value clear (stale label stays visible).
                          key={transformation.dimension || 'no-dimension'}
                          value={transformation.category}
                          disabled={readOnly || transformation.dimension === ''}
                          dimension={
                            dimensionOptions.find(
                              (dim) => dim.identifier === transformation.dimension
                            ) ?? null
                          }
                          onChange={(category) => patchTransformation(index, { category })}
                        />
                      </Stack>
                    </>
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
