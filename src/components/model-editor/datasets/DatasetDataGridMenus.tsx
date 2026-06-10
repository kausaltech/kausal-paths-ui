import type { RefObject } from 'react';

import {
  Button,
  Checkbox,
  ClickAwayListener,
  Divider,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material';

import type { DataEditorRef, Rectangle } from '@glideapps/glide-data-grid';
import { Bookmarks, ChatLeft, Clipboard, Files } from 'react-bootstrap-icons';

import { type GridRow, METRIC_COL } from './dataset-grid-data';

type CellContextMenuState = {
  mouseX: number;
  mouseY: number;
  row: GridRow;
};

type ColumnFilterMenuState = {
  colId: string;
  bounds: Rectangle;
};

type CellContextMenuProps = {
  contextMenu: CellContextMenuState | null;
  gridRef: RefObject<DataEditorRef | null>;
  onClose: () => void;
  onOpenPanel?: (panel: 'datapoint') => void;
};

type ColumnFilterMenuProps = {
  filterMenu: ColumnFilterMenuState | null;
  categoryFilters: Map<string, Set<string>>;
  filterMenuOptions: { key: string; label: string }[];
  onClose: () => void;
  onClearFilter: (colId: string) => void;
  onToggleFilter: (colId: string, key: string, allKeys: string[]) => void;
};

export function CellContextMenu({
  contextMenu,
  gridRef,
  onClose,
  onOpenPanel,
}: CellContextMenuProps) {
  return (
    <Popper
      open={contextMenu !== null}
      anchorEl={
        contextMenu !== null
          ? {
              getBoundingClientRect: () =>
                new DOMRect(contextMenu.mouseX, contextMenu.mouseY, 0, 0),
            }
          : null
      }
      placement="bottom-start"
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
    >
      <ClickAwayListener
        onClickAway={onClose}
        // Right-click events also dismiss; the document-level listener in the
        // grid handles repositioning to a new cell when applicable.
        mouseEvent="onMouseDown"
      >
        <Paper elevation={8}>
          <MenuList autoFocus dense>
            <MenuItem
              onClick={() => {
                onClose();
                // Glide's keyboard handlers only fire when the grid is
                // focused; the menu click moves focus to the MenuList.
                gridRef.current?.focus();
                void gridRef.current?.emit('copy');
              }}
            >
              <ListItemIcon>
                <Files />
              </ListItemIcon>
              <ListItemText>Copy</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                onClose();
                gridRef.current?.focus();
                // Reads via navigator.clipboard.readText — requires a user
                // gesture (the menu click qualifies) and a secure context.
                // No-ops silently if the browser denies permission.
                void gridRef.current?.emit('paste');
              }}
            >
              <ListItemIcon>
                <Clipboard />
              </ListItemIcon>
              <ListItemText>Paste</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                onClose();
                onOpenPanel?.('datapoint');
              }}
            >
              <ListItemIcon>
                <ChatLeft />
              </ListItemIcon>
              <ListItemText>Comment</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                onClose();
                onOpenPanel?.('datapoint');
              }}
            >
              <ListItemIcon>
                <Bookmarks />
              </ListItemIcon>
              <ListItemText>Data source</ListItemText>
            </MenuItem>
          </MenuList>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}

export function ColumnFilterMenu({
  filterMenu,
  categoryFilters,
  filterMenuOptions,
  onClose,
  onClearFilter,
  onToggleFilter,
}: ColumnFilterMenuProps) {
  return (
    <Popper
      open={filterMenu !== null}
      anchorEl={
        filterMenu !== null
          ? {
              // Glide already reports bounds in client/viewport coordinates
              // (it adds the canvas rect offset), so use them as-is.
              getBoundingClientRect: () => {
                const { x, y, width, height } = filterMenu.bounds;
                return new DOMRect(x, y, width, height);
              },
            }
          : null
      }
      placement="bottom-start"
      sx={{ zIndex: (theme) => theme.zIndex.modal }}
    >
      <ClickAwayListener onClickAway={onClose}>
        <Paper elevation={8} sx={{ minWidth: 200, maxHeight: 360, overflow: 'auto' }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ pl: 1.5, pr: 0.5, py: 0.25 }}
          >
            <Typography variant="caption" color="text.secondary">
              {filterMenu?.colId === METRIC_COL ? 'Filter by metric' : 'Filter by category'}
            </Typography>
            <Button
              size="small"
              onClick={() => filterMenu && onClearFilter(filterMenu.colId)}
              disabled={!filterMenu || !categoryFilters.has(filterMenu.colId)}
            >
              Clear
            </Button>
          </Stack>
          <Divider />
          <MenuList dense>
            {filterMenuOptions.length === 0 && (
              <MenuItem disabled>
                <ListItemText>No values</ListItemText>
              </MenuItem>
            )}
            {filterMenuOptions.map((opt) => {
              const selected = filterMenu ? categoryFilters.get(filterMenu.colId) : undefined;
              // Absent filter = every value allowed (all checked).
              const checked = selected ? selected.has(opt.key) : true;
              return (
                <MenuItem
                  key={opt.key}
                  onClick={() =>
                    filterMenu &&
                    onToggleFilter(
                      filterMenu.colId,
                      opt.key,
                      filterMenuOptions.map((o) => o.key)
                    )
                  }
                >
                  <ListItemIcon>
                    <Checkbox
                      edge="start"
                      size="small"
                      checked={checked}
                      tabIndex={-1}
                      disableRipple
                      sx={{ p: 0 }}
                    />
                  </ListItemIcon>
                  <ListItemText>{opt.label}</ListItemText>
                </MenuItem>
              );
            })}
          </MenuList>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}
