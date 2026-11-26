/**
 * MESSINHO independently reviewed source-rights allowlist.
 * Every entry is scoped to an exact work/edition and exact official URL paths.
 * No full-text/PDF storage is permitted by this registry.
 */
const VERIFIED_SOURCE_RIGHTS = Object.freeze([
  {
    source_id:'plos_one_vo2max_prediction_2023',
    status:'verified_permitted',
    license:'CC BY 4.0',
    license_url:'https://creativecommons.org/licenses/by/4.0/',
    rights_holder:'Article authors (authors retain copyright); PLOS ONE publisher',
    evidence_url:'https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0280897',
    tdm_evidence_url:'https://api.plos.org/text-and-data-mining.html',
    reviewed_at:'2026-11-26',
    ai_tdm:true,commercial_use:true,derivative_use:true,
    attribution:'Wiecha et al. (2023), External validation of VO2max prediction models based on recreational and elite endurance athletes, PLOS ONE 18(1): e0280897, DOI 10.1371/journal.pone.0280897, CC BY 4.0. MESSINHO created an independently worded summary; changes are indicated.',
    source_url_exact:true,
    source_url_prefixes:['https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0280897'],
    retrieval_method:'plos_jats_xml',
    retrieval_url:'https://journals.plos.org/plosone/article/file?id=10.1371/journal.pone.0280897&type=manuscript',
    title:'External validation of VO2max prediction models based on recreational and elite endurance athletes',
    edition:'2023'
  },
  {
    source_id:'libretexts_kuttler_matrix_multiplication_2022',
    status:'verified_permitted',
    license:'CC BY 4.0',
    license_url:'https://creativecommons.org/licenses/by/4.0/',
    rights_holder:'Ken Kuttler (Lyryx)',
    evidence_url:'https://math.libretexts.org/Bookshelves/Linear_Algebra/A_First_Course_in_Linear_Algebra_%28Kuttler%29/02%3A_Matrices/2.02%3A_Multiplication_of_Matrices',
    tdm_evidence_url:'https://creativecommons.org/licenses/by/4.0/',
    ai_tdm:true,commercial_use:true,derivative_use:true,
    reviewed_at:'2026-11-26',
    attribution:'Ken Kuttler (Lyryx), A First Course in Linear Algebra, §2.2 Multiplication of Matrices, CC BY 4.0. MESSINHO creates an independently worded compact summary; changes are indicated.',
    source_url_exact:true,
    source_url_prefixes:['https://math.libretexts.org/Bookshelves/Linear_Algebra/A_First_Course_in_Linear_Algebra_%28Kuttler%29/02%3A_Matrices/2.02%3A_Multiplication_of_Matrices'],
    retrieval_method:'libretexts_html',
    retrieval_url:'https://math.libretexts.org/Bookshelves/Linear_Algebra/A_First_Course_in_Linear_Algebra_%28Kuttler%29/02%3A_Matrices/2.02%3A_Multiplication_of_Matrices',
    title:'2.2: Multiplication of Matrices',
    edition:'2022'
  },
  {
    source_id:'austin_matrix_multiplication_2026',
    status:'verified_permitted',
    license:'CC BY 4.0',
    license_url:'https://creativecommons.org/licenses/by/4.0/',
    rights_holder:'David Austin',
    evidence_url:'https://math.libretexts.org/Bookshelves/Linear_Algebra/Understanding_Linear_Algebra_%28Austin%29',
    tdm_evidence_url:'https://creativecommons.org/licenses/by/4.0/',
    ai_tdm:true,commercial_use:true,derivative_use:true,
    reviewed_at:'2026-11-26',
    attribution:'David Austin, Understanding Linear Algebra, §2.2 Matrix multiplication and linear combinations, CC BY 4.0. MESSINHO creates an independently worded compact summary; changes are indicated.',
    source_url_exact:true,
    source_url_prefixes:['https://understandinglinearalgebra.org/sec-matrices-lin-combs.html'],
    retrieval_method:'austin_html',
    retrieval_url:'https://understandinglinearalgebra.org/sec-matrices-lin-combs.html',
    title:'2.2 Matrix multiplication and linear combinations',
    edition:'2026'
  },
  {
    source_id:'pmc_cardiorespiratory_fitness_2022',
    status:'verified_permitted',
    license:'CC BY 4.0',
    license_url:'https://creativecommons.org/licenses/by/4.0/',
    rights_holder:'Michael J. LaMonte (author); published by IMR Press',
    evidence_url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11269081/',
    tdm_evidence_url:'https://www.ncbi.nlm.nih.gov/research/bionlp/APIs/BioC-PMC/',
    reviewed_at:'2026-11-26',
    ai_tdm:true,commercial_use:true,derivative_use:true,
    attribution:'LaMonte MJ (2022), Cardiorespiratory Fitness in the Prevention and Management of Cardiovascular Disease, PMCID PMC11269081, CC BY 4.0. MESSINHO created an independently worded summary; changes are indicated.',
    source_url_exact:true,
    source_url_prefixes:['https://pmc.ncbi.nlm.nih.gov/articles/PMC11269081/'],
    retrieval_method:'pmc_bioc_json',
    retrieval_url:'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_json/PMC11269081/unicode',
    title:'Cardiorespiratory Fitness in the Prevention and Management of Cardiovascular Disease',
    edition:'2022'
  }
]);

