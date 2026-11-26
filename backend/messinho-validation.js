const COUNTRY_ALIASES = {
  deutschland: ['deutschland', 'deutsch', 'germany', 'german'],
  england: ['england', 'english'],
  spanien: ['spanien', 'spain', 'spanish'],
  italien: ['italien', 'italy', 'italian'],
  frankreich: ['frankreich', 'france', 'french'],
  niederlande: ['niederlande', 'netherlands', 'dutch'],
  portugal: ['portugal', 'portuguese'],
  belgien: ['belgien', 'belgium', 'belgian'],
  österreich: ['österreich', 'austria', 'austrian'],
  schweiz: ['schweiz', 'switzerland', 'swiss'],
  türkei: ['türkei', 'turkey', 'turkish'],
  dänemark: ['dänemark', 'denmark', 'danish'],
  schweden: ['schweden', 'sweden', 'swedish'],
  norwegen: ['norwegen', 'norway', 'norwegian'],
  polen: ['polen', 'poland', 'polish'],
  kroatien: ['kroatien', 'croatia', 'croatian'],
  serbien: ['serbien', 'serbia', 'serbian'],
  usa: ['usa', 'united states', 'united states of america'],
  brasilien: ['brasilien', 'brazil', 'brazilian'],
  argentinien: ['argentinien', 'argentina', 'argentinian']
};

const POSITION_ALIASES = {
  left_back: ['linker verteidiger', 'linksverteidiger', 'left back', 'left-back', 'leftback', 'left fullback', 'left full back', 'lb', 'lv'],
  right_back: ['rechter verteidiger', 'rechtsverteidiger', 'right back', 'right-back', 'rightback', 'right fullback', 'right full back', 'rb', 'rv'],
  centre_back: ['innenverteidiger', 'center back', 'centre back', 'center-back', 'centre-back', 'cb', 'iv'],
  goalkeeper: ['torwart', 'goalkeeper', 'goal keeper', 'keeper', 'gk', 'tw'],
  striker: ['mittelstürmer', 'stürmer', 'striker', 'centre forward', 'center forward', 'cf', 'st'],
  defensive_midfielder: ['als 6er', '6er', 'sechser', 'defensiver mittelfeldspieler', 'defensives mittelfeld', 'defensive midfielder', 'holding midfielder', 'dm', 'cdm', 'zdm'],
  central_midfielder: ['zentraler mittelfeldspieler', 'zentrales mittelfeld', 'central midfielder', 'cm', 'zm'],
  midfielder: ['mittelfeldspieler', 'mittelfeld', 'midfielder', 'midfield'],
  attacking_midfielder: ['offensiver mittelfeldspieler', 'offensives mittelfeld', 'attacking midfielder', 'am', 'cam', 'om'],
  winger: ['flügelspieler', 'winger', 'left winger', 'right winger', 'lw', 'rw', 'lf', 'rf']
};

