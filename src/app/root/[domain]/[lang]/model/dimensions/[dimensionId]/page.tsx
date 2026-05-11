'use client';

import { use } from 'react';

import DimensionEditor from '@/components/model-editor/dimensions/DimensionEditor';

type Props = {
  params: Promise<{ dimensionId: string }>;
};

export default function DimensionEditPage({ params }: Props) {
  const { dimensionId } = use(params);
  return <DimensionEditor dimensionId={dimensionId} />;
}
