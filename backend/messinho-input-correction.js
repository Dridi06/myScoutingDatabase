const PHRASE_CORRECTIONS = [
  [/\bab\s+schl(i|ie|i)ssen\b/giu, 'abschließen'],
  [/\babschluss\s+stark\b/giu, 'abschlussstark'],
  [/\bmittel\s+stürmer\b/giu, 'mittelstürmer'],
  [/\binnen\s+verteidiger\b/giu, 'Innenverteidiger'],
  [/\blinks\s+verteidiger\b/giu, 'Linksverteidiger'],
  [/\brechts\s+verteidiger\b/giu, 'Rechtsverteidiger']
];

const VOCABULARY = [
  'suche','such','finde','zeige','spieler','spielerin','stürmer','mittelstürmer',
  'innenverteidiger','linksverteidiger','rechtsverteidiger','torwart','flügelspieler',
  'schnell','schnelligkeit','abschluss','abschließen','abschlussschwach','technik',
  'dribbling','passspiel','passgenauigkeit','kopfball','zweikampf','ausdauer',
  'potential','potenzial','talent','kandidat','kandidaten','vergleich','vergleiche',
  'rangliste','bewertung','bewerte','scouting','recherchiere','jahrgang','geburtsjahrgang',
  'deutschland','spanien','frankreich','italien','england','regionalliga','oberliga',
  'bundesliga','leistungsniveau','position','linker','rechter','defensiv','offensiv',
  'mittelfeldspieler','zentral','offensivspieler','spielerprofil','datenbank'
];

const ALIASES = new Map([
  ['suhce','suche'], ['sueche','suche'], ['suech','such'], ['finde','finde'],
  ['spiler','spieler'], ['spielr','spieler'], ['spieeler','spieler'],
  ['stuermer','stürmer'], ['sturmer','stürmer'], ['stürmr','stürmer'],
  ['schnel','schnell'], ['schnelll','schnell'], ['schneligkeit','schnelligkeit'],
  ['abschliesen','abschließen'], ['abschliessen','abschließen'],
  ['abschlisen','abschließen'], ['abschlus','abschluss'], ['abschlusss','abschluss'],
  ['mittelfeldspiler','mittelfeldspieler'], ['innenverteidigerer','innenverteidiger'],
  ['kanditat','kandidat'], ['kandidta','kandidat'], ['vergleichee','vergleiche'],
  ['deutchland','deutschland'], ['deutschlan','deutschland'],
  ['spanienn','spanien'], ['regionalligae','regionalliga']
]);

function normalizeToken(value) {
  return String(value).toLocaleLowerCase('de-DE').normalize('NFKC');
}

function editDistanceAtMostTwo(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previous = Array.from({length:b.length+1}, (_,i)=>i);
  for (let i=1;i<=a.length;i++) {
    const current=[i];
    let rowMin=i;
    for(let j=1;j<=b.length;j++) {
      const cost=a[i-1]===b[j-1]?0:1;
      current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+cost);
      rowMin=Math.min(rowMin,current[j]);
    }
    if(rowMin>2)return 3;
    previous=current;
  }
  return previous[b.length];
}

function closestVocabularyMatch(token) {
  if (token.length < 5) return null;
  const limit = token.length >= 9 ? 2 : 1;
  let best = null, bestDistance = limit + 1, tied = false;
  for (const word of VOCABULARY) {
    const distance = editDistanceAtMostTwo(token, normalizeToken(word));
    if (distance < bestDistance) { best=word; bestDistance=distance; tied=false; }
    else if (distance === bestDistance && word !== best) tied=true;
  }
  return best && !tied && bestDistance <= limit ? best : null;
}

/**
 * Conservative German/football-domain correction. Names and unknown words are
 * intentionally preserved; ambiguous corrections are never guessed.
 */
export function correctMessinhoInput(input) {
  const original = String(input ?? '').slice(0, 1200);
  let corrected = original;
  const corrections = [];

  for (const [pattern, replacement] of PHRASE_CORRECTIONS) {
    corrected = corrected.replace(pattern, match => {
      corrections.push({from:match,to:replacement,kind:'phrase'});
      return replacement;
    });
  }

  corrected = corrected.replace(/[\p{L}]+/gu, token => {
    const normalized = normalizeToken(token);
    const exact = ALIASES.get(normalized);
    const suggestion = exact || closestVocabularyMatch(normalized);
    if (!suggestion || suggestion === token) return token;
    corrections.push({from:token,to:suggestion,kind:exact?'known_typo':'contextual_spelling'});
    return suggestion;
  });

  return {
    original,
    corrected,
    changed: corrected !== original,
    corrections,
    confidence: corrections.length ? (corrections.every(item=>item.kind==='known_typo'||item.kind==='phrase')?'high':'medium') : 'unchanged'
  };
}
