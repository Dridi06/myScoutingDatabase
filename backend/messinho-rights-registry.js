/**
 * MESSINHO independently reviewed source-rights allowlist.
 * Every entry is scoped to an exact work/edition and exact official URL paths.
 * No full-text/PDF storage is permitted by this registry.
 */
const VERIFIED_SOURCE_RIGHTS = Object.freeze([
  {
    source_id:'openstax_college_algebra_2e_2021',
    status:'verified_permitted',
    license:'CC BY 4.0',
    license_url:'https://creativecommons.org/licenses/by/4.0/',
    rights_holder:'Rice University',
    evidence_url:'https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf',
    ai_tdm:true,commercial_use:true,derivative_use:true,
    attribution:'Rice University, OpenStax, College Algebra 2e (2021), CC BY 4.0. Indicate that MESSINHO created an independently worded summary and link to the source.',
    source_url_prefixes:[
      'https://assets.openstax.org/oscms-prodcms/media/documents/College-Algebra-2e-WEB.pdf',
      'https://openstax.org/books/college-algebra-2e/pages/'
    ]
  },
  {
    source_id:'openstax_introductory_statistics_2e_2023',
    status:'verified_permitted',
    license:'CC BY 4.0',
    license_url:'https://creativecommons.org/licenses/by/4.0/',
    rights_holder:'Rice University',
    evidence_url:'https://assets.openstax.org/oscms-prodcms/media/documents/Introductory_Statistics_2e_-_WEB.pdf',
    ai_tdm:true,commercial_use:true,derivative_use:true,
    attribution:'Rice University, OpenStax, Introductory Statistics 2e (2023), CC BY 4.0. Indicate that MESSINHO created an independently worded summary and link to the source.',
    source_url_prefixes:[
      'https://assets.openstax.org/oscms-prodcms/media/documents/Introductory_Statistics_2e_-_WEB.pdf',
      'https://openstax.org/books/introductory-statistics-2e/pages/'
    ]
  },
  {
    source_id:'openstax_university_physics_volume_1_2021',
    status:'verified_permitted',
    license:'CC BY 4.0',
    license_url:'https://creativecommons.org/licenses/by/4.0/',
    rights_holder:'Rice University',
    evidence_url:'https://assets.openstax.org/oscms-prodcms/media/documents/UniversityPhysicsVol1-WEB.pdf',
    ai_tdm:true,commercial_use:true,derivative_use:true,
    attribution:'Rice University, OpenStax, University Physics Volume 1 (2021 PDF edition), CC BY 4.0. Indicate that MESSINHO created an independently worded summary and link to the source.',
    source_url_prefixes:[
      'https://assets.openstax.org/oscms-prodcms/media/documents/UniversityPhysicsVol1-WEB.pdf',
      'https://openstax.org/books/university-physics-volume-1/pages/'
    ]
  },
  {
    source_id:'openstax_introductory_business_statistics_2e',
    status:'verified_permitted',
    license:'CC BY 4.0',
    license_url:'https://creativecommons.org/licenses/by/4.0/',
    rights_holder:'Rice University',
    evidence_url:'https://assets.openstax.org/oscms-prodcms/media/documents/Introductory_Business_Statistics_2e_-_WEB.pdf',
    ai_tdm:true,commercial_use:true,derivative_use:true,
    attribution:'Rice University, OpenStax, Introductory Business Statistics 2e, CC BY 4.0. Indicate that MESSINHO created an independently worded summary and link to the source.',
    source_url_prefixes:[
      'https://assets.openstax.org/oscms-prodcms/media/documents/Introductory_Business_Statistics_2e_-_WEB.pdf',
      'https://openstax.org/books/introductory-business-statistics-2e/pages/'
    ]
  }
]);

export function verifyMessinhoSourceRights(rights = {}) {
  if (!rights || typeof rights !== 'object' || !rights.source_id) return false;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.source_id === rights.source_id);
  if (!entry || entry.status !== 'verified_permitted') return false;
  for (const key of ['license', 'license_url', 'rights_holder', 'evidence_url', 'attribution']) {
    if (!entry[key] || entry[key] !== rights[key]) return false;
  }
  if (!/^https:\/\//i.test(entry.evidence_url)||!/^https:\/\//i.test(entry.license_url)) return false;
  if (entry.ai_tdm !== true || entry.commercial_use !== true || entry.derivative_use !== true) return false;
  return rights.status === 'verified_permitted' && rights.ai_tdm === true && rights.commercial_use === true && rights.derivative_use === true;
}

export function isMessinhoSourceUrlWithinPrefix(url, prefix) {
  try {
    const candidate = new URL(url), base = new URL(prefix);
    if (candidate.protocol !== 'https:' || base.protocol !== 'https:' || candidate.origin !== base.origin) return false;
    const basePath = base.pathname.endsWith('/') ? base.pathname : base.pathname + '/';
    return candidate.pathname === base.pathname || candidate.pathname.startsWith(basePath);
  } catch { return false; }
}

export function isMessinhoRegisteredSourceUrl(sourceId, url) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return false;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.source_id === sourceId && item.status === 'verified_permitted');
  if (!entry || !Array.isArray(entry.source_url_prefixes) || !entry.source_url_prefixes.length) return false;
  return entry.source_url_prefixes.some(prefix => typeof prefix === 'string' && isMessinhoSourceUrlWithinPrefix(url,prefix));
}

export function getMessinhoVerifiedSourceRightsForUrl(url) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return null;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.status === 'verified_permitted' && Array.isArray(item.source_url_prefixes) && item.source_url_prefixes.some(prefix => typeof prefix === 'string' && isMessinhoSourceUrlWithinPrefix(url,prefix)));
  return entry ? { ...entry, source_url_prefixes: [...entry.source_url_prefixes] } : null;
}

export function getMessinhoVerifiedSourceRightsCount() {
  return VERIFIED_SOURCE_RIGHTS.filter(item => item.status === 'verified_permitted').length;
}
