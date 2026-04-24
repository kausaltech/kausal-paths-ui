'use client';

import { Button, Card, CardContent, Container, Grid } from '@mui/material';

import * as Sentry from '@sentry/nextjs';

import { isProductionDeployment } from '@common/env';
import { getLogger } from '@common/logging';
import { useTheme } from '@common/themes';
import styled from '@common/themes/styled';

import { useTranslations } from '@/common/i18n';
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

type PathsErrorProps = {
  statusCode?: number;
  title?: string;
  err?: Error;
};

const errorIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" x="0px" y="0px">
    <title>emoticon, emoji, face, sick frowning</title>
    <g data-name="Layer 25">
      <path d="M16,2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Zm0,26A12,12,0,1,1,28,16,12,12,0,0,1,16,28ZM8.61,14.72,11.2,13,8.61,11.28,9.72,9.61,14.8,13,9.72,16.39Zm14.78-3.44L20.8,13l2.59,1.72-1.11,1.67L17.2,13l5.08-3.39ZM21.62,22.22l.79.62-1.25,1.57-.78-.63c-3-2.39-5.77-2.39-8.76,0l-.78.63L9.59,22.84l.79-.62C14.05,19.27,18,19.27,21.62,22.22Z"></path>
    </g>
  </svg>
);

export default function PathsError({ statusCode, title: titleProp, err }: PathsErrorProps) {
  const logger = getLogger('error-page');
  logger.info(`rendering error page (statusCode=${statusCode})`);

  if (err && statusCode !== 404) {
    Sentry.captureException(err);
  }

  const theme = useTheme();
  const t = useTranslations('errors');
  const tCommon = useTranslations('common');

  let title = titleProp;
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
        title = tCommon('error-with-code', { code: statusCode });
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
        <title>{title}</title>
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
      <Container fixed maxWidth="xl">
        <Grid container spacing={2}>
          <Grid size={{ md: 6 }} offset={{ md: 3 }}>
            <StyledCard>
              <CardContent>
                {errorIcon}
                <h2>{title}</h2>
                <p>{intro}</p>
                {apology ? <p>{apology}</p> : null}
                <Link href="/">
                  <Button variant="outlined" size="small" color="primary">
                    {tCommon('return-to-front')}
                  </Button>
                </Link>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </Container>
    </ErrorBackground>
  );
}
