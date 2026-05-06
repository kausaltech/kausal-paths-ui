'use client';

import { use } from 'react';

import DatasetEditor from '@/components/model-editor/datasets/DatasetEditor';

type Props = {
  params: Promise<{ datasetId: string }>;
};

export default function DatasetEditPage({ params }: Props) {
  const { datasetId } = use(params);
  return <DatasetEditor datasetId={datasetId} />;
}
