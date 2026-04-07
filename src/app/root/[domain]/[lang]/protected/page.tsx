'use client';

import type { Metadata } from 'next';

import styled from '@common/themes/styled';

import { useTranslations } from '@/common/i18n';

const MessageText = styled.p`
  color: #888888;
`;

export default function ProtectedPage() {
  const t = useTranslations('errors');

  return (
    <div className="mb-5">
      <div className="rounded px-3 px-sm-4 py-3 py-sm-5 mb-5">
        <div className="container">
          <MessageText>{t('instance-protected')}</MessageText>
        </div>
      </div>
    </div>
  );
}
