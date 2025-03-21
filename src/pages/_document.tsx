import Document, { type DocumentContext, Head, Html, Main, NextScript } from 'next/document';

import { ServerStyleSheet } from 'styled-components';

import { getEnvScriptContents } from '@common/env/script-component';

import { getThemeStaticURL } from '@/common/theme';

import type { PathsAppProps } from './_app';

class PlansDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;
    let themeProps: PathsAppProps['themeProps'] | undefined;
    //const sentryTrace = Sentry.getTraceData();
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
              <link
                rel="stylesheet"
                type="text/css"
                href={getThemeStaticURL(themeProps.mainCssFile)}
              />
            )}
            {/*Object.entries(sentryTrace).filter(([_, value]) => !!value).map(([key, value]) => (
              <meta key={key} name={key} content={value} />
            ))*/}
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
          <script
            id="public-runtime-env"
            dangerouslySetInnerHTML={{
              __html: getEnvScriptContents(),
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
