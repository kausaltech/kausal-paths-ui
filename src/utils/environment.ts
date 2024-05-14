export const isProduction = process.env.NODE_ENV === 'production';
export const isLocal = process.env.NODE_ENV === 'development';

export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.paths.kausal.tech/v1';

export const wildcardDomains = process.env.NEXT_PUBLIC_WILDCARD_DOMAINS
  ? process.env.NEXT_PUBLIC_WILDCARD_DOMAINS.split(',').map((s) =>
      s.toLowerCase()
    )
  : isLocal
  ? ['localhost']
  : [];

export const gqlUrl = `${apiUrl}/graphql/`;

console.log(`Backend API URL: ${gqlUrl}`);
