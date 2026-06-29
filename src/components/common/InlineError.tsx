'use client';

import { useState } from 'react';

import { Alert, AlertTitle, Box, Collapse, Link } from '@mui/material';

import type { ErrorLike } from '@apollo/client';
import { ChevronDown, ChevronRight } from 'react-bootstrap-icons';

import { isProductionDeployment } from '@common/env';

import { useTranslations } from '@/common/i18n';

type InlineErrorProps = {
  error?: ErrorLike | null;
  title?: string;
};

/**
 * Inline error banner shown when a query fails but we still want to render the
 * surrounding content. The technical error message is only exposed outside of
 * production deployments, tucked into a collapsible panel to keep it compact.
 */
export default function InlineError({ error, title }: InlineErrorProps) {
  const t = useTranslations('errors');
  const [open, setOpen] = useState(false);
  const showDetails = !isProductionDeployment() && error;

  return (
    <Alert severity="error" role="alert" sx={{ my: 2 }}>
      <AlertTitle>{title ?? t('generic-title')}</AlertTitle>
      {t('generic-intro')}
      {showDetails ? (
        <Box sx={{ mt: 1 }}>
          <Link
            component="button"
            type="button"
            color="inherit"
            underline="hover"
            onClick={() => setOpen((prev) => !prev)}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
            aria-expanded={open}
          >
            {open ? <ChevronDown /> : <ChevronRight />}
            {t('error-details')}
          </Link>
          <Collapse in={open}>
            <pre style={{ whiteSpace: 'pre-wrap', margin: '0.5rem 0 0' }}>{error.message}</pre>
          </Collapse>
        </Box>
      ) : null}
    </Alert>
  );
}
