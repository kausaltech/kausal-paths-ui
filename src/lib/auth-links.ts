/**
 * Query parameters that tell the register page what the new account is for.
 * Registration fails without one of them, so links between the auth pages
 * must carry them along.
 */
const REGISTRATION_CONTEXT_PARAMS = ['framework', 'invitation_code'] as const;

type SearchParamsLike = { get(name: string): string | null };

/** Append the registration context found in `searchParams` to `path`. */
export function withRegistrationContext(path: string, searchParams: SearchParamsLike): string {
  const params = new URLSearchParams();
  for (const name of REGISTRATION_CONTEXT_PARAMS) {
    const value = searchParams.get(name);
    if (value) params.set(name, value);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
