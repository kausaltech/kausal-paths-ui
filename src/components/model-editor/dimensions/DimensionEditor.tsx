import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useMutation, useQuery } from '@apollo/client/react';
import { ArrowLeft, GripVertical, Plus, Trash } from 'react-bootstrap-icons';

import type {
  CreateDimensionCategoriesMutation,
  CreateDimensionCategoriesMutationVariables,
  CreateDimensionCategoryInput,
  DeleteDimensionCategoryMutation,
  DeleteDimensionCategoryMutationVariables,
  InstanceDimensionFieldsFragment,
  InstanceDimensionsQuery,
  UpdateDimensionCategoriesMutation,
  UpdateDimensionCategoriesMutationVariables,
  UpdateDimensionCategoryInput,
  UpdateDimensionMutation,
  UpdateDimensionMutationVariables,
} from '@/common/__generated__/graphql';
import { useInstance } from '@/common/instance';
import GraphQLError from '@/components/common/GraphQLError';
import {
  CREATE_DIMENSION_CATEGORIES,
  DELETE_DIMENSION_CATEGORY,
  GET_INSTANCE_DIMENSIONS,
  UPDATE_DIMENSION,
  UPDATE_DIMENSION_CATEGORIES,
} from './queries';

type Props = {
  dimensionId: string;
};

type CategoryRow = {
  /** UUID — either server-generated for existing categories, or client-generated for new ones */
  id: string;
  identifier: string;
  label: string;
  /** true for client-created categories that don't exist on the server yet */
  isNew: boolean;
};

type OperationMessage = {
  kind: string;
  field: string | null;
  message: string;
  code: string | null;
};

function toRows(dim: InstanceDimensionFieldsFragment): CategoryRow[] {
  return [...dim.categories]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      id: c.id,
      identifier: c.identifier ?? '',
      label: c.label,
      isNew: false,
    }));
}

function getListBase(pathname: string): string {
  const idx = pathname.indexOf('/model-editor');
  return idx >= 0
    ? pathname.slice(0, idx) + '/model-editor/dimensions'
    : '/model-editor/dimensions';
}

function genUuid(): string {
  // crypto.randomUUID is available in modern browsers and Node 14+
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback — should not normally be reached
  return 'new-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function extractMessages(
  result: { __typename: string; messages?: OperationMessage[] } | null | undefined
): string[] {
  if (!result) return [];
  if (result.__typename === 'OperationInfo' && result.messages) {
    return result.messages.map((m) => m.message);
  }
  return [];
}

