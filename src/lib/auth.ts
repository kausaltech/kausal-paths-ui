import { betterAuth } from 'better-auth';
import { getAccountCookie } from 'better-auth/cookies';
import { nextCookies } from 'better-auth/next-js';
import { customSession, genericOAuth } from 'better-auth/plugins';

import { getAuthIssuer, getWildcardDomains, isLocalDev } from '@common/env';

import { KAUSAL_PROVIDER_ID } from './auth-const';

function getAllowedHosts(): string[] {
  const hosts: string[] = [];

  // Wildcard domains (WILDCARD_DOMAINS env var, e.g. "localhost,paths.kausal.dev")
  // become patterns like "*.localhost:*" for better-auth's host matching.
  for (const domain of getWildcardDomains()) {
    hosts.push(`*.${domain}`);
    if (isLocalDev) {
      hosts.push(`*.${domain}:*`);
    }
  }

  // Single-instance hostnames (AUTH_ALLOWED_HOSTS env var) are passed through
  // directly. These are customer-controlled domains that don't follow the
  // wildcard pattern. The helm chart populates this from ingress config.
  const extra = process.env.AUTH_ALLOWED_HOSTS;
  if (extra) {
    for (const host of extra.split(',')) {
      const trimmed = host.trim();
      if (trimmed) hosts.push(trimmed);
    }
  }

  return hosts;
}

export const auth = betterAuth({
  basePath: '/api/auth',
  baseURL: {
    allowedHosts: getAllowedHosts(),
  },
  secret: process.env.AUTH_SECRET,
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      strategy: 'jwe',
      refreshCache: true,
    },
  },
  account: {
    storeStateStrategy: 'cookie',
    storeAccountCookie: true,
  },
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: KAUSAL_PROVIDER_ID,
          discoveryUrl: `${getAuthIssuer()}/.well-known/openid-configuration`,
          clientId: process.env.AUTH_CLIENT_ID!,
          clientSecret: process.env.AUTH_CLIENT_SECRET!,
          scopes: ['openid', 'email', 'profile'],
          pkce: true,
        },
      ],
    }),
    customSession(async ({ user, session }, ctx) => {
      const account = await getAccountCookie(ctx);
      return {
        user,
        session,
        accessToken: account?.accessToken ?? null,
      };
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
