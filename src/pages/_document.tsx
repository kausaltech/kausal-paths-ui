import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import * as Sentry from "@sentry/nextjs";
import { ServerStyleSheet } from 'styled-components';
import { getThemeCSS } from 'common/theme';
import { setBasePath } from 'common/links';
import getConfig from 'next/config';


class PlansDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;
    let themeProps;
    const basePath = getConfig().publicRuntimeConfig.basePath;

    setBasePath(basePath);
    const sentryTraceId = Sentry.getCurrentHub()?.getScope()?.getTransaction()?.toTraceparent();
    try {
      ctx.renderPage = () => originalRenderPage({
        enhanceApp: (App) => (props) => {
          themeProps = props.themeProps;
          return sheet.collectStyles(<App {...props} />);
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
            {false && sentryTraceId && (
              <meta name="sentry-trace" content={sentryTraceId} />
            )}
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
      serverError = (
        <h1>Internal Server Error</h1>
      );
    }

    return (
      <Html lang={nextData?.locale}>
        <Head />
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