export default function DimensionEditor({ dimensionId }: Props) {
  const { data, loading, error, refetch } = useQuery<InstanceDimensionsQuery>(
    GET_INSTANCE_DIMENSIONS,
    { fetchPolicy: 'cache-and-network' }
  );
  const instance = useInstance();
  const router = useRouter();
  const pathname = usePathname();
  const listBase = getListBase(pathname);

  const dimension = useMemo(
    () => data?.instance.editor?.dimensions.find((d) => d.id === dimensionId) ?? null,
    [data, dimensionId]
  );

  const [name, setName] = useState('');
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (dimension) {
      setName(dimension.name);
      setRows(toRows(dimension));
      setDeletedIds([]);
    }
  }, [dimension]);

  const isDirty = useMemo(() => {
    if (!dimension) return false;
    if (name !== dimension.name) return true;
    if (deletedIds.length > 0) return true;
    const original = toRows(dimension);
    if (original.length !== rows.length) return true;
    for (let i = 0; i < rows.length; i++) {
      const cur = rows[i];
      const orig = original[i];
      if (cur.isNew) return true;
      if (cur.id !== orig.id) return true;
      if (cur.label !== orig.label) return true;
      if (cur.identifier !== orig.identifier) return true;
    }
    return false;
  }, [dimension, name, rows, deletedIds]);

  const [updateDimension] = useMutation<UpdateDimensionMutation, UpdateDimensionMutationVariables>(
    UPDATE_DIMENSION
  );
  const [createCategories] = useMutation<
    CreateDimensionCategoriesMutation,
    CreateDimensionCategoriesMutationVariables
  >(CREATE_DIMENSION_CATEGORIES);
  const [updateCategories] = useMutation<
    UpdateDimensionCategoriesMutation,
    UpdateDimensionCategoriesMutationVariables
  >(UPDATE_DIMENSION_CATEGORIES);
  const [deleteCategory] = useMutation<
    DeleteDimensionCategoryMutation,
    DeleteDimensionCategoryMutationVariables
  >(DELETE_DIMENSION_CATEGORY);

  const handleReorder = useCallback((sourceId: string, targetId: string, placeBefore: boolean) => {
    setRows((prev) => {
      const from = prev.findIndex((r) => r.id === sourceId);
      const to = prev.findIndex((r) => r.id === targetId);
      if (from < 0 || to < 0 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      const insertIdx = next.findIndex((r) => r.id === targetId);
      next.splice(placeBefore ? insertIdx : insertIdx + 1, 0, moved);
      return next;
    });
  }, []);

  const handleAddCategory = () => {
    setRows((prev) => [...prev, { id: genUuid(), identifier: '', label: '', isNew: true }]);
  };

  const handleRemoveCategory = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setDeletedIds((prev) => {
      const row = rows.find((r) => r.id === id);
      if (!row || row.isNew) return prev;
      return [...prev, id];
    });
  };

  const handleSave = async () => {
    if (!dimension || !isDirty) return;
    setSaving(true);
    setErrors([]);
    const accumulatedErrors: string[] = [];

    try {
      // 1) Delete categories that were removed
      for (const delId of deletedIds) {
        const result = await deleteCategory({
          variables: { instanceId: instance.id, categoryId: delId },
        });
        const msgs = result.data?.instanceEditor.deleteDimensionCategory?.messages ?? [];
        accumulatedErrors.push(...msgs.map((m) => m.message));
      }

      // Compute siblings for current row order
      const siblingOf = (
        idx: number
      ): { previousSibling: string | null; nextSibling: string | null } => ({
        previousSibling: idx > 0 ? rows[idx - 1].id : null,
        nextSibling: idx < rows.length - 1 ? rows[idx + 1].id : null,
      });

      // The backend rejects explicit `null` on Maybe[ID] sibling fields — omit them instead.
      const addSiblings = (
        target: Record<string, unknown>,
        sib: { previousSibling: string | null; nextSibling: string | null }
      ) => {
        if (sib.previousSibling !== null) target.previousSibling = sib.previousSibling;
        if (sib.nextSibling !== null) target.nextSibling = sib.nextSibling;
      };

      // 2) Create new categories (with client-generated UUIDs so later refs work)
      const creates: CreateDimensionCategoryInput[] = rows
        .map((r, idx) => ({ row: r, idx }))
        .filter(({ row }) => row.isNew)
        .map(({ row, idx }) => {
          const input: Record<string, unknown> = {
            dimensionId: dimension.id,
            id: row.id,
            label: row.label,
          };
          if (row.identifier) input.identifier = row.identifier;
          addSiblings(input, siblingOf(idx));
          return input as unknown as CreateDimensionCategoryInput;
        });

      if (creates.length > 0) {
        const result = await createCategories({
          variables: { instanceId: instance.id, input: creates },
        });
        accumulatedErrors.push(
          ...extractMessages(result.data?.instanceEditor.createDimensionCategories ?? null)
        );
      }

      // 3) Update existing categories whose label/identifier/position changed
      const originalRows = toRows(dimension);
      const originalById = new Map(originalRows.map((r, i) => [r.id, { row: r, idx: i }]));
      const updates: UpdateDimensionCategoryInput[] = [];
      rows.forEach((r, idx) => {
        if (r.isNew) return;
        const orig = originalById.get(r.id);
        if (!orig) return;
        const sib = siblingOf(idx);
        const origSib = {
          previousSibling: orig.idx > 0 ? originalRows[orig.idx - 1].id : null,
          nextSibling: orig.idx < originalRows.length - 1 ? originalRows[orig.idx + 1].id : null,
        };
        const labelChanged = r.label !== orig.row.label;
        const identifierChanged = r.identifier !== orig.row.identifier;
        const positionChanged =
          sib.previousSibling !== origSib.previousSibling ||
          sib.nextSibling !== origSib.nextSibling;
        if (!labelChanged && !identifierChanged && !positionChanged) return;
        // Only send fields that changed. Siblings that are `null` (at edge) must be omitted.
        const input: Record<string, unknown> = { categoryId: r.id };
        if (labelChanged) input.label = r.label;
        if (identifierChanged) input.identifier = r.identifier || null;
        if (positionChanged) addSiblings(input, sib);
        updates.push(input as unknown as UpdateDimensionCategoryInput);
      });

      if (updates.length > 0) {
        const result = await updateCategories({
          variables: { instanceId: instance.id, input: updates },
        });
        accumulatedErrors.push(
          ...extractMessages(result.data?.instanceEditor.updateDimensionCategories ?? null)
        );
      }

      // 4) Update dimension name if changed
      if (name !== dimension.name) {
        const result = await updateDimension({
          variables: {
            instanceId: instance.id,
            input: { dimensionId: dimension.id, name },
          },
        });
        accumulatedErrors.push(
          ...extractMessages(result.data?.instanceEditor.updateDimension ?? null)
        );
      }

      await refetch();

      if (accumulatedErrors.length > 0) {
        setErrors(accumulatedErrors);
      } else {
        setToast('Changes saved');
      }
    } catch (err) {
      setErrors([err instanceof Error ? err.message : String(err)]);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <GraphQLError error={error} />;
  if (!dimension) {
    return (
      <Container maxWidth="md" sx={{ pt: 16, pb: 3, mx: 0 }}>
        <Button startIcon={<ArrowLeft />} onClick={() => router.push(listBase)}>
          Back to dimensions
        </Button>
        <Alert severity="warning" sx={{ mt: 2 }}>
          Dimension not found.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ pt: 16, pb: 3, mx: 0 }}>
      <Button startIcon={<ArrowLeft />} onClick={() => router.push(listBase)} sx={{ mb: 2 }}>
        Back to dimensions
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Dimension
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Identifier"
            value={dimension.identifier}
            disabled
            helperText="The identifier cannot be changed."
            fullWidth
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">Categories</Typography>
          <Button startIcon={<Plus />} onClick={handleAddCategory}>
            Add category
          </Button>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        {rows.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No categories. Add one to get started.
          </Typography>
        )}
        <Stack spacing={1}>
          {rows.map((row, idx) => (
            <CategoryRowView
              key={row.id}
              row={row}
              index={idx}
              draggingId={draggingId}
              onDragStart={setDraggingId}
              onDragEnd={() => setDraggingId(null)}
              onReorder={handleReorder}
              onChange={(next) => setRows((prev) => prev.map((r) => (r.id === row.id ? next : r)))}
              onRemove={() => handleRemoveCategory(row.id)}
            />
          ))}
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button
          variant="outlined"
          disabled={!isDirty || saving}
          onClick={() => {
            if (dimension) {
              setName(dimension.name);
              setRows(toRows(dimension));
              setDeletedIds([]);
              setErrors([]);
            }
          }}
        >
          Discard changes
        </Button>
        <Button
          variant="contained"
          disabled={!isDirty || saving}
          onClick={() => {
            void handleSave();
          }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </Stack>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setErrors([])}>
          <Stack>
            {errors.map((m, i) => (
              <Typography key={i} variant="body2">
                {m}
              </Typography>
            ))}
          </Stack>
        </Alert>
      )}

      <Snackbar
        open={toast !== null}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Container>
  );
}

