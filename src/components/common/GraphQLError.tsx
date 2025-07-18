import type { ApolloError } from '@apollo/client';
import { Button } from '@mui/material';
import * as Sentry from '@sentry/nextjs';
import { useTranslation } from 'next-i18next';
import { Alert, Card, CardBody, UncontrolledCollapse } from 'reactstrap';

import { isProductionDeployment } from '@common/env';

type GraphQLErrorProps = {
  error: ApolloError;
};

const GraphQLError = (props: GraphQLErrorProps) => {
  const { error } = props;
  const { t } = useTranslation();
  let errorDetailMsg: string | null = null;

  Sentry.captureException(error);
  if (error.networkError) {
    errorDetailMsg = `${t('errors:network-error')}: ${error.networkError.toString()}`;
  }

  return (
    <Alert color="warning">
      <h3>{t('error-loading-data')}</h3>
      {errorDetailMsg}
      {!isProductionDeployment() && error.graphQLErrors?.length ? (
        <>
          <Button size="small" variant="outlined" id="toggler" className="mt-2 mb-2">
            {t('show-error')}
          </Button>
          <UncontrolledCollapse toggler="#toggler">
            <Card>
              <CardBody>
                <small>
                  {error.graphQLErrors.map((err, idx) => (
                    <pre key={idx}>
                      <p>
                        <code>
                          <strong>{err?.message}</strong>
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
              </CardBody>
            </Card>
          </UncontrolledCollapse>
        </>
      ) : null}
    </Alert>
  );
};

export default GraphQLError;
