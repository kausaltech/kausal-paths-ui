import ThemeLoader from 'common/ThemeLoader';
import StyledComponentsRegistry from 'common/styled';
import ApolloWrapper from './ApolloWrapper';
import { headers } from 'next/headers';
import { ApolloClientOpts } from 'common/apollo';
import { SiteContextProvider } from 'context/site';
import getConfig from 'next/config';
import SiteContextLoader from 'context/SiteContextLoader';
import Layout from 'components/Layout';

type RootLayoutProps = {
  children: React.ReactNode;
};

export const dynamic = 'force-dynamic';

function getApolloOpts() {
  const { publicRuntimeConfig } = getConfig();
  const hdr = headers();
  const opts: ApolloClientOpts = {
    apiUri: publicRuntimeConfig.graphqlUrl,
    instanceIdentifier: hdr.get('x-instance-identifier')!,
    instanceHostname: hdr.get('x-host')!,
  };
  return opts;
}

export default async function RootLayout(props: RootLayoutProps) {
  const { children } = props;

  return (
    <html lang="en">
      <body>
        <SiteContextLoader>
          <ApolloWrapper opts={getApolloOpts()}>
            <StyledComponentsRegistry>
              <ThemeLoader>
                <Layout>{children}</Layout>
              </ThemeLoader>
            </StyledComponentsRegistry>
          </ApolloWrapper>
        </SiteContextLoader>
      </body>
    </html>
  );
}
