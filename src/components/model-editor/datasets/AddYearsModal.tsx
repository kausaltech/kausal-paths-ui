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

import { useTranslations } from 'next-intl';
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

type ValidationError = { field: 'start' | 'end'; message: string } | null;

function getValidationError(
  startStr: string,
  endStr: string,
  t: ReturnType<typeof useTranslations>
): ValidationError {
  if (!isValidYearStr(startStr)) {
    return {
      field: 'start',
      message: t('datasets-add-years-start-range', { min: MIN_YEAR, max: MAX_YEAR }),
    };
  }
  const hasEnd = endStr.trim() !== '';
  if (hasEnd && !isValidYearStr(endStr)) {
    return {
      field: 'end',
      message: t('datasets-add-years-end-range', { min: MIN_YEAR, max: MAX_YEAR }),
    };
  }
  if (hasEnd && parseInt(endStr, 10) < parseInt(startStr, 10)) {
    return {
      field: 'end',
      message: t('datasets-add-years-end-before-start'),
    };
  }
  return null;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onAddYears: (years: number[]) => void;
  existingYears: readonly number[];
};

export function AddYearsModal({ open, onClose, onAddYears, existingYears }: Props) {
  const t = useTranslations('model-editor');
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
      const error = getValidationError(startStr, endStr, t);
      if (error) {
        setStartError(error.field === 'start' ? error.message : '');
        setEndError(error.field === 'end' ? error.message : '');
        setInfoMessage('');
        return;
      }

      setStartError('');
      setEndError('');

      const hasEnd = endStr.trim() !== '';
      const years = getYearRange(startStr, hasEnd ? endStr : startStr);
      const existingCount = years.filter((y) => existingYears.includes(y)).length;
      setInfoMessage(
        existingCount > 0 ? t('datasets-add-years-already-exist', { count: existingCount }) : ''
      );
    },
    [existingYears, t]
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
    // Re-validate synchronously: the debounced effect may not have run yet for
    // the current inputs, so relying on startError/endError state would let an
    // out-of-range value (e.g. 1800) slip through.
    const error = getValidationError(startYear, endYear, t);
    if (error) {
      setStartError(error.field === 'start' ? error.message : '');
      setEndError(error.field === 'end' ? error.message : '');
      return;
    }
    const years = getYearRange(startYear, endYear);
    const newYears = years.filter((y) => !existingYears.includes(y));
    if (newYears.length > 0) onAddYears(newYears);
    onClose();
  };

  const canConfirm = newYearCount > 0 && !errorMessage;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      onKeyDown={(e) => {
        if (e.key === 'Enter' && canConfirm) {
          e.preventDefault();
          handleConfirm();
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" px={2} py={1.5}>
        <DialogTitle sx={{ fontWeight: 'bold', fontSize: '1.2rem', p: 0 }}>
          {t('datasets-add-years')}
        </DialogTitle>
        <IconButton onClick={onClose} size="small">
          <X />
        </IconButton>
      </Box>

      <DialogContent sx={{ pt: 1, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {t('datasets-add-years-desc')}
        </Typography>
        <Box display="flex" gap={2} mb={1}>
          <Box flex={1}>
            <Typography fontWeight="bold" sx={{ mb: 0.5 }}>
              {t('datasets-add-years-first')}
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
              {t('datasets-add-years-last')}
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
        <Button onClick={onClose}>{t('common-cancel')}</Button>
        <Button onClick={handleConfirm} variant="contained" disabled={!canConfirm}>
          {t('datasets-add-years-confirm', { count: newYearCount })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
