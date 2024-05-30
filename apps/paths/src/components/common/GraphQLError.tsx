import { ApolloError } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import * as Sentry from '@sentry/nextjs';
import {
  Container,
  Button,
  Alert,
  Card,
  CardBody,
  UncontrolledCollapse,
} from 'reactstrap';
import getConfig from 'next/config';

type GraphQLErrorProps = {
  error: ApolloError;
};

const GraphQLError = (props: GraphQLErrorProps) => {
  const { error } = props;
  const { t } = useTranslation();
  const { publicRuntimeConfig } = getConfig();
  const isProd = publicRuntimeConfig?.deploymentType === 'production';
  let errorDetailMsg: string | null = null;

  Sentry.captureException(error);
  if (error.networkError) {
    errorDetailMsg = `${t(
      'errors:network-error'
    )}: ${error.networkError.toString()}`;
  }

  return (
    <Alert color="warning">
      <h3>{t('error-loading-data')}</h3>
      {errorDetailMsg}
      {!isProd && error.graphQLErrors?.length ? (
        <>
          <Button
            color="dark"
            size="sm"
            outline
            id="toggler"
            className="mt-2 mb-2"
          >
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
                        <code>
                          [{(err.path ?? []).map((pth) => `${pth}, `)}]
                        </code>
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
