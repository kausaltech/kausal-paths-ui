import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';

import { useTranslations } from 'next-intl';
import { Copy, EyeSlash, Lightning, Magic, PlusSquare, Trash } from 'react-bootstrap-icons';

import type { NewNodeKind } from './useCreateNode';
import { useIsEditorReadOnly } from './useIsEditorReadOnly';

export type ContextMenuState =
  | ({
      mouseX: number;
      mouseY: number;
    } & (
      | { kind: 'node'; nodeId: string; isAction: boolean }
      | { kind: 'edge'; edgeId: string }
      | { kind: 'pane'; flowX: number; flowY: number }
    ))
  | null;

type Props = {
  state: ContextMenuState;
  onClose: () => void;
  onHideEdge: (edgeId: string) => void;
  onOpenActionWizard: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onNewNode: (flowX: number, flowY: number, kind: NewNodeKind) => void;
};

export default function NodeGraphContextMenu({
  state,
  onClose,
  onHideEdge,
  onOpenActionWizard,
  onDuplicateNode,
  onDeleteNode,
  onNewNode,
}: Props) {
  const t = useTranslations('model-editor');
  const readOnly = useIsEditorReadOnly();

  const handleHideEdge = () => {
    if (state?.kind !== 'edge') return;
    onHideEdge(state.edgeId);
    onClose();
  };

  const handleOpenActionWizard = () => {
    if (state?.kind !== 'node') return;
    onOpenActionWizard(state.nodeId);
    onClose();
  };

  const handleDuplicateNode = () => {
    if (state?.kind !== 'node') return;
    onDuplicateNode(state.nodeId);
    onClose();
  };

  const handleDeleteNode = () => {
    if (state?.kind !== 'node') return;
    onDeleteNode(state.nodeId);
    onClose();
  };

  const handleNewNode = (kind: NewNodeKind) => {
    if (state?.kind !== 'pane') return;
    onNewNode(state.flowX, state.flowY, kind);
    onClose();
  };

  return (
    <Menu
      open={state !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={state ? { top: state.mouseY, left: state.mouseX } : undefined}
      slotProps={{ list: { dense: true } }}
    >
      {state?.kind === 'edge' && (
        <MenuItem onClick={handleHideEdge}>
          <ListItemIcon>
            <EyeSlash size={14} />
          </ListItemIcon>
          <ListItemText>{t('nodes-hide-edge')}</ListItemText>
        </MenuItem>
      )}
      {!readOnly &&
        state?.kind === 'node' && [
          <MenuItem key="duplicate" onClick={handleDuplicateNode}>
            <ListItemIcon>
              <Copy size={14} />
            </ListItemIcon>
            <ListItemText>{t('nodes-duplicate-node')}</ListItemText>
          </MenuItem>,
          ...(state.isAction
            ? [
                <MenuItem key="wizard" onClick={handleOpenActionWizard}>
                  <ListItemIcon>
                    <Magic size={14} />
                  </ListItemIcon>
                  <ListItemText>{t('nodes-action-wizard')}</ListItemText>
                </MenuItem>,
              ]
            : []),
          <Divider key="divider" />,
        ]}
      {!readOnly && state?.kind === 'node' && (
        <MenuItem onClick={handleDeleteNode} sx={{ color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit' }}>
            <Trash size={14} />
          </ListItemIcon>
          <ListItemText>{t('nodes-delete-context-menu')}</ListItemText>
        </MenuItem>
      )}
      {!readOnly &&
        state?.kind === 'pane' && [
          <MenuItem key="new-node" onClick={() => handleNewNode('formula')}>
            <ListItemIcon>
              <PlusSquare size={14} />
            </ListItemIcon>
            <ListItemText>{t('nodes-new-node')}</ListItemText>
          </MenuItem>,
          <MenuItem key="new-action" onClick={() => handleNewNode('action')}>
            <ListItemIcon>
              <Lightning size={14} />
            </ListItemIcon>
            <ListItemText>{t('nodes-new-action')}</ListItemText>
          </MenuItem>,
        ]}
      {readOnly && (state?.kind === 'node' || state?.kind === 'pane') && (
        <MenuItem disabled>
          <ListItemText
            primary={t('nodes-read-only')}
            secondary={t('nodes-read-only-short-desc')}
            slotProps={{
              primary: { sx: { fontSize: 12 } },
              secondary: { sx: { fontSize: 11 } },
            }}
          />
        </MenuItem>
      )}
    </Menu>
  );
}
