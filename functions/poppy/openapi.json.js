/**
 * GET /poppy/openapi.json — OpenAPI description of the SpinWave public
 * read APIs offered through Poppy Stage 1 (2026-11-14). Signed-out
 * only: no security schemes, no write operations. Every operation,
 * parameter, and response below matches the live Functions code
 * (functions/api/records.js, verify.js, certificate.js) as read
 * 2026-11-14. Do not add an operation here until its endpoint exists.
 */
const OPENAPI = {
  openapi: '3.1.0',
  info: {
    title: 'SpinWave public records API',
    version: '1.0.0',
    description:
      'Read-only public access to SpinWave records and certificates. SpinWave is the database and storage layer of the Glenride think tank. A record is certified only when its Base anchor has at least 12 recorded confirmations. A missing record is "not found", never "invalid" and never a placeholder.',
  },
  servers: [{ url: 'https://spinwave.tech' }],
  paths: {
    '/api/records': {
      get: {
        summary: 'Read a validated SpinWave record',
        description:
          'Returns a validated record by record id or certificate id. At least one of id or certificate is required. Anchor fields are null until confirmed; render them as pending, not blank and not certified. This endpoint never creates a record.',
        operationId: 'getRecord',
        parameters: [
          { name: 'id', in: 'query', required: false, schema: { type: 'string' }, description: 'Record id.' },
          { name: 'certificate', in: 'query', required: false, schema: { type: 'string' }, description: 'Certificate id. Used when no record matches id.' },
        ],
        responses: {
          200: {
            description: 'Record found.',
            content: { 'application/json': { schema: { type: 'object', required: ['record'], properties: { record: { $ref: '#/components/schemas/Record' } } } } },
          },
          400: {
            description: 'Neither id nor certificate was supplied.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'bad_request' } } },
          },
          404: {
            description: 'No record matches. Not "invalid": nothing to check against.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'not_found' } } },
          },
          500: {
            description: 'Record store not configured.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'not_configured' } } },
          },
        },
      },
    },
    '/api/verify': {
      get: {
        summary: 'Verify a certificate against its record and Base anchor',
        description:
          'Checks a record/certificate against its confirmed anchor. At least one of id, hash, or fingerprint is required. Statuses: verified (record certified, anchor present, supplied hash/fingerprint match, at least 12 confirmations recorded); invalid (hash mismatch, fingerprint mismatch, or certified presentation without a confirmed anchor; failed_check names which); not_certified (record exists, no confirmed anchor yet — the work is real, the certificate is not ready); not_found (no record matches — not "invalid"). A tampered copy returns invalid, never verified.',
        operationId: 'verifyCertificate',
        parameters: [
          { name: 'id', in: 'query', required: false, schema: { type: 'string' }, description: 'Record id or certificate id.' },
          { name: 'hash', in: 'query', required: false, schema: { type: 'string' }, description: 'Base transaction hash to check against the confirmed anchor.' },
          { name: 'fingerprint', in: 'query', required: false, schema: { type: 'string' }, description: 'Document fingerprint (hash of the document bytes) to check against the anchored fingerprint.' },
        ],
        responses: {
          200: {
            description: 'Verification result. The status field carries the verdict; HTTP 200 is used for all four statuses.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: { type: 'string', enum: ['verified', 'invalid', 'not_certified', 'not_found'] },
                    message: { type: 'string' },
                    failed_check: { type: 'string', enum: ['hash_mismatch', 'state_not_certified', 'fingerprint_mismatch'] },
                    record: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        title: { type: 'string', nullable: true },
                        authors: { type: 'string', nullable: true },
                        version: { type: 'string', nullable: true },
                        state: { type: 'string', nullable: true },
                        anchor_tx: { type: 'string', nullable: true },
                        anchored_at: { type: 'integer', nullable: true },
                        certificate_id: { type: 'string', nullable: true },
                        document_fingerprint: { type: 'string', nullable: true },
                        anchor_confirmations: { type: 'integer', nullable: true },
                        confirmations_required: { type: 'integer', example: 12 },
                      },
                    },
                    basescan_url: { type: 'string', description: 'Present on verified results.' },
                    record_url: { type: 'string', description: 'Present on verified results.' },
                  },
                },
              },
            },
          },
          400: {
            description: 'No id, hash, or fingerprint was supplied.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'bad_request' } } },
          },
          500: {
            description: 'Record store not configured.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'not_configured' } } },
          },
        },
      },
    },
    '/api/certificate': {
      get: {
        summary: 'Read the canonical certificate JSON for a certified work',
        description:
          'Returns the canonical certificate document only for a certified work with a confirmed anchor (at least 12 confirmations). Anything else is not_certified or not_found — never a certificate for an uncertified work. The JSON here is canonical; the printable PDF renders this same document, and if they disagree, this JSON plus the record plus the anchor win. Verdict and payment identifiers come from the pipeline tables when present and are null when missing, never invented.',
        operationId: 'getCertificate',
        parameters: [
          { name: 'id', in: 'query', required: true, schema: { type: 'string' }, description: 'Work id, record id, or certificate id.' },
        ],
        responses: {
          200: {
            description: 'Canonical certificate document, or a not_certified status object.',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { $ref: '#/components/schemas/Certificate' },
                    {
                      type: 'object',
                      required: ['status'],
                      properties: {
                        status: { type: 'string', enum: ['not_certified'] },
                        message: { type: 'string' },
                        record: { type: 'object', properties: { id: { type: 'string' }, state: { type: 'string', nullable: true } } },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: {
            description: 'No id was supplied.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'bad_request' } } },
          },
          404: {
            description: 'No record matches.',
            content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['not_found'] } } }, example: { status: 'not_found' } } },
          },
          500: {
            description: 'Record store not configured.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' }, example: { error: 'not_configured' } } },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Record: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string', nullable: true },
          authors: { type: 'string', nullable: true },
          version: { type: 'string', nullable: true },
          scholar_wallet: { type: 'string', nullable: true },
          state: { type: 'string', nullable: true, description: 'Pipeline state: awaiting validity, payment failed, payment complete, upload pending, anchoring pending, anchored, certified, or cancelled.' },
          anchor_tx: { type: 'string', nullable: true, description: 'Base anchor transaction hash. Null until confirmed.' },
          anchored_at: { type: 'integer', nullable: true },
          certificate_id: { type: 'string', nullable: true },
          created_at: { type: 'integer', nullable: true },
          document_fingerprint: { type: 'string', nullable: true },
          anchor_confirmations: { type: 'integer', nullable: true },
          anchor_status: { type: 'string', nullable: true },
        },
      },
      Certificate: {
        type: 'object',
        properties: {
          certificate_id: { type: 'string', nullable: true },
          record_id: { type: 'string' },
          work_id: { type: 'string', nullable: true },
          title: { type: 'string', nullable: true },
          version: { type: 'string', nullable: true },
          scholar: { type: 'string', nullable: true },
          scholar_wallet: { type: 'string', nullable: true },
          verdict: { type: 'string', nullable: true },
          verdict_at: { type: 'integer', nullable: true },
          payment_transaction: { type: 'string', nullable: true },
          anchor_transaction: { type: 'string', nullable: true },
          anchor_confirmations: { type: 'integer', nullable: true },
          confirmations_required: { type: 'integer', example: 12 },
          document_fingerprint: { type: 'string', nullable: true },
          anchored_at: { type: 'integer', nullable: true },
          basescan_url: { type: 'string' },
          record_url: { type: 'string' },
          verify_url: { type: 'string' },
          note: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: { error: { type: 'string', enum: ['bad_request', 'not_found', 'not_configured'] } },
      },
    },
  },
};

export async function onRequest({ request }) {
  if (request.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'invalid_request', message: 'Only GET is supported on this endpoint.' }),
      { status: 405, headers: { 'Content-Type': 'application/json; charset=utf-8', Allow: 'GET' } },
    );
  }
  return new Response(JSON.stringify(OPENAPI, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