function normalize(value) {
  return String(value ?? '').normalize('NFKC').toLocaleLowerCase('de-DE')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function hasPhrase(text, phrase) {
  const haystack = ' ' + normalize(text) + ' ';
  const needle = ' ' + normalize(phrase) + ' ';
  return haystack.includes(needle);
}

export function matchesPosition(requested, positions) {
  if (!requested) return true;
  const request = normalize(requested);
  const requestedGroup = Object.entries(POSITION_ALIASES).find(([, aliases]) =>
    aliases.some(alias => normalize(alias) === request)
  )?.[0];
  const accepted = requestedGroup ? POSITION_ALIASES[requestedGroup] : [requested];
  const values = (Array.isArray(positions) ? positions : [positions])
    .filter(value => typeof value === 'string').map(normalize);
  if (requestedGroup === 'midfielder') {
    const midfieldGroups = ['defensive_midfielder','central_midfielder','attacking_midfielder'];
    return values.some(value => midfieldGroups.some(group => POSITION_ALIASES[group].some(alias => {
      const needle=normalize(alias);
      return value===needle || (' '+value+' ').includes(' '+needle+' ');
    })) || /\\b(mittelfeld|midfield)\\b/.test(value));
  }
  return accepted.some(alias => {
    const needle = normalize(alias);
    return values.some(value => value === needle || (' ' + value + ' ').includes(' ' + needle + ' '));
  });
}

export function sourceSupportsRegion(region, sourceText, currentClub) {
  if (!region) return true;
  const normalizedRegion = normalize(region);
  const aliases = COUNTRY_ALIASES[normalizedRegion] || [region];
  const hasCountry = aliases.some(alias => hasPhrase(sourceText, alias));
  const club = normalize(currentClub);
  const hasClub = !!club && normalize(sourceText).includes(club);
  return hasCountry && hasClub;
}

export function parseMessinhoScoutingRequest(message, history = [], currentYear = new Date().getFullYear()) {
  const safeHistory = Array.isArray(history) ? history.slice(-20) : [];
  const userContext = safeHistory.filter(item => item?.role === 'user')
    .map(item => typeof item.text === 'string' ? item.text : '').join(' ');
  const lastAssistant = [...safeHistory].reverse().find(item => item?.role === 'assistant');
  const latest = normalize(message);
  const startsNewRequest = /\b(benötige|brauche|suche|such|finde|scoute|recherchiere)\b/i.test(latest);
  const pending = !startsNewRequest && /(?:welches spielerlevel|welche spielklasse|leistungsniveau|welches land|welcher standort|welche position|welcher jahrgang|geburtsjahrgang|land\\s+bzw\\.?\\s+liga[- ]standort|damit ich die suche sauber eingrenzen kann|brauche ich noch:)/i.test(String(lastAssistant?.text || ''));
  const recentConversation = safeHistory.slice(-8).map(item => String(item?.text || '')).join(' ');
  const discussedBirthYears = /\b(jahrgang|geburtsjahr|geburtsjahrgang|geboren|geburtsdatum|altersklasse)\b/i.test(recentConversation);
  const terseYearFollowUp = /^(?:19|20)\d{2}(?:\s*[-–—]\s*(?:19|20)\d{2})?$/u.test(latest);
  const contextualYearFollowUp = !startsNewRequest && discussedBirthYears && terseYearFollowUp;
  const carryYearContextIntoSearch = startsNewRequest && discussedBirthYears && /\b(spieler|talent|kandidat|scouting)\b/i.test(latest);
  const context = (pending || contextualYearFollowUp || carryYearContextIntoSearch ? userContext + ' ' : '') + String(message || '');
  const yearMatches = [...context.matchAll(/\b(19\d{2}|20\d{2})\b/g)]
    .map(match => Number(match[1])).filter(year => year >= 1990 && year <= currentYear);
  const yearFrom = yearMatches.length ? Math.min(...yearMatches) : null;
  const yearTo = yearMatches.length ? Math.max(...yearMatches) : null;
  const ageMatch = context.match(/\\b(1[4-9]|2[0-9])\\s*(?:[- ]?j[aä]hrig(?:en|er|e|es)?|jahre?\\s+alt)\\b/i);
  const age = ageMatch ? Number(ageMatch[1]) : null;
  const ageGroupMatch = context.match(/\bU[\s-]*([1-2]\d)\b/i);
  const ageGroup = ageGroupMatch ? `U${Number(ageGroupMatch[1])}` : null;

  const positionPattern = /\b(linker\s+verteidiger|linksverteidiger|left[- ]back|left fullback|lv|lb|rechter\s+verteidiger|rechtsverteidiger|right[- ]back|right fullback|rv|rb|innenverteidiger|center[- ]back|centre[- ]back|iv|cb|mittelstürmer|stürmer|striker|torwart|goalkeeper|keeper|tw|gk|zentraler?\s+mittelfeldspieler|defensives?\s+mittelfeld|mittelfeldspieler|mittelfeld|midfielder|midfield|zdm|cdm|zm|cm|om|cam|flügelspieler|winger|lw|rw|lf|rf)\b/i;
  const specificSix = context.match(/\\b(?:als\\s+)?6er\\b|\\bsechser\\b/i);
  const positionMatch = specificSix || context.match(positionPattern);
  const position = positionMatch ? (specificSix ? 'defensiver Mittelfeldspieler' : positionMatch[0].trim()) : '';

  const countryNames = Object.keys(COUNTRY_ALIASES).sort((a, b) => b.length - a.length);
  const countryPattern = new RegExp('\\b(?:in\\s+)?(' + countryNames.map(name => name.replace(/[.*+?^{}()|[\]\\]/g, '\\$&')).join('|') +
    '|germany|german|england|english|spain|spanish|italy|italian|france|french|netherlands|dutch|belgium|belgian|austria|austrian|switzerland|swiss|turkey|turkish|denmark|danish|sweden|swedish|norway|norwegian|poland|polish|croatia|croatian|serbia|serbian|usa|brazil|brazilian|argentina|argentinian)\\b', 'i');
  const regionMatch = context.match(countryPattern);
  let region = regionMatch ? regionMatch[1].replace(/^in\s+/i, '').trim() : '';
  const regionKey = Object.entries(COUNTRY_ALIASES).find(([key, aliases]) =>
    normalize(key) === normalize(region) || aliases.some(alias => normalize(alias) === normalize(region))
  )?.[0];
  if (regionKey) region = regionKey;

  const levelPattern = /\b(2\.?\s*bundesliga|3\.?\s*liga|bundesliga|regionalliga|oberliga|landesliga)\b/i;
  const levelMatch = context.match(levelPattern);
  const targetLevel = levelMatch ? levelMatch[0].replace(/\s+/g, ' ').trim() : '';
  const quantityMatch = context.match(/\b(\d{1,2}|eins|eine|einen|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn)\s+(?=(?:interessante[nr]?\s+)?(?:u[\s-]*\d{1,2}[- ]?)?(?:spieler|talente|kandidaten|linker|linksverteidiger|left|rechter|rechtsverteidiger|right|innenverteidiger|mittelstürmer|stürmer|torwart|goalkeeper|keeper|flügelspieler|winger|zentraler|defensives|offensives|mittelfeldspieler)\b)/i);
  const numberWords={eins:1,eine:1,einen:1,zwei:2,drei:3,vier:4,fünf:5,sechs:6,sieben:7,acht:8,neun:9,zehn:10};
  const quantity = quantityMatch ? Math.max(1, Math.min(15, Number(quantityMatch[1])||numberWords[quantityMatch[1].toLocaleLowerCase('de-DE')]||10)) : 10;

  const scoutingIntent = /\b(benötige|brauche|suche|such|finde|identifiziere|ermittle|scoute|recherchiere|spieler|talent|kandidaten|scouting)\b/i.test(latest);
  const hasCriteria = !!(yearFrom || ageGroup || age || position || region);
  const shouldHandle = pending || (scoutingIntent && (hasCriteria || !!quantityMatch));
  const missing = [];
  if (shouldHandle) {
    if (!yearFrom && !ageGroup && !age) missing.push('Geburtsjahrgang oder Altersklasse');
    if (!position) missing.push('Position');
    if (!region) missing.push('Land bzw. Liga-Standort');
  }
  // A target league is optional context, not a mandatory clarification. Broad scouting
  // requests such as 'leistungsorientierter Vereinsfußball' must proceed autonomously.
  const needsTargetLevel = false;
  return {
    shouldHandle, missing, needsTargetLevel,
    request: { quantity, yearFrom, yearTo, ageGroup, ...(age ? { age } : {}), position, region, targetLevel }
  };
}
