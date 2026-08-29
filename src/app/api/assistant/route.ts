import { postAssistantRequest } from '@paths-assistant/server';

// Keep the route in the public App Router tree while delegating its behavior
// to either the private implementation or the public no-op fallback.
export const runtime = 'nodejs';

export function POST(request: Request): Promise<Response> {
  return postAssistantRequest(request);
}
