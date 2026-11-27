const MAX_NOTES=20;
const MAX_NOTE_LENGTH=240;

export function detectExplicitMessinhoRememberRequest(input){
  if(typeof input!=='string')return null;
  const match=input.trim().match(/^(?:bitte\\s+)?(?:merke\\s+dir|merk\\s+dir|erinnere\\s+dich|speichere(?:\\s+dir)?|notiere(?:\\s+dir)?|remember|please\\s+remember)\\s+(?:bitte\\s+)?(.+?)\\s*[.!?]*$/iu);
  if(!match)return null;
  const note=match[1].trim().replace(/^["'„“”]+|["'„“”]+$/g,'').slice(0,MAX_NOTE_LENGTH).trim();
  return note.length>=2?note:null;
}

export function isMessinhoMemoryRecallRequest(input){
  if(typeof input!=='string')return false;
  const normalized=input.trim().toLocaleLowerCase('de-DE');
  return /\\b(was habe ich dir (?:gesagt|genannt|aufgetragen)|welches? (?:testwort|wort|ding) habe ich dir (?:gesagt|genannt)|was hast du dir gemerkt|woran sollst du dich erinnern|was erinnerst du)\\b/u.test(normalized)
    || /\\b(what did i ask you to remember|what do you remember about me|what did i tell you to remember)\\b/i.test(normalized);
}

export function appendMessinhoUserNote(userPreferences,note,createdAt=new Date().toISOString()){
  const preferences=userPreferences&&typeof userPreferences==='object'&&!Array.isArray(userPreferences)?{...userPreferences}:{};
  const existing=Array.isArray(preferences.messinho_notes)?preferences.messinho_notes:[];
  const safeNote=String(note||'').trim().slice(0,MAX_NOTE_LENGTH);
  if(!safeNote)return preferences;
  const duplicate=existing.find(item=>typeof item?.text==='string'&&item.text.toLocaleLowerCase('de-DE')===safeNote.toLocaleLowerCase('de-DE'));
  const next=duplicate?existing.filter(item=>item!==duplicate):existing;
  preferences.messinho_notes=[...next,{text:safeNote,created_at:createdAt}].slice(-MAX_NOTES);
  return preferences;
}

export function getMessinhoUserNotes(userPreferences){
  if(!userPreferences||typeof userPreferences!=='object'||!Array.isArray(userPreferences.messinho_notes))return [];
  return userPreferences.messinho_notes
    .filter(item=>item&&typeof item.text==='string'&&item.text.trim())
    .slice(-MAX_NOTES);
}
