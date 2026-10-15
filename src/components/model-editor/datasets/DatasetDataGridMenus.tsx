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
import type { PopperProps } from '@mui/material';

import type { DataEditorRef, Item, Rectangle } from '@glideapps/glide-data-grid';
import { useTranslations } from 'next-intl';
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
  readOnly: boolean;
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
  readOnly,
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
            {!readOnly && (
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
            )}
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
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              pl: 1.5,
              pr: 0.5,
              py: 0.25,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
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

/** The popper.js instance MUI's Popper exposes through `popperRef`. */
export type PopperInstance = Extract<
  NonNullable<PopperProps['popperRef']>,
  RefObject<unknown>
>['current'];

type CellErrorPopperProps = {
  /** The failed cell to annotate, in DataEditor column/row indices; null hides it. */
  cell: Item | null;
  /** The cell's save error, as reported by the backend. */
  error: string | null;
  gridRef: RefObject<DataEditorRef | null>;
  popperRef: RefObject<PopperInstance>;
};

/**
 * The detail behind a failed cell's red tint: the error the save reported for
 * it. Glide draws on a canvas, so a plain `title` or MUI `Tooltip` has no
 * element to attach to; this anchors a Popper to the cell's bounds instead.
 * Bounds are read lazily from the grid ref, so the popper follows the cell when
 * the grid scrolls (the parent calls `popperRef.current.update()` on scroll).
 */
export function CellErrorPopper({ cell, error, gridRef, popperRef }: CellErrorPopperProps) {
  const t = useTranslations('model-editor');
  return (
    <Popper
      open={cell !== null && error !== null}
      popperRef={popperRef}
      anchorEl={
        cell !== null
          ? {
              getBoundingClientRect: () => {
                const b = gridRef.current?.getBounds(cell[0], cell[1]);
                return b ? new DOMRect(b.x, b.y, b.width, b.height) : new DOMRect(0, 0, 0, 0);
              },
            }
          : null
      }
      placement="top"
      modifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
      // Never intercept the pointer: the grid must keep receiving hover and
      // clicks for the cell underneath.
      sx={{ zIndex: (theme) => theme.zIndex.tooltip, pointerEvents: 'none' }}
    >
      <Paper
        role="tooltip"
        aria-live="polite"
        elevation={4}
        sx={{
          maxWidth: 360,
          px: 1.25,
          py: 0.75,
          bgcolor: 'error.dark',
          color: 'error.contrastText',
        }}
      >
        <Typography variant="caption" component="div" sx={{ fontWeight: 600 }}>
          {t('datasets-cell-not-saved')}
        </Typography>
        <Typography variant="caption" component="div" sx={{ whiteSpace: 'pre-wrap' }}>
          {error}
        </Typography>
      </Paper>
    </Popper>
  );
}
