/** Public-build fallback for the optional private assistant endpoint. */
export function postAssistantRequest(_request: Request): Promise<Response> {
  return Promise.resolve(Response.json({ error: 'Not found' }, { status: 404 }));
}
