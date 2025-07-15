import {
  type DocumentContext,
  type DocumentProps,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

import {
  DocumentHeadTags,
  documentGetInitialProps,
  type DocumentHeadTagsProps,
} from '@mui/material-nextjs/v14-pagesRouter';
import * as Sentry from '@sentry/nextjs';
import { ServerStyleSheet } from 'styled-components';

import { getEnvScriptContents } from '@common/env/script-component';

import { getThemeStaticURL } from '@/common/theme';

import type { PathsAppProps } from './_app';

async function getInitialProps(ctx: DocumentContext) {
  const styledComponentsSheet = new ServerStyleSheet();
  let themeProps: PathsAppProps['themeProps'] | undefined;

  try {
    const muiProps = await documentGetInitialProps(ctx, {
      plugins: [
        {
          // Include styled-components styles and theme stylesheet
          enhanceApp: (App) => (props) => {
            themeProps = props.themeProps;

            return styledComponentsSheet.collectStyles(<App {...props} />);
          },
          resolveProps: async (initialProps) => ({
            ...initialProps,
            styles: (
              <>
                {styledComponentsSheet.getStyleElement()}
                {initialProps.styles}
                {themeProps && (
                  <link
                    data-name="potato"
                    rel="stylesheet"
                    type="text/css"
                    href={getThemeStaticURL(themeProps.mainCssFile)}
                  />
                )}
              </>
            ),
          }),
        },
      ],
    });

    return muiProps;
  } finally {
    styledComponentsSheet.seal();
  }
}

function PlansDocument(props: DocumentProps & DocumentHeadTagsProps) {
  const nextData = props.__NEXT_DATA__;
  let serverError;

  if (!nextData) {
    serverError = <h1>Internal Server Error</h1>;
  }

  return (
    <Html lang={nextData?.locale}>
      <Head>
        <DocumentHeadTags {...props} />
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

PlansDocument.getInitialProps = getInitialProps;

export default PlansDocument;
