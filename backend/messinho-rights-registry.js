/**
 * MESSINHO independently reviewed source-rights allowlist.
 * Empty by default: provider-supplied license flags are never proof of permission.
 * Add a source only after work-level rights, AI/TDM, commercial and derivative
 * permissions have been documented and reviewed.
 */
const VERIFIED_SOURCE_RIGHTS = Object.freeze([]);

export function verifyMessinhoSourceRights(rights = {}) {
  if (!rights || typeof rights !== 'object' || !rights.source_id) return false;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.source_id === rights.source_id);
  if (!entry || entry.status !== 'verified_permitted') return false;
  for (const key of ['license', 'rights_holder', 'evidence_url']) {
    if (!entry[key] || entry[key] !== rights[key]) return false;
  }
  if (!/^https:\/\//i.test(entry.evidence_url)) return false;
  if (entry.ai_tdm !== true || entry.commercial_use !== true || entry.derivative_use !== true) return false;
  return rights.status === 'verified_permitted' && rights.ai_tdm === true && rights.commercial_use === true && rights.derivative_use === true;
}

export function getMessinhoVerifiedSourceRightsCount() {
  return VERIFIED_SOURCE_RIGHTS.filter(item => item.status === 'verified_permitted').length;
}
