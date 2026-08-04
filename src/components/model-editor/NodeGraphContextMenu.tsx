import { useState } from 'react';

import { Divider, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';

import { useTranslations } from 'next-intl';
import {
  ChevronRight,
  Copy,
  EyeSlash,
  Lightning,
  Magic,
  PlusLg,
  PlusSquare,
  Trash,
} from 'react-bootstrap-icons';

import type { NewNodeKind } from './useCreateNode';
import { useIsEditorReadOnly } from './useIsEditorReadOnly';

/**
 * A menu item that opens a submenu to its right on hover or click. The nested
 * Menu is rendered as a React child of the item, so pointer events on the
 * portaled submenu still bubble to this item in the React tree — that keeps
 * the submenu open while the pointer is over it (the mui-nested-menu pattern).
 * The popover itself is pointer-transparent (no backdrop) so the parent menu
 * stays interactive; only the list accepts pointer events.
 */
function SubMenuItem({
  icon,
  label,
  children,
  ...menuItemProps
}: {
  icon: React.ReactNode;
  label: React.ReactNode;
  children: React.ReactNode;
} & React.ComponentProps<typeof MenuItem>) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <MenuItem
      {...menuItemProps}
      onMouseEnter={(e) => setAnchorEl(e.currentTarget)}
      onMouseLeave={() => setAnchorEl(null)}
      onClick={(e) => setAnchorEl(e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'Enter') setAnchorEl(e.currentTarget);
        if (e.key === 'ArrowLeft' || e.key === 'Escape') setAnchorEl(null);
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText>{label}</ListItemText>
      <ChevronRight size={12} style={{ marginLeft: 16 }} />
      <Menu
        open={anchorEl !== null}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        onClose={() => setAnchorEl(null)}
        autoFocus={false}
        disableAutoFocus
        disableEnforceFocus
        hideBackdrop
        style={{ pointerEvents: 'none' }}
        slotProps={{ list: { dense: true, sx: { pointerEvents: 'auto' } } }}
      >
        {children}
      </Menu>
    </MenuItem>
  );
}

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
          <SubMenuItem key="new-node" icon={<PlusSquare size={14} />} label={t('nodes-add-node')}>
            <MenuItem onClick={() => handleNewNode('additive')}>
              <ListItemIcon>
                <PlusLg size={14} />
              </ListItemIcon>
              <ListItemText
                primary={t('nodes-node-type-additive')}
                secondary={t('nodes-node-type-additive-desc')}
                slotProps={{ secondary: { sx: { fontSize: 11 } } }}
              />
            </MenuItem>
            <MenuItem onClick={() => handleNewNode('formula')}>
              <ListItemIcon>
                <span style={{ fontSize: 13, fontStyle: 'italic', fontFamily: 'serif' }}>fx</span>
              </ListItemIcon>
              <ListItemText
                primary={t('nodes-node-type-formula')}
                secondary={t('nodes-node-type-formula-desc')}
                slotProps={{ secondary: { sx: { fontSize: 11 } } }}
              />
            </MenuItem>
          </SubMenuItem>,
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
