import React from 'react';

import Head from 'next/head';

import { useSiteWithSetter } from '@/context/site';

const FullScreenLayout = ({ children }: React.PropsWithChildren) => {
  const [site] = useSiteWithSetter();

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta name="robots" content="noindex" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={site.title} />
      </Head>

      {/* Persistent drawer for desktop */}
      <main className="main" id="main">
        {children}
      </main>
    </>
  );
};

export const getLayout = (page) => <FullScreenLayout>{page}</FullScreenLayout>;

export default FullScreenLayout;
