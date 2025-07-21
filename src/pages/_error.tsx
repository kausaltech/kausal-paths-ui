//import styles from '../../styles/server-error.module.css';
import NextErrorComponent, { type ErrorProps } from 'next/error';
import Head from 'next/head';

import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Button } from '@mui/material';
import * as Sentry from '@sentry/nextjs';
import type { NextPageContext } from 'next';
import { Card, CardBody, Col, Container, Row } from 'reactstrap';

import { isProductionDeployment } from '@common/env';
import { getLogger } from '@common/logging';

import { useTranslation } from '@/common/i18n';
import { Link } from '@/common/links';

const ErrorBackground = styled.div`
  background-color: ${(props) => props.theme.brandDark};
  min-height: 800px;
`;

const StyledCard = styled(Card)`
  margin-top: 5rem;
  text-align: center;
  width: 100%;
  transition: all 0.5s ease;
  overflow: hidden;
  border-width: ${(props) => props.theme.cardBorderWidth};
  border-radius: ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};

  h2 {
    margin-bottom: 2rem;
  }

  svg {
    width: 4rem;
    margin-bottom: 2rem;
    fill: ${(props) => props.theme.brandDark};
  }
`;

type AppErrorProps = ErrorProps & {
  hasGetInitialPropsRun?: boolean;
  err?: Error;
};

const PathsError = (props: AppErrorProps) => {
  const { hasGetInitialPropsRun, err, statusCode } = props;
  const logger = getLogger('error-page');
  logger.info(
    `rendering error page (statusCode=${statusCode}; hasGetInitialPropsRun=${hasGetInitialPropsRun})`
  );
  if (!hasGetInitialPropsRun && err && statusCode != 404) {
    // getInitialProps is not called in case of
    // https://github.com/vercel/next.js/issues/8592. As a workaround, we pass
    // err via _app.js so it can be captured
    Sentry.captureException(err);
    // Flushing is not required in this case as it only happens on the client
  }

  const errorIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" x="0px" y="0px">
      <title>emoticon, emoji, face, sick frowning</title>
      <g data-name="Layer 25">
        <path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28ZM8.61,14.72,11.2,13,8.61,11.28,9.72,9.61,14.8,13,9.72,16.39Zm14.78-3.44L20.8,13l2.59,1.72-1.11,1.67L17.2,13l5.08-3.39ZM21.62,22.22l.79.62-1.25,1.57-.78-.63c-3-2.39-5.77-2.39-8.76,0l-.78.63L9.59,22.84l.79-.62C14.05,19.27,18,19.27,21.62,22.22Z"></path>
      </g>
    </svg>
  );

  const theme = useTheme();
  const { t } = useTranslation('errors');

  let title = props.title;
  let intro: string | null = t('generic-intro');
  let apology: string | null = t('generic-apology');
  if (!title) {
    title = t('generic-title');
    if (statusCode) {
      if (statusCode === 404) {
        title = t('not-found-title');
        intro = t('not-found-intro');
        apology = null;
      } else if (statusCode !== 500) {
        title = t('error-with-code', { code: statusCode, ns: 'common' });
      }
    }
  }

  const specifiers: string[] = [];
  const traceId = Sentry.getCurrentScope()?.getPropagationContext().traceId;
  if (traceId) {
    specifiers.push(`${t('error-label')}: ${traceId}`);
  }
  if (statusCode) {
    specifiers.push(`HTTP ${statusCode}`);
  }
  let fullError: string | null = null;
  if (!isProductionDeployment() && err) {
    fullError = err.toString();
  }
  if (!theme) {
    return (
      <>
        <Head>
          <title>{title}</title>
        </Head>
        <main id="container">
          <div id="card">
            <h1>{title}</h1>
            <p>{intro}</p>
            {apology ? <p>{apology}</p> : null}
            {specifiers.map((msg, idx) => (
              <p key={idx} className="details">
                {msg}
              </p>
            ))}
            {fullError ? <pre className="details">{fullError}</pre> : null}
          </div>
        </main>
      </>
    );
  }

  return (
    <ErrorBackground className="mb-5">
      <Container>
        <Row>
          <Col md={{ size: 6, offset: 3 }}>
            <StyledCard>
              <CardBody>
                {errorIcon}
                <h2>{title}</h2>
                <p>{intro}</p>
                {apology ? <p>{apology}</p> : null}
                <Link href="/">
                  <a>
                    <Button variant="outlined" size="small" color="primary">
                      {t('return-to-front', { ns: 'common' })}
                    </Button>
                  </a>
                </Link>
              </CardBody>
            </StyledCard>
          </Col>
        </Row>
      </Container>
    </ErrorBackground>
  );
};

PathsError.getInitialProps = async (props: NextPageContext) => {
  const { err, asPath } = props;
  await Sentry.captureUnderscoreErrorException(props);
  const errorInitialProps: AppErrorProps = await NextErrorComponent.getInitialProps(props);

  // Workaround for https://github.com/vercel/next.js/issues/8592, mark when
  // getInitialProps has run
  errorInitialProps.hasGetInitialPropsRun = true;

  // Running on the server, the response object (`res`) is available.
  //
  // Next.js will pass an err on the server if a page's data fetching methods
  // threw or returned a Promise that rejected
  //
  // Running on the client (browser), Next.js will provide an err if:
  //
  //  - a page's `getInitialProps` threw or returned a Promise that rejected
  //  - an exception was thrown somewhere in the React lifecycle (render,
  //    componentDidMount, etc) that was caught by Next.js's React Error
  //    Boundary. Read more about what types of exceptions are caught by Error
  //    Boundaries: https://reactjs.org/docs/error-boundaries.html

  if (err) {
    if (err.statusCode != 404) {
      Sentry.captureException(err);
    }
    return errorInitialProps;
  }

  // If this point is reached, getInitialProps was called without any
  // information about what the error might be. This is unexpected and may
  // indicate a bug introduced in Next.js, so record it in Sentry
  Sentry.captureException(new Error(`_error.js getInitialProps missing data at path: ${asPath}`));
  return errorInitialProps;
};

export default PathsError;
