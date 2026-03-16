import { createFileRoute } from '@tanstack/react-router';

import ModelPage from '@/pages/model/index';

export const Route = createFileRoute('/model')({ component: ModelPage });
