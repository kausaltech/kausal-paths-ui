import {
  Alert,
  Backdrop,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Typography,
} from '@mui/material';

import type { NodeCrudActions } from './useNodeCrudActions';

/**
 * The UI half of useNodeCrudActions: the busy backdrop while a create /
 * duplicate / delete mutation is in flight, the delete confirmation dialog,
 * and the success / error snackbar.
 */
export default function NodeCrudDialogs({ crud }: { crud: NodeCrudActions }) {
  const { feedback, deleteConfirmNode, isDuplicating, isCreating, isDeleting } = crud;
  return (
    <>
      <Backdrop
        open={isDuplicating || isDeleting || isCreating}
        sx={(theme) => ({
          zIndex: theme.zIndex.modal + 1,
          flexDirection: 'column',
          gap: 2,
          color: 'common.white',
        })}
      >
        <CircularProgress color="inherit" />
        <Typography variant="body2">
          {isDeleting ? 'Deleting node…' : isCreating ? 'Creating node…' : 'Duplicating node…'}
        </Typography>
      </Backdrop>
      <Dialog open={deleteConfirmNode !== null && !isDeleting} onClose={crud.cancelDelete}>
        <DialogTitle>Delete node?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Permanently delete &quot;{deleteConfirmNode?.name}&quot; and all of its edges. This
            cannot be undone without reverting to the last published revision.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={crud.cancelDelete}>Cancel</Button>
          <Button onClick={crud.confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={feedback !== null}
        autoHideDuration={feedback?.kind === 'error' ? null : 4000}
        onClose={crud.dismissFeedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {feedback ? (
          <Alert
            onClose={crud.dismissFeedback}
            severity={feedback.kind === 'success' ? 'success' : 'error'}
            variant="filled"
          >
            {feedback.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
