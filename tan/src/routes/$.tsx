import { createFileRoute, useParams } from '@tanstack/react-router';

import Page from '@/components/pages/Page';

export const Route = createFileRoute('/$')({ component: CatchAllPage });

function CatchAllPage() {
  const { _splat: splat } = useParams({ strict: false });
  const path = '/' + (splat || '');

  return <Page path={path} />;
}
