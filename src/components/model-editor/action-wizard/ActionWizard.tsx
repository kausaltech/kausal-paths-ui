import { useId, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useQuery, useReactiveVar } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { Bullseye, PlusLg, Trash, X } from 'react-bootstrap-icons';

import type {
  ActionEffectInput,
  ActionWizardDimensionsQuery,
  EditorNodeFieldsFragment,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import { getModelEditorSection } from '../paths';
import { useEditorApolloContext } from '../useEditorApolloContext';
import { ACTION_WIZARD_DIMENSIONS, EFFECT_SOURCE_CANDIDATES } from './queries';
import {
  type EffectDraft,
  type EffectSourceKind,
  actionWizardVar,
  closeActionWizard,
  setWizardPick,
  updateActionWizard,
  updateEffect,
} from './state';
import { useCreateActionFromPorts } from './useCreateActionFromPorts';

type Dimension = NonNullable<
  ActionWizardDimensionsQuery['instance']['editor']
>['dimensions'][number];
type OutputPort = NonNullable<
  NonNullable<EditorNodeFieldsFragment['editor']>['spec']
>['outputPorts'][number];

export const ACTION_WIZARD_WIDTH = 420;

/** The output port an effect acts on: the chosen one, or the node's only one. */
function effectPort(
  node: EditorNodeFieldsFragment | undefined,
  effect: EffectDraft
): OutputPort | null {
  const ports = node?.editor?.spec?.outputPorts ?? [];
  if (effect.targetPortId) return ports.find((p) => p.id === effect.targetPortId) ?? null;
  return ports.length === 1 ? ports[0] : null;
}

/** Dimension uuids of a port: the solver's answer, else its declared dimensions. */
function portDimensionIds(port: OutputPort, dimensions: readonly Dimension[]): string[] | null {
  const solved = port.effectiveShape?.dimensionUuids;
  if (solved) return [...solved];
  const ids = port.dimensions.map(
    (identifier) => dimensions.find((d) => d.identifier === identifier)?.id
  );
  return ids.every((id): id is string => id != null) ? ids : null;
}

/** The categories of a dimension the target port can have: the solver's narrowing, else all of them. */
function allowedCategories(port: OutputPort, dimension: Dimension) {
  const known = port.effectiveShape?.categories.find((c) => c.dimensionUuid === dimension.id);
  return known
    ? dimension.categories.filter((c) => known.categoryUuids.includes(c.id))
    : dimension.categories;
}

function defaultLabel(node: EditorNodeFieldsFragment, port: OutputPort | null): string {
  const ports = node.editor?.spec?.outputPorts ?? [];
  return ports.length > 1 && port
    ? `${node.name}: ${port.label ?? port.identifier ?? ''}`
    : node.name;
}

function EffectSources({
  effect,
  node,
  port,
}: {
  effect: EffectDraft;
  node: EditorNodeFieldsFragment;
  port: OutputPort;
}) {
  const t = useTranslations('model-editor');
  const uid = useId();
  const editorContext = useEditorApolloContext();
  const { data, loading } = useQuery(EFFECT_SOURCE_CANDIDATES, {
    variables: { target: { nodeId: node.uuid, portId: port.id } },
    skip: effect.sourceKind === 'newDataset',
    context: editorContext,
    fetchPolicy: 'network-only',
  });
  const candidates = data?.instance.editor?.effectSourceCandidates;
  const pick = useReactiveVar(actionWizardVar).pick;
  const picking = pick?.kind === 'source' && pick.effectKey === effect.key;

  if (effect.sourceKind === 'newDataset') return null;
  if (loading || !candidates) return <CircularProgress size={16} />;

  if (effect.sourceKind === 'dataset') {
    return (
      <Stack spacing={0.5}>
        <FormControl size="small" fullWidth>
          <InputLabel id={`${uid}-source_dataset_select`}>
            {t('action-from-ports-source-dataset-select')}
          </InputLabel>
          <Select
            labelId={`${uid}-source_dataset_select`}
            label={t('action-from-ports-source-dataset-select')}
            value={effect.datasetMetric ?? ''}
            onChange={(e) => updateEffect(effect.key, { datasetMetric: e.target.value || null })}
          >
            {candidates.datasets.map((c) => (
              <MenuItem key={`${c.datasetId}:${c.metricId}`} value={`${c.datasetId}:${c.metricId}`}>
                {c.datasetName} → {c.metricLabel}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {candidates.datasets.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            {t('action-from-ports-source-dataset-none')}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {t('action-from-ports-source-dataset-hint')}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={0.5}>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <FormControl size="small" fullWidth>
          <InputLabel id={`${uid}-source_node_select`}>
            {t('action-from-ports-source-node-select')}
          </InputLabel>
          <Select
            labelId={`${uid}-source_node_select`}
            label={t('action-from-ports-source-node-select')}
            value={effect.sourcePort ?? ''}
            onChange={(e) => updateEffect(effect.key, { sourcePort: e.target.value || null })}
          >
            {candidates.nodes.map((c) => (
              <MenuItem key={`${c.nodeId}:${c.portId}`} value={`${c.nodeId}:${c.portId}`}>
                {c.nodeName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton
          size="small"
          title={t('action-from-ports-pick-on-canvas')}
          color={picking ? 'primary' : 'default'}
          onClick={() => setWizardPick(picking ? null : { kind: 'source', effectKey: effect.key })}
        >
          <Bullseye size={16} />
        </IconButton>
      </Box>
      {candidates.nodes.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          {t('action-from-ports-source-node-none')}
        </Typography>
      )}
    </Stack>
  );
}

function EffectCard({
  effect,
  index,
  node,
  dimensions,
  removable,
}: {
  effect: EffectDraft;
  index: number;
  node: EditorNodeFieldsFragment | undefined;
  dimensions: readonly Dimension[];
  removable: boolean;
}) {
  const t = useTranslations('model-editor');
  const uid = useId();
  if (!node) return null;
  const ports = node.editor?.spec?.outputPorts ?? [];
  const port = effectPort(node, effect);
  const dimensionIds = port ? portDimensionIds(port, dimensions) : null;
  const portDimensions = (dimensionIds ?? [])
    .map((id) => dimensions.find((d) => d.id === id))
    .filter((d): d is Dimension => d != null);

  const setKind = (sourceKind: EffectSourceKind) => updateEffect(effect.key, { sourceKind });

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t('action-from-ports-effect', { number: index + 1 })}
          </Typography>
          <Typography variant="subtitle2">{node.name}</Typography>
        </Box>
        {removable && (
          <IconButton
            size="small"
            title={t('action-from-ports-remove-effect')}
            onClick={() =>
              updateActionWizard((s) => ({
                ...s,
                effects: s.effects.filter((e) => e.key !== effect.key),
              }))
            }
          >
            <Trash size={14} />
          </IconButton>
        )}
      </Box>
      <Stack spacing={1.5}>
        {ports.length > 1 && (
          <FormControl size="small" fullWidth required>
            <InputLabel id={`${uid}-target_port`}>{t('action-from-ports-target-port')}</InputLabel>
            <Select
              labelId={`${uid}-target_port`}
              label={t('action-from-ports-target-port')}
              value={effect.targetPortId ?? ''}
              onChange={(e) => updateEffect(effect.key, { targetPortId: e.target.value || null })}
            >
              {ports.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.label ?? p.identifier ?? p.id} ({p.unit?.short})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {port && (
          <>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label={[port.quantity, port.unit?.short].filter(Boolean).join(' · ')}
              />
              {portDimensions.map((d) => (
                <Chip key={d.id} size="small" variant="outlined" label={d.name} />
              ))}
              {dimensionIds === null && (
                <Chip size="small" color="warning" label={t('action-from-ports-shape-unknown')} />
              )}
            </Box>
            <TextField
              size="small"
              label={t('action-from-ports-effect-label')}
              placeholder={defaultLabel(node, port)}
              value={effect.label}
              onChange={(e) => updateEffect(effect.key, { label: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <FormControl>
              <Typography variant="caption" color="text.secondary">
                {t('action-from-ports-source')}
              </Typography>
              <RadioGroup
                value={effect.sourceKind}
                onChange={(e) => setKind(e.target.value as EffectSourceKind)}
              >
                <FormControlLabel
                  value="newDataset"
                  control={<Radio size="small" />}
                  label={t('action-from-ports-source-new-dataset')}
                />
                <FormControlLabel
                  value="dataset"
                  control={<Radio size="small" />}
                  label={t('action-from-ports-source-dataset')}
                />
                <FormControlLabel
                  value="node"
                  control={<Radio size="small" />}
                  label={t('action-from-ports-source-node')}
                />
              </RadioGroup>
            </FormControl>
            {effect.sourceKind === 'newDataset' &&
              portDimensions.map((dimension) => {
                const allowed = allowedCategories(port, dimension);
                const kept = effect.keptCategories[dimension.id] ?? allowed.map((c) => c.id);
                return (
                  <Autocomplete
                    key={dimension.id}
                    multiple
                    size="small"
                    options={allowed}
                    getOptionLabel={(c) => c.label}
                    value={allowed.filter((c) => kept.includes(c.id))}
                    onChange={(_e, value) =>
                      updateEffect(effect.key, {
                        keptCategories: {
                          ...effect.keptCategories,
                          [dimension.id]: value.map((c) => c.id),
                        },
                      })
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('action-from-ports-categories', { dimension: dimension.name })}
                      />
                    )}
                  />
                );
              })}
            <EffectSources effect={effect} node={node} port={port} />
          </>
        )}
      </Stack>
    </Paper>
  );
}

/** Build the mutation input from an effect, or return null while it is incomplete. */
function effectInput(
  effect: EffectDraft,
  node: EditorNodeFieldsFragment | undefined,
  dimensions: readonly Dimension[]
): ActionEffectInput | null {
  const port = effectPort(node, effect);
  if (!node || !port) return null;
  const target = { nodeId: node.uuid, portId: port.id };
  const label = effect.label.trim() || null;
  switch (effect.sourceKind) {
    case 'newDataset': {
      const categories = Object.entries(effect.keptCategories).flatMap(
        ([dimensionId, categoryIds]) => {
          const dimension = dimensions.find((d) => d.id === dimensionId);
          // A dimension left with all its categories needs no narrowing.
          if (!dimension || categoryIds.length === allowedCategories(port, dimension).length)
            return [];
          return [{ dimensionId, categoryIds }];
        }
      );
      if (Object.values(effect.keptCategories).some((ids) => ids.length === 0)) return null;
      return { target, label, source: { newDataset: { categories } } };
    }
    case 'dataset': {
      if (!effect.datasetMetric) return null;
      const [datasetId, metricId] = effect.datasetMetric.split(':');
      return { target, label, source: { dataset: { datasetId, metricId } } };
    }
    case 'node': {
      if (!effect.sourcePort) return null;
      const [nodeId, portId] = effect.sourcePort.split(':');
      return { target, label, source: { node: { nodeId, portId } } };
    }
  }
}

type Props = {
  nodeMap: ReadonlyMap<string, EditorNodeFieldsFragment>;
  actionGroups: readonly { id: string; uuid: string; name: string }[];
  /** Called after creation when the action has no dataset of its own to fill in. */
  onCreated: (actionId: string) => void;
};

/**
 * The "new action acting on these output ports" wizard: a panel over the
 * canvas, so that further effects and source nodes can be picked on the
 * graph while it is open. See docs/plans/action-from-output-port.md in
 * kausal-paths.
 */
export default function ActionWizard({ nodeMap, actionGroups, onCreated }: Props) {
  const t = useTranslations('model-editor');
  const uid = useId();
  const state = useReactiveVar(actionWizardVar);
  const instance = useInstance();
  const editorContext = useEditorApolloContext();
  const router = useRouter();
  const pathname = usePathname();
  const createAction = useCreateActionFromPorts();
  const { data: dimensionData } = useQuery(ACTION_WIZARD_DIMENSIONS, {
    context: editorContext,
    skip: !state.open,
  });
  const dimensions = useMemo(
    () => dimensionData?.instance.editor?.dimensions ?? [],
    [dimensionData]
  );

  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  // Starts at the default the backend would use, so the spinner steps from there and not from 1.
  const defaultStartYear = String(instance.maximumHistoricalYear ?? '');
  const [startYear, setStartYear] = useState(defaultStartYear);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state.open) return null;

  const inputs = state.effects.map((effect) =>
    effectInput(effect, nodeMap.get(effect.targetNodeId), dimensions)
  );
  const dimensionSets = new Set(
    state.effects.map((effect) => {
      const port = effectPort(nodeMap.get(effect.targetNodeId), effect);
      const ids = port ? portDimensionIds(port, dimensions) : null;
      return ids ? [...ids].sort().join(',') : '?';
    })
  );
  const mixedDimensions = dimensionSets.size > 1;
  const complete = inputs.every((input) => input !== null);
  const canCreate =
    name.trim() !== '' && state.effects.length > 0 && complete && !mixedDimensions && !submitting;

  const reset = () => {
    setName('');
    setGroup('');
    setStartYear(defaultStartYear);
    setError(null);
    closeActionWizard();
  };

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const created = await createAction({
        name: name.trim(),
        group: group || null,
        startYear: startYear ? Number(startYear) : null,
        effects: inputs.filter((input): input is ActionEffectInput => input !== null),
      });
      reset();
      if (created.datasetIds.length > 0) {
        // The numbers go into the action's own dataset; open it in the data grid.
        router.push(`${getModelEditorSection(pathname, 'datasets')}/${created.datasetIds[0]}`);
      } else {
        onCreated(created.actionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={8}
      data-editor-ui-target="action-wizard"
      sx={{
        // On the right, below the user menu: the left is taken by the editor's navigation card,
        // and the node details drawer is closed while the wizard is open.
        position: 'absolute',
        top: 72,
        right: 8,
        bottom: 8,
        width: ACTION_WIZARD_WIDTH,
        zIndex: 6,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5 }}>
        <Typography variant="h6" sx={{ flex: 1, fontSize: 16 }}>
          {t('action-from-ports-title')}
        </Typography>
        <IconButton size="small" onClick={reset} title={t('action-from-ports-cancel')}>
          <X size={18} />
        </IconButton>
      </Box>
      <Divider />
      <Stack spacing={2} sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {t('action-from-ports-intro', { year: instance.maximumHistoricalYear ?? '' })}
        </Typography>
        {state.effects.map((effect, index) => (
          <EffectCard
            key={effect.key}
            effect={effect}
            index={index}
            node={nodeMap.get(effect.targetNodeId)}
            dimensions={dimensions}
            removable={state.effects.length > 1}
          />
        ))}
        <Button
          variant={state.pick?.kind === 'target' ? 'contained' : 'outlined'}
          size="small"
          startIcon={<PlusLg size={14} />}
          onClick={() => setWizardPick(state.pick?.kind === 'target' ? null : { kind: 'target' })}
        >
          {t('action-from-ports-add-effect')}
        </Button>
        {mixedDimensions && (
          <Alert severity="warning">{t('action-from-ports-mixed-dimensions')}</Alert>
        )}
        <Divider />
        <TextField
          size="small"
          required
          label={t('action-from-ports-name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormControl size="small" fullWidth>
          <InputLabel shrink id={`${uid}-group`}>
            {t('action-from-ports-group')}
          </InputLabel>
          <Select
            labelId={`${uid}-group`}
            label={t('action-from-ports-group')}
            notched
            displayEmpty
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <MenuItem value="">{t('action-from-ports-no-group')}</MenuItem>
            {actionGroups.map((g) => (
              <MenuItem key={g.uuid} value={g.uuid}>
                {g.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          type="number"
          label={t('action-from-ports-start-year')}
          helperText={t('action-from-ports-start-year-hint')}
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
          slotProps={{
            inputLabel: { shrink: true },
            htmlInput: { min: instance.minimumHistoricalYear, max: instance.modelEndYear },
          }}
        />
        {error && <Alert severity="error">{error}</Alert>}
      </Stack>
      <Divider />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1.5 }}>
        <Button onClick={reset}>{t('action-from-ports-cancel')}</Button>
        <Button
          variant="contained"
          disabled={!canCreate}
          onClick={() => void submit()}
          startIcon={submitting ? <CircularProgress size={14} /> : undefined}
        >
          {t('action-from-ports-create')}
        </Button>
      </Box>
    </Paper>
  );
}
