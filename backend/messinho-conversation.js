export function classifyMessinhoProviderFailure(status, payload = {}) {
  const error = payload?.error || payload || {};
  const code = String(error.code || error.type || '').toLowerCase();
  const message = String(error.message || '').toLowerCase();
  if (code.includes('insufficient_quota') || code.includes('billing') || /no credits remaining|quota.*exceeded|billing hard limit/.test(message)) {
    return { code: 'provider_quota_exhausted', status: 503, userMessage: 'Die KI-Analyse ist momentan nicht verfügbar, weil das API-Guthaben des KI-Dienstes aufgebraucht ist. Bitte lade das Guthaben auf und versuche es anschließend erneut.' };
  }
  if (status === 401 || code.includes('invalid_api_key') || /incorrect api key|invalid api key/.test(message)) {
    return { code: 'provider_authentication_failed', status: 503, userMessage: 'Die Verbindung zum KI-Dienst ist momentan falsch konfiguriert. Bitte informiere den Administrator.' };
  }
  if (status === 429 || code.includes('rate_limit')) {
    return { code: 'provider_rate_limited', status: 503, userMessage: 'Der KI-Dienst erhält momentan zu viele Anfragen. Bitte versuche es in wenigen Minuten erneut.' };
  }
  if (status >= 500) {
    return { code: 'provider_unavailable', status: 503, userMessage: 'Der KI-Dienst ist momentan vorübergehend nicht erreichbar. Bitte versuche es später erneut.' };
  }
  return { code: 'provider_request_failed', status: 502, userMessage: 'Die KI konnte die Anfrage momentan nicht verarbeiten. Bitte versuche es erneut.' };
}

export function getMessinhoSmallTalkReply(message) {
  const text = String(message || '').normalize('NFKC').toLocaleLowerCase('de-DE')
    .replace(/[’']/g, '').replace(/[^\\p{L}\\p{N}\\s]/gu, ' ').replace(/\\s+/g, ' ').trim();
  if (/^(hallo|hi|hey|guten morgen|guten tag|guten abend|moin|servus)( messinho)?$/.test(text)) {
    return 'Hallo! Schön, dass du da bist. Wie geht es dir?';
  }
  if (/^(wie geht es dir|wie gehts dir|wie gehts|wie gehts messinho|wie geht es dir messinho)$/.test(text)) {
    return 'Mir geht es gut, danke! Und wie geht es dir?';
  }
  if (/^(danke|vielen dank|danke dir|besten dank)$/.test(text)) {
    return 'Sehr gern! Wenn du noch etwas brauchst, bin ich da.';
  }
  if (/^(tschuss|auf wiedersehen|bis bald|bis dann|ciao)$/.test(text)) {
    return 'Bis bald! Ich wünsche dir einen schönen Tag.';
  }
  if (/^(gut und dir|mir gehts gut und dir|mir geht es gut und dir)$/.test(text)) {
    return 'Das freut mich! Mir geht es ebenfalls gut, danke. Was steht bei dir heute an?';
  }
  return null;
}
