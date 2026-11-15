/**
 * SpinWave Poppy Stage 1 — shared discovery + tasks data (2026-11-14).
 *
 * Stage 1 is SIGNED-OUT ONLY: no issuer, no sign-in, no scopes, no
 * Company Agent, no browser join. This module is data, not behavior:
 * the poppy.json document and the tasks response are the same for
 * every caller, so nothing here uses Session claims.
 *
 * poppy.json is served ONLY on spinwave.tech (see _middleware.js).
 * The same deploy also serves spinwave.pages.dev — that host must
 * never speak as the Company, so it gets a 404 for poppy.json.
 * Do not add an `auth`, `agent`, or `browser_session_endpoint`
 * entry here until the corresponding build exists and is proven.
 */

export const POPPY_JSON = {
  protocol_version: '1.0',
  organization: {
    name: 'SpinWave',
    domain: 'spinwave.tech',
  },
  web: {},
  tasks: {
    endpoint: 'https://spinwave.tech/poppy/tasks',
  },
  apis: [
    {
      type: 'openapi',
      url: 'https://spinwave.tech/poppy/openapi.json',
      description:
        'Read SpinWave records, verify certificates, and read canonical certificate documents. Signed-out; no sign-in is offered through this description.',
    },
  ],
};

/**
 * Excluded tasks (Poppy §9.1). Each task is one SpinWave chose not to
 * offer through Poppy at all — not via API, Company Agent, or browser
 * session. Every alternative carries instructions and, only where a
 * real URL exists, a web reference. No alternative invents a contact
 * or a URL: the licensing negotiation contact and the ThinkTank OS
 * submission route are still owed, so those alternatives are
 * instructions-only until they are named.
 */
export const TASKS_RESPONSE = {
  excluded_tasks: [
    {
      task: 'Buy or license a work',
      alternative: {
        instructions:
          'Licensing follows payment and negotiation. Reader licenses pay the scholar in STANZA. Start at the cross-chain checkout.',
        references: [{ type: 'web', url: 'https://crosschain.spinwave.tech/' }],
      },
    },
    {
      task: 'Submit a manuscript or dataset',
      alternative: {
        instructions:
          'Submissions happen in ThinkTank OS, where scholars link a wallet and submit draft manuscripts. SpinWave holds validated documents only and accepts no submissions.',
      },
    },
    {
      task: 'Link or verify a wallet',
      alternative: {
        instructions:
          'Wallet linking needs a signature from your own wallet in the browser. Sign in on the SpinWave website and link the wallet there.',
        references: [{ type: 'web', url: 'https://spinwave.tech/auth/login' }],
      },
    },
    {
      task: 'Submit a validity verdict or act as a reviewer',
      alternative: {
        instructions:
          'Validity verdicts are found by a Human on the reviewers roster only. No agent, model, or automated check may submit a verdict.',
      },
    },
    {
      task: 'Run pipeline or operator actions, move STANZA, or sign a transaction',
      alternative: {
        instructions:
          'Operator actions and payments are Human-signed and operator-only. They are never offered through a Personal Agent.',
      },
    },
    {
      task: 'Create, change, or delete a record or certificate',
      alternative: {
        instructions:
          'Records are created only by the operator pipeline after payment succeeds, and certificates only for certified works with a confirmed Base anchor. No record or certificate can be created, changed, or deleted through a Personal Agent.',
      },
    },
    {
      task: 'Change sign-in settings or close an account',
      alternative: {
        instructions:
          'SpinWave offers no account settings or account closure through this site. Sign-in is managed through the website sign-in only.',
      },
    },
  ],
  feedback: {
    endpoint: 'https://spinwave.tech/poppy/feedback',
  },
};

/**
 * Feedback validation (Poppy §9.3). task <= 200 chars, description
 * <= 2000 chars, both required. Returns { ok: true, task,
 * description } or { ok: false, message }. Report text is DATA:
 * it is stored and never executed, never shown to a model as an
 * instruction, and never logged.
 */
export function validateFeedback(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, message: 'Body must be a JSON object with task and description.' };
  }
  const task = typeof body.task === 'string' ? body.task.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!task) return { ok: false, message: 'task is required.' };
  if (task.length > 200) return { ok: false, message: 'task must be 200 characters or fewer.' };
  if (!description) return { ok: false, message: 'description is required.' };
  if (description.length > 2000) {
    return { ok: false, message: 'description must be 2000 characters or fewer.' };
  }
  return { ok: true, task, description };
}
