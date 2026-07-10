export function json<T>(data: T, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...(init?.headers ?? {}),
    },
  });
}

export function error(message: string, status = 400) {
  return json({ ok: false, error: message }, { status });
}

export function textFile(body: string, contentType = 'text/plain; charset=utf-8') {
  return new Response(body, {
    headers: {
      'content-type': contentType,
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex, nofollow',
    },
  });
}
