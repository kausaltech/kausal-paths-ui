import { createAuthClient } from 'better-auth/react';
import { genericOAuthClient } from 'better-auth/client/plugins';
import { customSessionClient } from 'better-auth/client/plugins';

import type { auth } from './auth';

export const authClient = createAuthClient({
  plugins: [genericOAuthClient(), customSessionClient<typeof auth>()],
});

export const { signIn, signOut, useSession } = authClient;
