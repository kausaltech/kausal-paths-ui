import type { ReactNode } from 'react';
import Head from 'next/head';

import styled from '@common/themes/styled';

import { useTranslations } from '@/common/i18n';

const MessageText = styled.p`
  color: #888888;
`;

function ProtectedPage() {
  const t = useTranslations('errors');

  return (
    <div className="mb-5">
      <Head>
        <title>{t('instance-protected')}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div className="rounded px-3 px-sm-4 py-3 py-sm-5 mb-5">
        <div className="container">
          <MessageText>{t('instance-protected')}</MessageText>
        </div>
      </div>
    </div>
  );
}

ProtectedPage.getLayout = (page: ReactNode) => page;

export default ProtectedPage;
