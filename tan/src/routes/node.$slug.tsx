import { createFileRoute } from '@tanstack/react-router';

import NodePage from '@/pages/node/[slug]';

export const Route = createFileRoute('/node/$slug')({ component: NodePage });
