import { Box, Chip, Tooltip, Typography } from '@mui/material';

import { useTranslations } from 'next-intl';

import type { EditorNodeFieldsFragment, NodeConfigInput } from '@/common/__generated__/graphql';
import {
  type ActionGroupOption,
  FieldLabel,
  LiveActionGroupField,
  LiveBooleanField,
  LiveColorField,
  LiveNodeGroupField,
  LiveTextField,
  metaChipSx,
} from './node-details/fields';
import { getNodeGroup } from './nodeHelpers';
import { useUpdateNodeMutation } from './useUpdateNodeMutation';

export type NodeDetailsSectionProps = {
  node: EditorNodeFieldsFragment;
  nodeGroupOptions: readonly string[];
  actionGroupOptions: readonly ActionGroupOption[];
  readOnly: boolean;
};

export default function NodeDetailsSection({
  node,
  nodeGroupOptions,
  actionGroupOptions,
  readOnly,
}: NodeDetailsSectionProps) {
  const t = useTranslations('model-editor');
  const updateNode = useUpdateNodeMutation();

  const originalIsOutcome = node.__typename === 'Node' ? (node.isOutcome ?? false) : false;
  const supportsOutcome = node.__typename === 'Node';
  const isActionNode = node.__typename === 'ActionNode';
  const actionGroupId = node.__typename === 'ActionNode' ? (node.group?.id ?? null) : null;
  // The group is part of the action's type config, and the update mutation
  // replaces the whole config, so a group change must resend the current
  // values of every other config field.
  const actionTypeConfig =
    node.editor?.spec?.typeConfig?.__typename === 'ActionConfigType'
      ? node.editor.spec.typeConfig
      : null;
  const commitActionGroup = (next: ActionGroupOption | null) => {
    if (!actionTypeConfig) return Promise.reject(new Error('Missing action type config'));
    const config: NodeConfigInput = {
      action: {
        nodeClass: actionTypeConfig.nodeClass,
        decisionLevel: actionTypeConfig.decisionLevel ?? null,
        group: next?.uuid ?? null,
        parent: actionTypeConfig.parent ?? null,
        noEffectValue: actionTypeConfig.noEffectValue ?? null,
      },
    };
    return updateNode(node.id, { config });
  };

  // `fieldset disabled` propagates disabled state to every native form control
  // inside, so MUI TextField / Switch / Autocomplete / color input all go
  // read-only without per-component plumbing.
  const body = (
    <Box
      component="fieldset"
      disabled={readOnly}
      sx={{
        border: 0,
        p: 0,
        m: 0,
        minWidth: 0,
        display: 'contents',
      }}
    >
      <LiveTextField
        key={`shortName:${node.id}`}
        label={t('nodes-field-short-name')}
        nodeId={node.id}
        value={node.shortName ?? ''}
        // Send '' to clear, not null: null is dropped by stripNulls (the backend
        // can't take an explicit null here), making the clear a silent no-op.
        onCommit={(next) => updateNode(node.id, { shortName: next })}
        placeholder={t('nodes-field-short-name-hint')}
      />

      <LiveColorField
        key={`color:${node.id}`}
        nodeId={node.id}
        value={node.color ?? null}
        onCommit={(next) => {
          void updateNode(node.id, { color: next });
        }}
      />

      <LiveNodeGroupField
        key={`nodeGroup:${node.id}`}
        value={getNodeGroup(node)}
        options={nodeGroupOptions}
        onCommit={(next) => updateNode(node.id, { nodeGroup: next })}
      />

      {isActionNode && actionTypeConfig && (
        <LiveActionGroupField
          key={`actionGroup:${node.id}`}
          value={actionGroupId}
          options={actionGroupOptions}
          onCommit={commitActionGroup}
        />
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <LiveBooleanField
          label={t('nodes-field-visible')}
          value={node.isVisible ?? true}
          onCommit={(next) => {
            void updateNode(node.id, { isVisible: next });
          }}
        />
        {supportsOutcome && (
          <LiveBooleanField
            label={t('nodes-field-outcome')}
            value={originalIsOutcome}
            onCommit={(next) => {
              void updateNode(node.id, { isOutcome: next });
            }}
          />
        )}
      </Box>

      <Box>
        <FieldLabel>{t('nodes-field-identifier')}</FieldLabel>
        <Box
          sx={{
            width: '100%',
            bgcolor: 'grey.100',
            borderRadius: 0.5,
            px: 1,
            py: 0.5,
            overflowX: 'auto',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              fontFamily: 'monospace',
              fontSize: 10,
              whiteSpace: 'nowrap',
            }}
          >
            {node.identifier}
          </Typography>
        </Box>
      </Box>

      {(node.quantityKind ?? originalIsOutcome) && (
        <Box>
          <FieldLabel>{t('nodes-port-quantity')}</FieldLabel>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {node.quantityKind && (
              <Chip
                label={`${node.quantityKind.icon ?? ''} ${node.quantityKind.label}`.trim()}
                title={`quantityKind: ${node.quantityKind.id}`}
                size="small"
                variant="outlined"
                sx={metaChipSx}
              />
            )}
            {originalIsOutcome && (
              <Chip label={t('nodes-outcome-chip')} size="small" color="primary" sx={metaChipSx} />
            )}
          </Box>
        </Box>
      )}

      {node.editor?.tags && node.editor.tags.length > 0 && (
        <Box>
          <FieldLabel>{t('nodes-field-tags')}</FieldLabel>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {node.editor.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" sx={metaChipSx} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );

  if (!readOnly) return body;
  return (
    <Tooltip title={t('entity-read-only-desc')} placement="left" arrow followCursor>
      {body}
    </Tooltip>
  );
}
