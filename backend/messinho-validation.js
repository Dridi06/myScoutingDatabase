const COUNTRY_ALIASES = {
  deutschland: ['deutschland', 'germany', 'german'],
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
  defensive_midfielder: ['defensiver mittelfeldspieler', 'defensives mittelfeld', 'defensive midfielder', 'holding midfielder', 'dm', 'cdm', 'zdm'],
  central_midfielder: ['zentraler mittelfeldspieler', 'zentrales mittelfeld', 'central midfielder', 'cm', 'zm'],
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
  const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
  const userContext = safeHistory.filter(item => item?.role === 'user')
    .map(item => typeof item.text === 'string' ? item.text : '').join(' ');
  const assistantContext = safeHistory.filter(item => item?.role === 'assistant')
    .map(item => typeof item.text === 'string' ? item.text : '').join(' ');
  const context = (userContext + ' ' + String(message || '')).slice(-5000);
  const normalized = normalize(context);
  const latest = normalize(message);
  const yearMatches = [...context.matchAll(/\b(19\d{2}|20\d{2})\b/g)]
    .map(match => Number(match[1])).filter(year => year >= 1990 && year <= currentYear);
  const yearFrom = yearMatches.length ? Math.min(...yearMatches) : null;
  const yearTo = yearMatches.length ? Math.max(...yearMatches) : null;

  const positionPattern = /\b(linker\s+verteidiger|linksverteidiger|left[- ]back|left fullback|lv|lb|rechter\s+verteidiger|rechtsverteidiger|right[- ]back|right fullback|rv|rb|innenverteidiger|center[- ]back|centre[- ]back|iv|cb|mittelstürmer|stürmer|striker|torwart|goalkeeper|keeper|tw|gk|zentraler?\s+mittelfeldspieler|defensives?\s+mittelfeld|zdm|cdm|zm|cm|om|cam|flügelspieler|winger|lw|rw|lf|rf)\b/i;
  const positionMatch = context.match(positionPattern);
  const position = positionMatch ? positionMatch[0].trim() : '';

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
  const quantityMatch = context.match(/\b(\d{1,2})\s+(?=(?:spieler|talente|kandidaten|linker|linksverteidiger|left|rechter|rechtsverteidiger|right|innenverteidiger|mittelstürmer|stürmer|torwart|goalkeeper|keeper|flügelspieler|winger|zentraler|defensives|offensives)\b)/i);
  const quantity = quantityMatch ? Math.max(1, Math.min(15, Number(quantityMatch[1]))) : 10;

  const pending = /(?:welches spielerlevel|welche spielklasse|leistungsniveau|welches land|welcher standort|welche position|welcher jahrgang|geburtsjahrgang)/i.test(assistantContext);
  const scoutingIntent = /\b(benötige|brauche|suche|finde|scoute|recherchiere|spieler|talent|kandidaten|scouting)\b/i.test(context);
  const hasCriteria = !!(yearFrom || position || region);
  const shouldHandle = pending || (scoutingIntent && (hasCriteria || !!quantityMatch));
  const missing = [];
  if (shouldHandle) {
    if (!yearFrom) missing.push('Geburtsjahrgang');
    if (!position) missing.push('Position');
    if (!region) missing.push('Land bzw. Liga-Standort');
  }
  const needsTargetLevel = shouldHandle && missing.length === 0 && !targetLevel;
  return {
    shouldHandle, missing, needsTargetLevel,
    request: { quantity, yearFrom, yearTo, position, region, targetLevel }
  };
}
