/**
 * MESSINHO conversation response integrity guard.
 * Prevents ordinary conversational replies from claiming unverified mutations.
 */
const MAX_REPLY_LENGTH = 5000;
const EMPTY_REPLY = 'Ich möchte dir sinnvoll antworten. Kannst du deine Frage bitte kurz präzisieren?';
const UNVERIFIED_ACTION_REPLY = 'Ich möchte keine Änderung oder Systemaktion als erledigt darstellen, die nicht tatsächlich ausgeführt und bestätigt wurde. Ich kann dir aber den nächsten Schritt erklären.';
const CLAIM_PATTERNS = [
  /\b(?:ich|wir)\s+(?:habe|haben|hab|hatte|hatten)\b[^.!?\n]{0,120}\b(?:gespeichert|gemerkt|angelegt|erstellt|gelöscht|entfernt|geändert|aktualisiert|bereitgestellt|deployt|deployed|behoben|repariert|installiert|ausgeführt|zusammengeführt|aktiviert|veröffentlicht|eingereicht|hochgeladen|heruntergeladen)\b/iu,
  /\b(?:i|we)\s+(?:have|has|had|did)\b[^.!?\n]{0,120}\b(?:saved|created|deleted|removed|updated|changed|deployed|fixed|repaired|installed|executed|merged|activated|published|submitted|uploaded|downloaded)\b/iu,
  /(?<![\p{L}\p{N}])(?:j['’]ai|nous avons|j['’]avais)\b[^.!?\n]{0,120}(?<![\p{L}\p{N}])(?:enregistré|enregistrée|créé|créée|supprimé|supprimée|modifié|modifiée|déployé|déployée|corrigé|corrigée)(?![\p{L}\p{N}])/iu,
  /\b(?:he|hemos|había|habíamos)\b[^.!?\n]{0,120}\b(?:guardado|guardada|creado|creada|eliminado|eliminada|actualizado|actualizada|desplegado|desplegada|reparado|reparada|corregido|corregida|instalado|instalada|ejecutado|ejecutada)\b/iu,
  /(?:قمت(?:\s+ب)?|حفظت|أنشأت|حذفت|عدلت|حدّثت|نشرت|نفذت|أصلحت|ثبتت)[^.!؟?\n]{0,120}(?:حفظ|إنشاء|حذف|تعديل|تحديث|نشر|تنفيذ|إصلاح|تثبيت)/u
];
const NEGATION = /(?:\b(?:nicht|nie|nichts|kein(?:e|en|er|es)?|not|never|nothing|no|pas|jamais|nunca|nada|ning[uú]n|ninguna|tampoco|haven't|hasn't|didn't|don't|cannot|can't)\b|n['’]ai\s+pas|n['’]avons\s+pas|لم\s+|ما\s+)/iu;

function hasUnverifiedMutationClaim(reply) {
  return CLAIM_PATTERNS.some(pattern => {
    const match = pattern.exec(reply);
    if (!match) return false;
    const sentenceStart = Math.max(reply.lastIndexOf('.', match.index), reply.lastIndexOf('!', match.index), reply.lastIndexOf('?', match.index), reply.lastIndexOf('\n', match.index)) + 1;
    const phrase = reply.slice(Math.max(sentenceStart, match.index - 24), match.index + match[0].length).replace(/\bnicht\s+nur\b/iu, 'nur');
    return !NEGATION.test(phrase);
  });
}

export function guardMessinhoConversationReply(decision) {
  if (!decision || decision.intent !== 'conversation') {
    return {ok:false,code:'wrong_intent',reply:EMPTY_REPLY};
  }
  const reply = typeof decision.reply === 'string' ? decision.reply.trim().slice(0, MAX_REPLY_LENGTH) : '';
  if (!reply) return {ok:false,code:'empty_reply',reply:EMPTY_REPLY};
  if (hasUnverifiedMutationClaim(reply)) {
    return {ok:false,code:'unverified_action_claim',reply:UNVERIFIED_ACTION_REPLY};
  }
  return {ok:true,code:'accepted',reply};
}
