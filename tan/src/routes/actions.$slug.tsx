import { createFileRoute } from '@tanstack/react-router';

import ActionPage from '@/pages/actions/[slug]';

export const Route = createFileRoute('/actions/$slug')({ component: ActionPage });
