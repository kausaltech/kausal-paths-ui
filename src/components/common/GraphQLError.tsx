import { useId, useState } from 'react';

import { Alert, Button, Card, CardContent, Collapse } from '@mui/material';

import type { ErrorLike } from '@apollo/client/core';
import { CombinedGraphQLErrors, CombinedProtocolErrors, LinkError } from '@apollo/client/errors';
import * as Sentry from '@sentry/nextjs';
import type { GraphQLFormattedError } from 'graphql';

import { isProductionDeployment } from '@common/env';

import { useTranslation } from '@/common/i18n';

type GraphQLErrorProps = {
  error: ErrorLike;
};

const GraphQLError = (props: GraphQLErrorProps) => {
  const { error } = props;
  const { t } = useTranslation('common');
  const { t: tErrors } = useTranslation('errors');
  const [showDetails, setShowDetails] = useState(false);
  const detailsId = useId();
  let errorDetailMsg: string | null = null;

  Sentry.captureException(error);
  if (LinkError.is(error)) {
    errorDetailMsg = `${String(tErrors('network-error'))}: ${String(error.message)}`;
  }
  let graphQLErrors: readonly GraphQLFormattedError[] | null;
  if (CombinedGraphQLErrors.is(error) || CombinedProtocolErrors.is(error)) {
    graphQLErrors = error.errors;
  } else {
    graphQLErrors = null;
  }

  return (
    <Alert severity="warning">
      <h3>{t('error-loading-data')}</h3>
      {errorDetailMsg}
      {!isProductionDeployment() && graphQLErrors?.length ? (
        <>
          <Button
            size="small"
            variant="outlined"
            sx={{ my: 1 }}
            onClick={() => setShowDetails(!showDetails)}
            aria-expanded={showDetails}
            aria-controls={detailsId}
          >
            {t('show-error')}
          </Button>
          <Collapse in={showDetails} id={detailsId}>
            <Card>
              <CardContent>
                <small>
                  {graphQLErrors?.map((err, idx) => (
                    <pre key={idx}>
                      <p>
                        <code>
                          <strong>{err.message}</strong>
                        </code>
                        <br />
                        <code>
                          {(err.locations ?? []).map(
                            (loc) => `column: ${loc.column}, line: ${loc.line}`
                          )}
                        </code>
                        <br />
                        <code>[{(err.path ?? []).map((pth) => `${pth}, `)}]</code>
                      </p>
                    </pre>
                  ))}
                </small>
              </CardContent>
            </Card>
          </Collapse>
        </>
      ) : null}
    </Alert>
  );
};

export default GraphQLError;
