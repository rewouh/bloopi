/**
 * Bloopi sync Worker — stores one JSON blob per hashed passphrase.
 *
 * Deploy steps:
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler kv namespace create KV
 *      → copy the printed id into wrangler.toml
 *   4. wrangler deploy
 *      → copy the printed URL into src/logic/sync.js (WORKER_URL)
 */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return reply(null, 204);

    const auth = request.headers.get('Authorization') || '';
    const key  = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!/^[0-9a-f]{64}$/.test(key)) return reply('Unauthorized', 401);

    if (request.method === 'GET') {
      const data = await env.KV.get(key);
      return data ? reply(data, 200, 'application/json') : reply('Not found', 404);
    }

    if (request.method === 'PUT') {
      const body = await request.text();
      if (body.length > 2_000_000) return reply('Too large', 413);
      await env.KV.put(key, body);
      return reply('OK', 200);
    }

    return reply('Method not allowed', 405);
  },
};

function reply(body, status, type = 'text/plain') {
  return new Response(body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Content-Type': type,
    },
  });
}