export function verifyMessinhoSourceRights(rights = {}) {
  if (!rights || typeof rights !== 'object' || !rights.source_id) return false;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.source_id === rights.source_id);
  if (!entry || entry.status !== 'verified_permitted') return false;
  for (const key of ['license', 'license_url', 'rights_holder', 'evidence_url', 'tdm_evidence_url', 'attribution', 'retrieval_method', 'retrieval_url']) {
    if (!entry[key] || entry[key] !== rights[key]) return false;
  }
  if (!/^https:\/\//i.test(entry.evidence_url)||!/^https:\/\//i.test(entry.license_url)||!/^https:\/\//i.test(entry.tdm_evidence_url)||!/^https:\/\//i.test(entry.retrieval_url)) return false;
  if (entry.ai_tdm !== true || entry.commercial_use !== true || entry.derivative_use !== true) return false;
  return rights.status === 'verified_permitted' && rights.ai_tdm === true && rights.commercial_use === true && rights.derivative_use === true;
}

export function isMessinhoSourceUrlWithinPrefix(url, prefix, exact = false) {
  try {
    const candidate = new URL(url), base = new URL(prefix);
    if (candidate.protocol !== 'https:' || base.protocol !== 'https:' || candidate.origin !== base.origin) return false;
    if (exact) {
      const normalizeSearch = search => [...new URLSearchParams(search).entries()]
        .sort(([ak,av],[bk,bv]) => ak.localeCompare(bk) || av.localeCompare(bv))
        .map(([key,value]) => key+'='+value).join('&');
      return candidate.pathname.replace(/\/+$/,'') === base.pathname.replace(/\/+$/,'')
        && normalizeSearch(candidate.search) === normalizeSearch(base.search);
    }
    const basePath = base.pathname.endsWith('/') ? base.pathname : base.pathname + '/';
    return candidate.pathname === base.pathname || candidate.pathname.startsWith(basePath);
  } catch { return false; }
}

export function isMessinhoRegisteredSourceUrl(sourceId, url) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return false;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.source_id === sourceId && item.status === 'verified_permitted');
  if (!entry || !Array.isArray(entry.source_url_prefixes) || !entry.source_url_prefixes.length) return false;
  return entry.source_url_prefixes.some(prefix => typeof prefix === 'string' && isMessinhoSourceUrlWithinPrefix(url,prefix,entry.source_url_exact===true));
}

export function getMessinhoVerifiedSourceRightsForUrl(url) {
  if (typeof url !== 'string' || !/^https:\/\//i.test(url)) return null;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.status === 'verified_permitted' && Array.isArray(item.source_url_prefixes) && item.source_url_prefixes.some(prefix => typeof prefix === 'string' && isMessinhoSourceUrlWithinPrefix(url,prefix,item.source_url_exact===true)));
  return entry ? { ...entry, source_url_prefixes: [...entry.source_url_prefixes] } : null;
}


export function getMessinhoVerifiedSourceRightsById(sourceId) {
  if (typeof sourceId !== 'string' || !sourceId) return null;
  const entry = VERIFIED_SOURCE_RIGHTS.find(item => item.source_id === sourceId && item.status === 'verified_permitted');
  return entry ? { ...entry, source_url_prefixes: [...entry.source_url_prefixes] } : null;
}

export function getMessinhoVerifiedSourceRightsCount() {
  return VERIFIED_SOURCE_RIGHTS.filter(item => item.status === 'verified_permitted').length;
}
