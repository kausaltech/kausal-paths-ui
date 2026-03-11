/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from '@playwright/test';

import type { InstanceContext } from '@/common/context.js';

export { expect } from '@playwright/test';

export const test = base.extend<{ ctx: InstanceContext }>({
  page: async ({ page }, use) => {
    await use(page);
  },
});
