import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';

import { Copy, EyeSlash } from 'react-bootstrap-icons';

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
  onCopyAction: (nodeId: string) => void;
};

export default function NodeGraphContextMenu({ state, onClose, onHideEdge, onCopyAction }: Props) {
  const handleHideEdge = () => {
    if (state?.kind !== 'edge') return;
    onHideEdge(state.edgeId);
    onClose();
  };

  const handleCopyAction = () => {
    if (state?.kind !== 'node') return;
    onCopyAction(state.nodeId);
    onClose();
  };

  return (
    <Menu
      open={state !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={state ? { top: state.mouseY, left: state.mouseX } : undefined}
    >
      {state?.kind === 'edge' && (
        <MenuItem onClick={handleHideEdge}>
          <ListItemIcon>
            <EyeSlash size={18} />
          </ListItemIcon>
          <ListItemText>Hide edge</ListItemText>
        </MenuItem>
      )}
      {state?.kind === 'node' && state.isAction && (
        <MenuItem onClick={handleCopyAction}>
          <ListItemIcon>
            <Copy size={18} />
          </ListItemIcon>
          <ListItemText>Duplicate action</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
}
