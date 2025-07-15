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

async function getInitialProps(ctx: DocumentContext) {
  const muiProps = await documentGetInitialProps(ctx);

  return muiProps;
}

function PathsDocument(props: DocumentProps & DocumentHeadTagsProps) {
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

PathsDocument.getInitialProps = getInitialProps;

export default PathsDocument;