type CategoryRowViewProps = {
  row: CategoryRow;
  index: number;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onReorder: (sourceId: string, targetId: string, placeBefore: boolean) => void;
  onChange: (next: CategoryRow) => void;
  onRemove: () => void;
};

function CategoryRowView({
  row,
  draggingId,
  onDragStart,
  onDragEnd,
  onReorder,
  onChange,
  onRemove,
}: CategoryRowViewProps) {
  const [dragOver, setDragOver] = useState<'before' | 'after' | null>(null);
  const isDragging = draggingId === row.id;

  return (
    <Box
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', row.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(row.id);
      }}
      onDragEnd={() => {
        onDragEnd();
        setDragOver(null);
      }}
      onDragOver={(e) => {
        if (!draggingId || draggingId === row.id) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = e.currentTarget.getBoundingClientRect();
        const half = rect.top + rect.height / 2;
        setDragOver(e.clientY < half ? 'before' : 'after');
      }}
      onDragLeave={() => setDragOver(null)}
      onDrop={(e) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData('text/plain') || draggingId;
        if (sourceId && sourceId !== row.id) {
          onReorder(sourceId, row.id, dragOver === 'before');
        }
        setDragOver(null);
      }}
      sx={{
        position: 'relative',
        opacity: isDragging ? 0.5 : 1,
        '&::before':
          dragOver === 'before'
            ? {
                content: '""',
                position: 'absolute',
                top: -2,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: 'primary.main',
              }
            : undefined,
        '&::after':
          dragOver === 'after'
            ? {
                content: '""',
                position: 'absolute',
                bottom: -2,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: 'primary.main',
              }
            : undefined,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          p: 1,
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          backgroundColor: 'background.paper',
        }}
      >
        <Tooltip title="Drag to reorder">
          <Box sx={{ cursor: 'grab', display: 'flex', color: 'text.secondary' }}>
            <GripVertical size={20} />
          </Box>
        </Tooltip>
        <TextField
          size="small"
          label="Label"
          value={row.label}
          onChange={(e) => onChange({ ...row, label: e.target.value })}
          sx={{ flex: 2 }}
        />
        <TextField
          size="small"
          label="Identifier"
          value={row.identifier}
          onChange={(e) => onChange({ ...row, identifier: e.target.value })}
          sx={{ flex: 1 }}
        />
        <Tooltip title="Remove category">
          <IconButton size="small" onClick={onRemove}>
            <Trash size={18} />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
}
