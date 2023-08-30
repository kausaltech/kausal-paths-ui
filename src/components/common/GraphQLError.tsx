import { useTranslation } from 'next-i18next';
import {
  Container,
  Button,
  Alert,
  Card,
  CardBody,
  UncontrolledCollapse,
} from 'reactstrap';

const GraphQLError = (props) => {
  const { errors } = props;
  console.log('error', errors);
  const { t } = useTranslation();
  return (
    <Alert color="warning">
      <h3>{t('error-loading-data')}</h3>
      {errors.graphQLErrors?.length && (
        <>
          <Button
            color="dark"
            size="sm"
            outline
            id="toggler"
            className="mt-2 mb-2"
          >
            Show error
          </Button>
          <UncontrolledCollapse toggler="#toggler">
            <Card>
              <CardBody>
                <small>
                  {errors.graphQLErrors.map((err) => (
                    <pre>
                      <p>
                        <code>
                          <strong>{err?.message}</strong>
                        </code>
                        <br />
                        <code>
                          {err.locations.map(
                            (loc) => `column: ${loc.column}, line: ${loc.line}`
                          )}
                        </code>
                        <br />
                        <code>[{err.path.map((pth) => `${pth}, `)}]</code>
                      </p>
                    </pre>
                  ))}
                </small>
              </CardBody>
            </Card>
          </UncontrolledCollapse>
        </>
      )}
    </Alert>
  );
};

export default GraphQLError;
