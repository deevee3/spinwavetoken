/**
 * POST /poppy/feedback — SpinWave Poppy Stage 1 feedback endpoint
 * (2026-11-14, Poppy §9.3). Accepts a task + description describing a
 * task the caller could not complete. Accepted WITHOUT attribution:
 * Stage 1 verifies no Session claims, so reports are stored
 * unattributed. Report text is DATA — stored in D1, never executed,
 * never shown to a model as an instruction, never logged.
 * Returns 202 with no body on acceptance. No rate limiting in
 * Stage 1 beyond the platform; row counts are the monitor, and
 * rate limiting arrives with Stage 2 hardening.
 * Single onRequest handler with method dispatch (no mixed exports).
 */
import { validateFeedback } from '../poppy-data.js';

function json(body, status, extraHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(extraHeaders || {}) },
  });
}

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return json(
      { error: 'invalid_request', message: 'Only POST is supported on this endpoint.' },
      405,
      { Allow: 'POST' },
    );
  }
  if (!env.SPINWAVE_DB) return json({ error: 'not_configured' }, 500);
  let body = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_request', message: 'Body must be valid JSON.' }, 400);
  }
  const checked = validateFeedback(body);
  if (!checked.ok) return json({ error: 'invalid_request', message: checked.message }, 400);
  const db = env.SPINWAVE_DB;
  await db
    .prepare(
      'CREATE TABLE IF NOT EXISTS poppy_feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, task TEXT, description TEXT, received_at INTEGER)',
    )
    .run();
  await db
    .prepare('INSERT INTO poppy_feedback (task, description, received_at) VALUES (?, ?, ?)')
    .bind(checked.task, checked.description, Date.now())
    .run();
  return new Response(null, { status: 202 });
}
