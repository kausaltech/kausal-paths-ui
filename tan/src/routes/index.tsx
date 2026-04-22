import { createFileRoute } from '@tanstack/react-router';

import Page from '@/components/pages/Page';

export const Route = createFileRoute('/')({ component: HomePage });

function HomePage() {
  return <Page path="/" />;
}
