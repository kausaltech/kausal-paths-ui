import { useEffect, useState } from 'react';

import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { useTranslations } from 'next-intl';
import { CheckCircle, Plus } from 'react-bootstrap-icons';

import { DataPointCommentReviewState } from '@/common/__generated__/graphql';
import DataPointChangeHistorySection from './DataPointChangeHistorySection';
import {
  type AddCommentInput,
  type CommentWithDataPoint,
  type SelectedCell,
  SelectedDataPointChips,
  formatCommentDate,
  getUserName,
  isCommentEdited,
} from './shared';

// Comments on the selected data point. Always operates within a single
// data-point context (the details panel only renders when a cell is selected),
// so there's no dataset-wide "show all" view here — that lives elsewhere.
function DataPointCommentsSection({
  dataPointId,
  comments,
  onSubmitComment,
  onSetResolved,
}: {
  dataPointId: string;
  comments: readonly CommentWithDataPoint[];
  onSubmitComment: (dataPointId: string, input: AddCommentInput) => Promise<void>;
  onSetResolved: (commentId: string, resolved: boolean) => Promise<void>;
}) {
  const t = useTranslations('model-editor');
  const visibleComments = comments.filter((c) => c.dataPointId === dataPointId);

  const [formOpen, setFormOpen] = useState(false);
  const [text, setText] = useState('');
  const [isReview, setIsReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Per-comment busy state while a resolve/unresolve mutation is in flight,
  // so multiple comments can be toggled independently.
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(() => new Set());

  // Close & reset the form when the selection changes — the form targets a
  // specific data point, so silently re-pointing it would be confusing.
  useEffect(() => {
    setFormOpen(false);
    setText('');
    setIsReview(false);
    setSubmitError(null);
  }, [dataPointId]);

  const handleSubmit = async () => {
    if (text.trim() === '' || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmitComment(dataPointId, { text: text.trim(), isReview });
      setFormOpen(false);
      setText('');
      setIsReview(false);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolved = async (commentId: string, resolved: boolean) => {
    if (resolvingIds.has(commentId)) return;
    setResolvingIds((prev) => new Set(prev).add(commentId));
    try {
      await onSetResolved(commentId, resolved);
    } catch {
      // Swallow — the Apollo cache won't update, so the checkbox snaps back.
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 2 }}>
        {t('datasets-comments')}{' '}
        <Typography component="span" variant="body2" color="text.secondary">
          ({visibleComments.length})
        </Typography>
      </Typography>

      <Button
        fullWidth
        variant={formOpen ? 'outlined' : 'contained'}
        size="small"
        startIcon={<Plus />}
        onClick={() => setFormOpen((v) => !v)}
        sx={{ mb: formOpen ? 1 : 2 }}
      >
        {t('datasets-comment-datapoint')}
      </Button>

      <Collapse in={formOpen} unmountOnExit>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack spacing={1.5}>
            <TextField
              label={t('datasets-comment')}
              value={text}
              onChange={(e) => setText(e.target.value)}
              multiline
              minRows={3}
              fullWidth
              size="small"
              autoFocus
              disabled={submitting}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={isReview}
                  onChange={(e) => setIsReview(e.target.checked)}
                  disabled={submitting}
                />
              }
              label={t('datasets-needs-review')}
            />
            {submitError && (
              <Alert severity="error" onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                variant="text"
                onClick={() => {
                  setFormOpen(false);
                  setText('');
                  setIsReview(false);
                  setSubmitError(null);
                }}
                disabled={submitting}
              >
                {t('common-cancel')}
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => void handleSubmit()}
                disabled={submitting || text.trim() === ''}
              >
                {submitting ? t('common-saving') : t('common-submit')}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>

      {visibleComments.length === 0 ? (
        <Typography color="text.secondary" variant="body2">
          {t('datasets-no-comments-datapoint')}
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {visibleComments.map((c) => {
            const resolved = c.reviewState === DataPointCommentReviewState.Resolved;
            const isResolving = resolvingIds.has(c.id);
            const needsReview = c.isReview && !resolved;
            return (
              <Paper
                key={c.id}
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: needsReview ? 'warning.lighter' : undefined,
                  borderColor: needsReview ? 'warning.light' : undefined,
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">{getUserName(c.createdBy ?? null, t)}</Typography>
                </Stack>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 1 }}>
                  {c.text}
                </Typography>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    {formatCommentDate(c.createdAt)}
                    {isCommentEdited(c.createdAt, c.lastModifiedAt) &&
                      t('datasets-comment-edited-suffix')}
                  </Typography>
                  {c.isReview && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={resolved}
                          disabled={isResolving}
                          onChange={(e) => {
                            void handleToggleResolved(c.id, e.target.checked);
                          }}
                          icon={<CheckCircle size={14} />}
                          checkedIcon={<CheckCircle size={14} />}
                        />
                      }
                      label={
                        <Typography variant="caption">
                          {resolved ? t('datasets-resolved') : t('datasets-resolve')}
                        </Typography>
                      }
                      sx={{ m: 0 }}
                    />
                  )}
                </Stack>
                {resolved && c.resolvedAt && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', textAlign: 'right', mt: 0.25 }}
                  >
                    {t('datasets-resolved-by', {
                      name: getUserName(c.resolvedBy ?? null, t),
                      date: formatCommentDate(c.resolvedAt),
                    })}
                  </Typography>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}

// Datapoint details drawer panel: identifies the selected data point with the
// same category chips the sources panel uses, then shows its comments and edit
// history.
export default function DataPointDetailsPanel({
  dataPointId,
  selectedCell,
  comments,
  onSubmitComment,
  onSetResolved,
}: {
  dataPointId: string | null;
  selectedCell: SelectedCell | null;
  comments: readonly CommentWithDataPoint[];
  onSubmitComment: (dataPointId: string, input: AddCommentInput) => Promise<void>;
  onSetResolved: (commentId: string, resolved: boolean) => Promise<void>;
}) {
  const t = useTranslations('model-editor');
  return (
    <>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('datasets-datapoint-details')}
      </Typography>
      {dataPointId && selectedCell ? (
        <>
          <SelectedDataPointChips cell={selectedCell} />
          <DataPointCommentsSection
            dataPointId={dataPointId}
            comments={comments}
            onSubmitComment={onSubmitComment}
            onSetResolved={onSetResolved}
          />
          <DataPointChangeHistorySection dataPointId={dataPointId} />
        </>
      ) : (
        <Typography color="text.secondary" variant="body2">
          {t('datasets-select-datapoint-for-details')}
        </Typography>
      )}
    </>
  );
}
