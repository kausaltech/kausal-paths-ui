'use client';

import { Alert, Button, Snackbar } from '@mui/material';

import { useReactiveVar } from '@apollo/client/react';

import { staleVersionNotificationVar } from './queries';

/**
 * Persistent snackbar shown when a mutation was rejected because another
 * tab / user edited this instance since we read the optimistic-locking
 * token. Offers a Reload action — field-level conflict detection isn't
 * available yet, so the safest recovery is a fresh load of the editor.
 */
export default function StaleVersionNotice() {
  const open = useReactiveVar(staleVersionNotificationVar);
  const dismiss = () => staleVersionNotificationVar(false);

  return (
    <Snackbar open={open} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <Alert
        severity="warning"
        onClose={dismiss}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => {
              staleVersionNotificationVar(false);
              window.location.reload();
            }}
          >
            Reload
          </Button>
        }
      >
        This model was edited in another tab. Reload to see the latest changes.
      </Alert>
    </Snackbar>
  );
}
