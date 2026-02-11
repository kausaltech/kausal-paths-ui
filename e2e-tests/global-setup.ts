import { type FullConfig } from '@playwright/test';

import { displayConfiguration } from './common/context';

function globalSetup(_config: FullConfig) {
  displayConfiguration(); // eslint-disable-line @typescript-eslint/no-unsafe-call
}

export default globalSetup;
