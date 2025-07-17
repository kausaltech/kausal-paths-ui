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
  type DocumentHeadTagsProps,
  documentGetInitialProps,
} from '@mui/material-nextjs/v14-pagesRouter';

import { getEnvScriptContents } from '@common/env/script-component';

import { getThemeStaticURL } from '@/common/theme';

import type { PathsAppProps } from './_app';

async function getInitialProps(ctx: DocumentContext) {
  let themeProps: PathsAppProps['pageProps']['themeProps'] = null;

  const props = await documentGetInitialProps(ctx, {
    // Get the theme props from the app for the theme stylesheet
    plugins: [
      {
        enhanceApp: (App) => (props: PathsAppProps) => {
          themeProps = props.themeProps;
          return <App {...props} />;
        },
        resolveProps: async (props) => Promise.resolve({ ...props, themeProps }),
      },
    ],
  });

  return props;
}

function PathsDocument({
  themeProps,
  ...props
}: DocumentProps & DocumentHeadTagsProps & PathsAppProps) {
  const nextData = props.__NEXT_DATA__;
  let serverError;

  if (!nextData) {
    serverError = <h1>Internal Server Error</h1>;
  }

  return (
    <Html lang={nextData?.locale}>
      <Head>
        {themeProps && (
          <link
            id="theme-stylesheet"
            rel="stylesheet"
            type="text/css"
            href={getThemeStaticURL(themeProps.mainCssFile)}
          />
        )}
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

PathsDocument.getInitialProps = getInitialProps;

export default PathsDocument;
