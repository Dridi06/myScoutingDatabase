export const CONTRACT_STATES = Object.freeze([
  'active','expiring','expired','extension_reported','extension_confirmed',
  'option_reported','option_confirmed','loan_active','loan_return_due','loan_returned',
  'purchase_option_reported','purchase_option_exercised','purchase_obligation_reported',
  'transfer_agreed','transfer_completed','terminated','free_agent_confirmed','unknown','conflicting'
]);

export const CONTRACT_STATE_LABELS = Object.freeze({
  active:'Laufender Vertrag', expiring:'Kurz vor Vertragsende', expired:'Vertrag ausgelaufen',
  extension_reported:'Verlängerung berichtet', extension_confirmed:'Verlängerung bestätigt',
  option_reported:'Vertragsoption berichtet', option_confirmed:'Vertragsoption bestätigt',
  loan_active:'Aktuell verliehen', loan_return_due:'Leihende / Rückkehr bevorstehend',
  loan_returned:'Aus Leihe zurückgekehrt', purchase_option_reported:'Kaufoption berichtet',
  purchase_option_exercised:'Kaufoption gezogen', purchase_obligation_reported:'Kaufpflicht berichtet',
  transfer_agreed:'Wechsel vereinbart', transfer_completed:'Wechsel vollzogen',
  terminated:'Vertrag aufgelöst', free_agent_confirmed:'Vereinslos bestätigt',
  unknown:'Unbekannt', conflicting:'Widersprüchliche Angaben'
});

const validDate = value => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

export function deriveContractHorizon(contractEnd, now = new Date()) {
  const end = validDate(contractEnd);
  if (!end) return {daysRemaining:null, horizon:'unknown', label:'Vertragsende nicht bekannt'};
  const today = new Date(now);
  today.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  const daysRemaining = Math.ceil((end.getTime()-today.getTime())/86400000);
  if (daysRemaining < 0) return {daysRemaining, horizon:'past', label:'Vertragsende liegt zurück'};
  if (daysRemaining <= 183) return {daysRemaining, horizon:'within_6_months', label:'Vertragsende innerhalb von 6 Monaten'};
  if (daysRemaining <= 365) return {daysRemaining, horizon:'within_12_months', label:'Vertragsende innerhalb von 12 Monaten'};
  return {daysRemaining, horizon:'beyond_12_months', label:'Mehr als 12 Monate Restlaufzeit'};
}

export function assessContractEvidence(row) {
  const issues = [];
  if (!row?.source_url || !/^https?:\/\//i.test(row.source_url)) issues.push('Keine gültige Quellenadresse');
  if (!row?.event_date && !row?.published_at) issues.push('Ereignis- und Veröffentlichungsdatum fehlen');
  if (!row?.identity_status || row.identity_status !== 'matched') issues.push('Spieleridentität nicht bestätigt');
  if (!['confirmed','corroborated'].includes(row?.verification_status)) issues.push('Angabe nicht ausreichend bestätigt');
  if (row?.data_classification === 'health_sensitive' && row?.legal_review_status !== 'approved') issues.push('Gesundheitsdaten ohne rechtliche Freigabe gesperrt');
  return {usable:issues.length===0,issues};
}

export function compareContractAndPerformance(events, metrics, {minimumMinutes=450}={}) {
  const contractEvents=(events||[]).filter(e=>e.event_date && ['contract_negotiation','contract_status','transfer','transfer_rumour','extension_confirmed'].includes(e.claim_type));
  const results=[];
  for (const event of contractEvents) {
    const at=validDate(event.event_date);
    if (!at) continue;
    const before=(metrics||[]).filter(m=>validDate(m.match_date)<at);
    const after=(metrics||[]).filter(m=>validDate(m.match_date)>=at);
    const beforeMinutes=before.reduce((s,m)=>s+(Number(m.minutes)||0),0);
    const afterMinutes=after.reduce((s,m)=>s+(Number(m.minutes)||0),0);
    const beforeRate=beforeMinutes?before.reduce((s,m)=>s+(Number(m.metric_value)||0),0)/(beforeMinutes/90):null;
    const afterRate=afterMinutes?after.reduce((s,m)=>s+(Number(m.metric_value)||0),0)/(afterMinutes/90):null;
    const adequate=beforeMinutes>=minimumMinutes && afterMinutes>=minimumMinutes;
    results.push({
      event_date:event.event_date,claim_type:event.claim_type,
      before:{matches:before.length,minutes:beforeMinutes,rate:beforeRate},
      after:{matches:after.length,minutes:afterMinutes,rate:afterRate},
      adequate,delta:adequate&&beforeRate!==null&&afterRate!==null?Number((afterRate-beforeRate).toFixed(3)):null,
      interpretation:adequate?'Deskriptiver zeitlicher Vergleich; kein Kausalitätsnachweis.':'Zu geringe Spielminuten für einen belastbaren Vergleich.'
    });
  }
  return results;
}
