type LegacyHandler = (req: any, res: any) => Promise<unknown> | unknown;
type Query = Record<string, string | string[] | undefined>;

export function asRoute(handler: LegacyHandler) {
  return async function route(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const query: Query = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (query[key] === undefined) query[key] = value;
      else if (Array.isArray(query[key])) (query[key] as string[]).push(value);
      else query[key] = [String(query[key]), value];
    }

    let body: unknown;
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { body = await request.json(); }
        catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: { 'Cache-Control': 'no-store' } }); }
      }
    }

    const headers = Object.fromEntries(request.headers.entries());
    headers.host ||= url.host;
    const response = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      body: null as unknown,
      setHeader(name: string, value: string) { this.headers[name] = value; return this; },
      status(code: number) { this.statusCode = code; return this; },
      json(value: unknown) { this.body = value; return this; },
      end(value?: string) { this.body = value || null; return this; },
    };

    try {
      await handler({ method: request.method, url: request.url, headers, query, body }, response);
    } catch (error) {
      console.error('[EdgeX App Router API] handler failure', error instanceof Error ? error.name : 'Error');
      response.status(500).json({ error: 'Request unavailable' });
    }

    const responseHeaders = new Headers(response.headers);
    if (!responseHeaders.has('content-type')) responseHeaders.set('content-type', 'application/json; charset=utf-8');
    const payload = response.body == null ? null : typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
    return new Response(payload, { status: response.statusCode, headers: responseHeaders });
  };
}
