import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';

import { Copy, EyeSlash, Magic } from 'react-bootstrap-icons';

export type ContextMenuState =
  | ({
      mouseX: number;
      mouseY: number;
    } & ({ kind: 'node'; nodeId: string; isAction: boolean } | { kind: 'edge'; edgeId: string }))
  | null;

type Props = {
  state: ContextMenuState;
  onClose: () => void;
  onHideEdge: (edgeId: string) => void;
  onOpenActionWizard: (nodeId: string) => void;
  onDuplicateAction: (nodeId: string) => void;
};

export default function NodeGraphContextMenu({
  state,
  onClose,
  onHideEdge,
  onOpenActionWizard,
  onDuplicateAction,
}: Props) {
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

  const handleDuplicateAction = () => {
    if (state?.kind !== 'node') return;
    onDuplicateAction(state.nodeId);
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
          <ListItemText>Hide edge</ListItemText>
        </MenuItem>
      )}
      {state?.kind === 'node' &&
        state.isAction && [
          <MenuItem key="duplicate" onClick={handleDuplicateAction}>
            <ListItemIcon>
              <Copy size={14} />
            </ListItemIcon>
            <ListItemText>Duplicate action</ListItemText>
          </MenuItem>,
          <MenuItem key="wizard" onClick={handleOpenActionWizard}>
            <ListItemIcon>
              <Magic size={14} />
            </ListItemIcon>
            <ListItemText>Action wizard (legacy)</ListItemText>
          </MenuItem>,
        ]}
    </Menu>
  );
}
