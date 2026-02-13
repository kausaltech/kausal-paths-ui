import { type FullConfig } from '@playwright/test';

import { displayConfiguration } from '@/common/context.js';

function globalSetup(_config: FullConfig) {
  displayConfiguration();
}

export default globalSetup;
