import Document, { type DocumentContext, Head, Html, Main, NextScript } from 'next/document';
import Script from 'next/script';

import * as Sentry from '@sentry/nextjs';
import { getThemeCSS } from 'common/theme';
import { PUBLIC_ENV_KEY } from 'next-runtime-env/build/script/constants';
import { ServerStyleSheet } from 'styled-components';

import { exportRuntimeConfig } from '@/common/environment';
import type { PathsAppProps } from './_app';

class PlansDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;
    let themeProps: PathsAppProps['themeProps'] | undefined;
    const sentryTraceId = Sentry.getCurrentScope().getPropagationContext().traceId;
    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props: PathsAppProps) => {
            themeProps = props.themeProps;
            const ret = sheet.collectStyles(<App {...props} />);
            return ret;
          },
        });
      const initialProps = await Document.getInitialProps(ctx);
      return {
        ...initialProps,
        styles: (
          <>
            {initialProps.styles}
            {sheet.getStyleElement()}
            {themeProps && (
              <link rel="stylesheet" type="text/css" href={getThemeCSS(themeProps.name)} />
            )}
            {null && sentryTraceId && <meta name="sentry-trace" content={sentryTraceId} />}
          </>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    const nextData = this.props.__NEXT_DATA__;
    let serverError;

    if (!nextData) {
      serverError = <h1>Internal Server Error</h1>;
    }

    return (
      <Html lang={nextData?.locale}>
        <Head>
          <Script
            id="runtime-env"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `window['${PUBLIC_ENV_KEY}'] = ${JSON.stringify(exportRuntimeConfig())}`,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
          {serverError}
        </body>
      </Html>
    );
  }
}

export default PlansDocument;
