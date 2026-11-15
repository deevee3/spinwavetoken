/**
 * GET /poppy/tasks — SpinWave Poppy Stage 1 tasks endpoint (2026-11-14).
 * Same response for every caller: excluded tasks + feedback endpoint.
 * No access token is required and no Session claims are used, so the
 * response is served without Session verification (Poppy §9.2).
 * No skill_index: SpinWave publishes no Poppy skills in Stage 1.
 * Single onRequest handler with method dispatch (no mixed exports).
 */
import { TASKS_RESPONSE } from '../poppy-data.js';

export async function onRequest({ request }) {
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'invalid_request', message: 'Only GET is supported on this endpoint.' }),
      { status: 405, headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'GET' } },
    );
  }
  return new Response(JSON.stringify(TASKS_RESPONSE), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
