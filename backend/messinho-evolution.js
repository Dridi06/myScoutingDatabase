/**
 * MESSINHO controlled capability evolution.
 *
 * Generated source code is never evaluated. Evolution proposals use a small,
 * versioned declarative contract and may only reference reviewed operations.
 * Persistence/activation is deliberately separate from proposal validation.
 */
export const MESSINHO_EVOLUTION_VERSION = '1.0.0';
export const MAX_EVOLUTION_EXAMPLES = 20;
export const MAX_EVOLUTION_QUESTION_LENGTH = 1200;

const SAFE_OPERATIONS = new Set([
  'system_clock',
  'calendar_date',
  'basic_arithmetic',
  'unit_conversion'
]);
const SENSITIVE_INTENTS = /\b(delete|loesche|lösche|send|sende|kontaktier|ueberweise|überweise|kaufe|buche|aktiviere|veroeffentliche|veröffentliche|passwort|zugang|konto|modellgewicht|scoringmodell)\b/i;

function cleanText(value, max = 500) {
  return typeof value === 'string' ? value.normalize('NFKC').trim().slice(0, max) : '';
}
function slug(value) {
  return cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function normalize(value) {
  return cleanText(value, MAX_EVOLUTION_QUESTION_LENGTH).toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Decide whether the current deterministic capability vocabulary covers a request. */
export function detectMessinhoKnowledgeGap(question, { matchedCapabilityIds = [], hasVerifiedEvidence = false } = {}) {
  const text = cleanText(question, MAX_EVOLUTION_QUESTION_LENGTH);
  if (!text) return { gap: false, reason: 'empty_input', risk: 'none' };
  if (matchedCapabilityIds.length) return { gap: false, reason: 'known_capability_match', risk: 'none' };
  if (hasVerifiedEvidence) return { gap: false, reason: 'verified_evidence_available', risk: 'none' };
  return {
    gap: true,
    reason: 'no_matching_capability_or_verified_evidence',
    risk: SENSITIVE_INTENTS.test(text) ? 'protected_side_effect_or_sensitive_topic' : 'unclassified_question',
    normalized_question: normalize(text),
    requires_research_or_clarification: true,
    may_generate_code: false
  };
}

/**
 * Build an immutable candidate. The caller must supply a reviewed operation ID;
 * model output is data only and is validated before it can be stored.
 */
export function createMessinhoEvolutionProposal({
  question, capabilityId, operation, description, examples = [], testCases = [],
  createdBy, source = 'agent'
} = {}) {
  const proposal = {
    schema_version: 1,
    evolution_version: MESSINHO_EVOLUTION_VERSION,
    capability_id: slug(capabilityId),
    operation: cleanText(operation, 60),
    description: cleanText(description, 500),
    examples: [...new Set([cleanText(question, MAX_EVOLUTION_QUESTION_LENGTH), ...examples.map(x => cleanText(x, MAX_EVOLUTION_QUESTION_LENGTH))].filter(Boolean))].slice(0, MAX_EVOLUTION_EXAMPLES),
    test_cases: Array.isArray(testCases) ? testCases.slice(0, MAX_EVOLUTION_EXAMPLES).map(item => ({
      input: cleanText(item?.input, MAX_EVOLUTION_QUESTION_LENGTH),
      expected: cleanText(item?.expected, 500)
    })) : [],
    created_by: cleanText(createdBy, 100),
    source: source === 'admin' ? 'admin' : 'agent',
    status: 'candidate',
    version: 1,
    created_at: new Date().toISOString()
  };
  return proposal;
}

/** Strict contract validation; never parses or executes generated source code. */
export function validateMessinhoEvolutionProposal(proposal) {
  const errors = [];
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal)) {
    return { valid: false, errors: ['proposal_must_be_object'] };
  }
  if (proposal.schema_version !== 1) errors.push('unsupported_schema_version');
  if (!/^[a-z][a-z0-9_]{2,79}$/.test(proposal.capability_id || '')) errors.push('invalid_capability_id');
  if (!SAFE_OPERATIONS.has(proposal.operation)) errors.push('operation_not_allowlisted');
  if (!cleanText(proposal.description, 500)) errors.push('description_required');
  if (!Array.isArray(proposal.examples) || proposal.examples.length < 1 || proposal.examples.length > MAX_EVOLUTION_EXAMPLES) errors.push('invalid_examples');
  if (!Array.isArray(proposal.test_cases) || proposal.test_cases.length < 2 || proposal.test_cases.length > MAX_EVOLUTION_EXAMPLES) errors.push('at_least_two_test_cases_required');
  if (proposal.test_cases?.some(item => !cleanText(item?.input) || !cleanText(item?.expected))) errors.push('invalid_test_case');
  if (proposal.status !== 'candidate') errors.push('proposal_must_start_as_candidate');
  if (Object.hasOwn(proposal, 'python_code') || Object.hasOwn(proposal, 'javascript_code') || Object.hasOwn(proposal, 'source_code')) errors.push('executable_source_forbidden');
  if (SENSITIVE_INTENTS.test(proposal.examples?.join(' ') || '')) errors.push('protected_intent_requires_human_review');
  return { valid: errors.length === 0, errors, operation_allowlist: [...SAFE_OPERATIONS] };
}

/** A candidate can only be promoted after passing caller-supplied contract tests and explicit approval. */
export function promoteMessinhoEvolutionProposal(proposal, { testsPassed = false, approvedBy = null } = {}) {
  const validation = validateMessinhoEvolutionProposal(proposal);
  if (!validation.valid) return { promoted: false, status: 'rejected', errors: validation.errors };
  if (!testsPassed) return { promoted: false, status: 'needs_validation', errors: ['regression_tests_not_passed'] };
  if (!cleanText(approvedBy, 100)) return { promoted: false, status: 'awaiting_approval', errors: ['explicit_approval_required'] };
  return {
    promoted: true,
    status: 'approved',
    capability: { ...proposal, status: 'approved', approved_by: cleanText(approvedBy, 100), approved_at: new Date().toISOString() }
  };
}

/** Semantic reuse baseline: normalized exact/containment match, never keyword-only execution. */
export function matchMessinhoEvolutionExample(question, approvedCapabilities = []) {
  const target = normalize(question);
  if (!target) return null;
  const candidates = [];
  for (const capability of approvedCapabilities) {
    if (capability?.status !== 'approved' || !SAFE_OPERATIONS.has(capability.operation)) continue;
    for (const example of capability.examples || []) {
      const normalized = normalize(example);
      if (normalized && (normalized === target || (normalized.length >= 18 && target.includes(normalized)))) {
        candidates.push({ capability_id: capability.capability_id, operation: capability.operation, version: capability.version || 1, match: normalized === target ? 'exact' : 'contained_example' });
      }
    }
  }
  return candidates.sort((a, b) => (a.match === 'exact' ? -1 : 1) - (b.match === 'exact' ? -1 : 1))[0] || null;
}
