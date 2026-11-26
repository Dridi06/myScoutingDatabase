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

export function isMessinhoRegisteredSourceUrl(sourceId, url) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return false;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.source_id === sourceId && item.status === 'verified_permitted');
  if (!entry || !Array.isArray(entry.source_url_prefixes) || !entry.source_url_prefixes.length) return false;
  return entry.source_url_prefixes.some(prefix => typeof prefix === 'string' && /^https:\/\//i.test(prefix) && url.startsWith(prefix));
}

export function getMessinhoVerifiedSourceRightsForUrl(url) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return null;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.status === 'verified_permitted' && Array.isArray(item.source_url_prefixes) && item.source_url_prefixes.some(prefix => typeof prefix === 'string' && /^https:\/\//i.test(prefix) && url.startsWith(prefix)));
  return entry ? { ...entry, source_url_prefixes: [...entry.source_url_prefixes] } : null;
}

export function getMessinhoVerifiedSourceRightsCount() {
  return VERIFIED_SOURCE_RIGHTS.filter(item => item.status === 'verified_permitted').length;
}
