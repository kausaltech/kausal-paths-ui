import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';

import { X } from 'react-bootstrap-icons';

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const YEAR_RE = /^\d{4}$/;

function isValidYearStr(s: string): boolean {
  if (!YEAR_RE.test(s)) return false;
  const n = parseInt(s, 10);
  return n >= MIN_YEAR && n <= MAX_YEAR;
}

function getYearRange(startStr: string, endStr: string): number[] {
  const start = parseInt(startStr, 10);
  const end = parseInt(endStr, 10);
  if (Number.isNaN(start)) return [];
  const effectiveEnd = Number.isNaN(end) || end < start ? start : end;
  const out: number[] = [];
  for (let y = start; y <= effectiveEnd; y++) out.push(y);
  return out;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onAddYears: (years: number[]) => void;
  existingYears: readonly number[];
};

export function AddYearsModal({ open, onClose, onAddYears, existingYears }: Props) {
  const latestYear =
    existingYears.length > 0 ? Math.max(...existingYears) : new Date().getFullYear();
  const nextYear = Math.min(latestYear + 1, MAX_YEAR);

  const [startYear, setStartYear] = useState(nextYear.toString());
  const [endYear, setEndYear] = useState('');
  const [startError, setStartError] = useState('');
  const [endError, setEndError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Reset on each open so stale state from a previous open doesn't leak.
  // Adjust-state-during-render pattern (React docs) — avoids the cascading
  // re-render an effect would cause.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setStartYear(nextYear.toString());
      setEndYear('');
      setStartError('');
      setEndError('');
      setInfoMessage('');
    }
  }

  const validateYears = useCallback(
    (startStr: string, endStr: string) => {
      if (!isValidYearStr(startStr)) {
        setStartError(`Start year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
        setEndError('');
        setInfoMessage('');
        return;
      }
      const hasEnd = endStr.trim() !== '';
      if (hasEnd && !isValidYearStr(endStr)) {
        setEndError(`End year must be between ${MIN_YEAR} and ${MAX_YEAR}`);
        setStartError('');
        setInfoMessage('');
        return;
      }
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (hasEnd && end < start) {
        setEndError('End year must be greater than or equal to the start year');
        setStartError('');
        setInfoMessage('');
        return;
      }

      setStartError('');
      setEndError('');

      const years = getYearRange(startStr, hasEnd ? endStr : startStr);
      const existingCount = years.filter((y) => existingYears.includes(y)).length;
      setInfoMessage(
        existingCount > 0
          ? `${existingCount} year${existingCount === 1 ? '' : 's'} from this range already exist${
              existingCount === 1 ? 's' : ''
            }`
          : ''
      );
    },
    [existingYears]
  );

  // Debounce live validation as the user types — avoids the error message
  // flickering for transient invalid states (e.g. mid-typing "20" → "2024").
  useEffect(() => {
    const t = setTimeout(() => validateYears(startYear, endYear), 100);
    return () => clearTimeout(t);
  }, [startYear, endYear, validateYears]);

  const newYearCount = useMemo(() => {
    const years = getYearRange(startYear, endYear);
    return years.filter((y) => !existingYears.includes(y)).length;
  }, [startYear, endYear, existingYears]);

  const errorMessage = startError || endError;

  const handleConfirm = () => {
    const years = getYearRange(startYear, endYear);
    const newYears = years.filter((y) => !existingYears.includes(y));
    if (newYears.length > 0) onAddYears(newYears);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={(e) => {
        if (e.key === 'Enter' && newYearCount > 0) {
          e.preventDefault();
          handleConfirm();
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1.5}>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', p: 0 }}>Add years</DialogTitle>
        <IconButton onClick={onClose} size="small">
          <X />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Add a single year, or a range by entering both first and last year.
        </Typography>
        <Box display="flex" gap={2} mb={1}>
          <Box flex={1}>
            <Typography fontWeight="bold" sx={{ mb: 0.5 }}>
              First year
            </Typography>
            <TextField
              type="number"
              fullWidth
              placeholder="YYYY"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              onBlur={() => validateYears(startYear, endYear)}
              slotProps={{
                input: { inputProps: { min: MIN_YEAR, max: MAX_YEAR, step: 1 } },
              }}
              error={Boolean(startError)}
            />
          </Box>
          <Box flex={1}>
            <Typography fontWeight="bold" sx={{ mb: 0.5 }}>
              Last year
            </Typography>
            <TextField
              type="number"
              fullWidth
              placeholder="YYYY"
              value={endYear}
              onFocus={() => {
                // Pre-fill end with start so up-arrow / typing extends the range
                // intuitively from the already-chosen first year.
                if (!endYear && isValidYearStr(startYear)) {
                  setEndYear(startYear);
                  validateYears(startYear, startYear);
                }
              }}
              onChange={(e) => setEndYear(e.target.value)}
              onBlur={() => validateYears(startYear, endYear)}
              slotProps={{
                input: {
                  inputProps: {
                    step: 1,
                    min: startYear ? parseInt(startYear, 10) : undefined,
                    max: MAX_YEAR,
                  },
                },
              }}
              error={Boolean(endError)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') {
                  setEndYear((prev) => (parseInt(prev || startYear, 10) + 1).toString());
                  e.preventDefault();
                } else if (e.key === 'ArrowDown') {
                  setEndYear((prev) => (parseInt(prev || startYear, 10) - 1).toString());
                  e.preventDefault();
                }
              }}
            />
          </Box>
        </Box>
        <Divider sx={{ my: 2 }} />
        {errorMessage && (
          <Typography color="error" sx={{ mt: 1, fontSize: '0.9rem' }}>
            {errorMessage}
          </Typography>
        )}
        {!errorMessage && infoMessage && (
          <Typography color="text.secondary" sx={{ mt: 1, fontSize: '0.9rem' }}>
            {infoMessage}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={newYearCount === 0}>
          Add {newYearCount} year{newYearCount === 1 ? '' : 's'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
