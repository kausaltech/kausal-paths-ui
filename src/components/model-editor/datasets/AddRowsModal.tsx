import { useMemo, useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Fade,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';

import { X } from 'react-bootstrap-icons';

import type { DatasetDetailFieldsFragment } from '@/common/__generated__/graphql';
import {
  DimensionCategoryList,
  NOT_APPLICABLE,
  type NotApplicable,
  identifierOf,
} from './DimensionCategoryList';
import { getCategoryCombinations } from './utils';

type Metric = DatasetDetailFieldsFragment['metrics'][number];
type Dimension = DatasetDetailFieldsFragment['dimensions'][number];
type DimensionCategory = Dimension['categories'][number];

const HORIZONTAL_PADDING = 3;

const DIALOG_TITLE_SX = {
  color: 'text.primary',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const DIALOG_ACTIONS_SX = {
  justifyContent: 'space-between',
  px: HORIZONTAL_PADDING,
  py: 2,
};

const CATEGORY_SELECTOR_WRAPPER_SX = {
  mt: 2,
  // Cap the row's height so each column can scroll its chips independently
  // rather than having the whole dialog grow when one dimension has many
  // categories. Horizontal scroll still kicks in for narrow viewports.
  height: 'min(60vh, 480px)',
  overflowX: 'auto',
  overflowY: 'hidden',
  px: HORIZONTAL_PADDING,
  pb: 0.5,
  WebkitOverflowScrolling: 'touch',
  '::-webkit-scrollbar': { display: 'block', WebkitAppearance: 'none' },
  '::-webkit-scrollbar:horizontal': { height: 6 },
  '::-webkit-scrollbar:vertical': { width: 6 },
  '::-webkit-scrollbar-thumb': {
    borderRadius: 0,
    backgroundColor: 'rgba(0, 0, 0, .5)',
  },
};

export type SelectedCategories = {
  metric: string[];
  [dimensionId: string]: string[];
};

type Status = {
  message: string;
  color: string;
  isValid: boolean;
  newRows: string[][];
};

const ERROR_STATUS = {
  isValid: false,
  color: 'error.dark',
  newRows: [] as string[][],
};

const SUCCESS_STATUS = {
  isValid: true,
  color: 'success.dark',
};

function isCombinationInSelection(combination: string[], existing: string[][]): boolean {
  const filtered = combination.filter((c) => c !== NOT_APPLICABLE);
  return existing.some(
    (row) => filtered.length === row.length && filtered.every((category) => row.includes(category))
  );
}

function getStatus(
  dimensions: Dimension[],
  selectedCategories: SelectedCategories,
  selectedCombinations: string[][],
  existingCombinations: string[][]
): Status {
  const metricHasSelection = selectedCategories.metric?.length > 0;
  const allDimensionsHaveSelections = dimensions.every(
    (dim) => selectedCategories[dim.id]?.length > 0
  );
  const hasSelections = metricHasSelection && allDimensionsHaveSelections;

  if (!hasSelections) {
    return {
      ...ERROR_STATUS,
      message: 'Select a metric and a category for every dimension',
    };
  }

  const newCombinations = selectedCombinations.filter(
    (combo) => !isCombinationInSelection(combo, existingCombinations)
  );
  const totalSelected = selectedCombinations.length;
  const totalNew = newCombinations.length;
  const totalExisting = totalSelected - totalNew;

  if (totalNew === 0) {
    return {
      ...ERROR_STATUS,
      message: 'All selected combinations already exist',
    };
  }

  const creationText = `Will create ${totalNew} new row${totalNew === 1 ? '' : 's'}`;
  if (totalExisting === 0) {
    return { ...SUCCESS_STATUS, message: creationText, newRows: newCombinations };
  }
  return {
    ...SUCCESS_STATUS,
    message: `${creationText} (${totalExisting} already exist${totalExisting === 1 ? 's' : ''})`,
    newRows: newCombinations,
  };
}

function handleUpdateSelectedCategories(
  prev: SelectedCategories,
  key: string,
  category: Metric | DimensionCategory | NotApplicable
): SelectedCategories {
  const prevCategories = prev[key] ?? [];

  if (category === NOT_APPLICABLE) {
    if (prevCategories.includes(NOT_APPLICABLE)) {
      return { ...prev, [key]: [] };
    }
    // Selecting NOT_APPLICABLE clears any other choices for this dimension.
    return { ...prev, [key]: [NOT_APPLICABLE] };
  }

  const id = identifierOf(category);
  if (prevCategories.includes(id)) {
    return { ...prev, [key]: prevCategories.filter((cat) => cat !== id) };
  }
  // Adding a regular category implicitly removes NOT_APPLICABLE from the set.
  return {
    ...prev,
    [key]: [...new Set([...prevCategories.filter((cat) => cat !== NOT_APPLICABLE), id])],
  };
}

export type AddProgress = { current: number; total: number };

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (selectedMetricIds: string[], newRows: string[][]) => void;
  metrics: Metric[];
  dimensions: Dimension[];
  /**
   * Existing rows expressed as flat lists of identifiers (metric id +
   * dimension category uuids). Used to grey out combinations that would
   * duplicate already-rendered rows.
   */
  existingCombinations: string[][];
  /**
   * When set, the modal stays open with buttons disabled and a determinate
   * progress bar replaces the status footer. Parent is responsible for
   * eventually calling `onClose` once the operation finishes.
   */
  isAdding?: boolean;
  progress?: AddProgress | null;
};

export function AddRowsModal({
  open,
  onClose,
  onAdd,
  metrics,
  dimensions,
  existingCombinations,
  isAdding = false,
  progress = null,
}: Props) {
  const [selectedCategories, setSelectedCategories] = useState<SelectedCategories>({ metric: [] });

  const selectedCombinations = useMemo(
    () => getCategoryCombinations(selectedCategories),
    [selectedCategories]
  );

  const status = getStatus(
    dimensions,
    selectedCategories,
    selectedCombinations,
    existingCombinations
  );

  function handleCategorySelect(key: string, category: Metric | DimensionCategory | NotApplicable) {
    setSelectedCategories((prev) => handleUpdateSelectedCategories(prev, key, category));
  }

  return (
    <Dialog maxWidth="md" fullWidth open={open} onClose={onClose}>
      <DialogTitle sx={DIALOG_TITLE_SX}>
        Add rows
        <IconButton onClick={onClose} size="small">
          <X />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, m: 0, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="body2" color="text.secondary" sx={{ px: HORIZONTAL_PADDING }}>
          Select metric and dimension category combinations to add as new rows
        </Typography>

        <Stack direction="row" alignItems="stretch" sx={CATEGORY_SELECTOR_WRAPPER_SX}>
          <DimensionCategoryList
            metrics={metrics}
            onSelect={(metric) => handleCategorySelect('metric', metric)}
            selectedCategories={selectedCategories.metric || []}
          />

          {dimensions.map((dimension) => (
            <DimensionCategoryList
              key={dimension.id}
              withNotApplicable
              dimension={dimension}
              onSelect={(category) => handleCategorySelect(dimension.id, category)}
              selectedCategories={selectedCategories[dimension.id] || []}
            />
          ))}
        </Stack>

        <Divider sx={{ mx: HORIZONTAL_PADDING }} />
      </DialogContent>

      <DialogActions sx={DIALOG_ACTIONS_SX}>
        {isAdding && progress ? (
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Adding {progress.current} of {progress.total} data points…
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
            />
          </Box>
        ) : (
          <Fade key={status.message} in>
            <Typography variant="body2" color={status.color}>
              {status.message}
            </Typography>
          </Fade>
        )}

        <Stack direction="row" spacing={2}>
          <Button onClick={onClose} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => onAdd(selectedCategories.metric, status.newRows)}
            disabled={!status.isValid || isAdding}
            sx={{ whiteSpace: 'nowrap', minWidth: 'auto' }}
          >
            Add {status.newRows.length} row{status.newRows.length === 1 ? '' : 's'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
