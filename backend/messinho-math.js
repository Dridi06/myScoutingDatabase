/**
 * Deterministic MESSINHO mathematics and physics engine.
 * No eval/Function. Validated inputs, reproducible calculations and traceable formulas.
 */
const clean=v=>String(v??'').trim();
const round=(v,d=8)=>Number(v.toFixed(d));
const fmt=v=>new Intl.NumberFormat('de-DE',{maximumFractionDigits:6}).format(v);
const factorial=n=>{let x=1;for(let i=2;i<=n;i++)x*=i;return x;};
const erf=x=>{const sign=x<0?-1:1;x=Math.abs(x);const t=1/(1+0.3275911*x);const y=1-(((((1.061405429*t-1.453152027)*t)+1.421413741)*t-0.284496736)*t+0.254829592)*t*Math.exp(-x*x);return sign*y;};
const normalCdf=z=>0.5*(1+erf(z/Math.SQRT2));
const choose=(n,k)=>{if(k<0||k>n)return 0;let x=1;for(let i=1;i<=Math.min(k,n-k);i++)x=x*(n-i+1)/i;return x;};
function tokenize(s){const x=s.replace(/,/g,'.').replace(/×/g,'*').replace(/[·⋅]/g,'*').replace(/÷/g,'/').replace(/−/g,'-').replace(/\s+/g,'');const t=x.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/%^]/g)||[];if(t.join('')!==x||!t.length)throw Error('Der Ausdruck enthält nicht unterstützte Zeichen.');return t;}
function evaluate(s){
 const t=tokenize(s);let i=0;const peek=()=>t[i],take=()=>t[i++];
 function primary(){const x=take();if(x==='('){const v=add();if(take()!==')')throw Error('Klammer nicht geschlossen.');return v;}if(x==='+'||x==='-'){const v=primary();return x==='-'?-v:v;}const n=Number(x);if(!Number.isFinite(n))throw Error('Zahl erwartet.');return n;}
 function power(){let v=primary();if(peek()==='^'){take();v=v**unary();}return v;}
 function unary(){return power();}
 function mul(){let v=unary();while(['*','/','%'].includes(peek())){const op=take(),r=unary();if((op==='/'||op==='%')&&r===0)throw Error('Division durch null ist nicht definiert.');v=op==='*'?v*r:op==='/'?v/r:v%r;}return v;}
 function add(){let v=mul();while(peek()==='+'||peek()==='-'){const op=take(),r=mul();v=op==='+'?v+r:v-r;}return v;}
 const v=add();if(i!==t.length||!Number.isFinite(v))throw Error('Der Ausdruck ist ungültig oder das Ergebnis nicht endlich.');return v;
}
const out=(kind,title,value,formula,steps,extra={})=>{if(!Number.isFinite(value))throw Error('Das Ergebnis ist nicht endlich. Bitte prüfe die Eingabewerte und Einheiten.');return {status:'completed',kind,title,value:round(value),formatted:fmt(value),formula,steps,assumptions:[],...extra};};
function params(q){const p={};for(const m of q.matchAll(/\b(population|successes|draws|mu|sigma|n|p|k|lambda|λ|a|b|c|m|v|v0|v1|t|s|g|h|energie|volumen|kraft|flaeche|r|x|u|i|f|frequenz|wellenlaenge|wellenlänge)\s*[:=]\s*(-?\d+(?:[.,]\d+)?)/giu)){p[m[1].toLowerCase().replace('λ','lambda')]=Number(m[2].replace(',','.'));}return p;}
function quantity(q,units){
 const unitPattern=units.map(x=>x[0]).join('|');
 const m=q.match(new RegExp('(-?\\d+(?:[.,]\\d+)?)\\s*('+unitPattern+')(?![a-z])','i'));
 if(!m)return null;
 const unit=m[2].toLowerCase(),value=Number(m[1].replace(',','.'));
 const entry=units.find(x=>new RegExp('^(?:'+x[0]+')$','i').test(unit));
 if(!entry)return null;
 return {value:value*entry[1],raw:value,unit:entry[2]};
}
function naturalPhysics(q){
 const distance=quantity(q,[['kilometer|kilometer|km',1000,'km'],['meter|meter|metern|meter',1,'m'],['zentimeter|zentimeter|cm',0.01,'cm'],['millimeter|millimeter|mm',0.001,'mm']]);
 const time=quantity(q,[['stunden|stunde|stunden|h',3600,'h'],['minuten|minute|min',60,'min'],['sekunden|sekunde|sek|s',1,'s']]);
 if(distance&&time&&time.value>0&&distance.value>=0&&/(geschwindigkeit|tempo|schnell|läuft|laeuft|fährt|faehrt|zurücklegt|zuruecklegt|legt zurück|legt zurueck)/i.test(q)){
  const speed=distance.value/time.value;
  return out('physics','Durchschnittsgeschwindigkeit',speed,'v = s / t',
   ['Strecke: '+distance.raw+' '+distance.unit+' = '+fmt(distance.value)+' m','Zeit: '+time.raw+' '+time.unit+' = '+fmt(time.value)+' s','v = '+fmt(distance.value)+' m ÷ '+fmt(time.value)+' s'],
   {unit:'m/s',converted:{km_h:round(speed*3.6),formatted_km_h:fmt(speed*3.6)+' km/h'},known_values:{distance_m:distance.value,time_s:time.value},unknown:'Durchschnittsgeschwindigkeit',assumptions:['Gleichmäßig gemittelte Geschwindigkeit über die gesamte Strecke.']});
 }
 if(distance&&time&&time.value>0&&distance.value>=0&&/\\bin\\s+\\d+(?:[.,]\\d+)?\\s*(?:sekunden|sekunde|minuten|minute|stunden|stunde)/i.test(q)){
  const speed=distance.value/time.value;
  return out('physics','Durchschnittsgeschwindigkeit',speed,'v = s / t',
   ['Strecke: '+fmt(distance.value)+' m','Zeit: '+fmt(time.value)+' s'],
   {unit:'m/s',converted:{km_h:round(speed*3.6),formatted_km_h:fmt(speed*3.6)+' km/h'},known_values:{distance_m:distance.value,time_s:time.value},unknown:'Durchschnittsgeschwindigkeit'});
 }
 return null;
}
function probability(q){
 const p=params(q),n=p.n,k=p.k,prob=p.p;
 if(/binomial|binomialverteilung|scouting.*wahrscheinlichkeit|wahrscheinlichkeit.*scouting/i.test(q)&&Number.isInteger(n)&&n>=0&&n<=1000&&prob>=0&&prob<=1&&Number.isInteger(k)&&k>=0&&k<=n){
  const mode=/mindestens|at least/i.test(q)?'at_least':/höchstens|hoechstens|at most/i.test(q)?'at_most':'exact';let sum=0;
  for(let j=0;j<=n;j++)if((mode==='exact'&&j===k)||(mode==='at_least'&&j>=k)||(mode==='at_most'&&j<=k))sum+=choose(n,j)*prob**j*(1-prob)**(n-j);
  return out('probability','Binomialwahrscheinlichkeit',sum*100,'P(X = k) = C(n,k) · p^k · (1−p)^(n−k)',['n = '+n+' unabhängige Versuche','p = '+(prob*100).toFixed(2)+' % je Versuch','Gesucht: '+(mode==='exact'?'genau':mode==='at_least'?'mindestens':'höchstens')+' '+k+' Erfolge'],{unit:'%',probability:sum,scouting_interpretation:'Gilt nur bei unabhängigen, gleichartigen Versuchen mit konstanter Erfolgswahrscheinlichkeit.'});
 }
 if(/poisson|poissonverteilung/i.test(q)&&p.lambda>=0&&p.lambda<=1000&&Number.isInteger(k)&&k>=0&&k<=1000){
  const l=p.lambda,pmf=j=>Math.exp(-l)*l**j/factorial(j),mode=/mindestens/.test(q)?'at_least':/höchstens|hoechstens/.test(q)?'at_most':'exact';
  let v=mode==='exact'?pmf(k):0;if(mode==='at_least'){v=1;for(let j=0;j<k;j++)v-=pmf(j);}if(mode==='at_most'){for(let j=0;j<=k;j++)v+=pmf(j);}
  return out('probability','Poissonwahrscheinlichkeit',v*100,'P(X=k) = e^(−λ) · λ^k / k!',['λ = '+l+' erwartete Ereignisse','Gesucht: '+mode+' '+k+' Ereignisse'],{unit:'%',probability:v,assumptions:['Unabhängige Ereignisse mit konstanter mittlerer Rate.']});
 }
 if(/bayes|bedingte wahrscheinlichkeit/i.test(q)&&[p.a,p.b,p.c].every(x=>Number.isFinite(x)&&x>=0&&x<=1)){
  const v=p.b*p.a/(p.b*p.a+p.c*(1-p.a));return out('probability','Bayes-Update',v*100,'P(A|B)=P(B|A)P(A)/[P(B|A)P(A)+P(B|¬A)P(¬A)]',['Prior = '+p.a,'Sensitivität = '+p.b,'Falsch-Positiv-Rate = '+p.c],{unit:'%',probability:v});
 }
 if(/hypergeometr/i.test(q)&&Number.isInteger(p.population)&&Number.isInteger(p.successes)&&Number.isInteger(p.draws)&&Number.isInteger(p.k)&&p.population>0&&p.successes>=0&&p.successes<=p.population&&p.draws>=0&&p.draws<=p.population&&p.k>=0&&p.k<=p.draws){
  const N=p.population,K=p.successes,n=p.draws,k=p.k,mode=/mindestens/.test(q)?'at_least':/höchstens|hoechstens/.test(q)?'at_most':'exact';let sum=0;
  for(let j=0;j<=n;j++)if((mode==='exact'&&j===k)||(mode==='at_least'&&j>=k)||(mode==='at_most'&&j<=k))sum+=choose(K,j)*choose(N-K,n-j)/choose(N,n);
  return out('probability','Hypergeometrische Wahrscheinlichkeit',sum*100,'P(X=k)=C(K,k)·C(N−K,n−k)/C(N,n)',['Population N = '+N,'Davon Erfolge K = '+K,'Stichprobe n = '+n,'Gesucht: '+mode+' '+k+' Treffer'],{unit:'%',probability:sum,assumptions:['Ziehen ohne Zurücklegen aus einer endlichen Population.']});
 }
 if(/normalverteilung|normal distribution/i.test(q)&&Number.isFinite(p.mu)&&Number.isFinite(p.sigma)&&p.sigma>0&&Number.isFinite(p.x)){
  const z=(p.x-p.mu)/p.sigma,v=normalCdf(z);return out('probability','Kumulative Normalverteilung',v*100,'P(X ≤ x)=Φ((x−μ)/σ)',['Mittelwert μ = '+p.mu,'Standardabweichung σ = '+p.sigma,'Grenzwert x = '+p.x,'z = '+z.toFixed(4)],{unit:'%',probability:v,distribution:{z_score:z,mean:p.mu,standard_deviation:p.sigma}});
 }
 if(/z.?score|standardwert/i.test(q)&&Number.isFinite(p.mu)&&Number.isFinite(p.sigma)&&p.sigma>0&&Number.isFinite(p.x)){
  const z=(p.x-p.mu)/p.sigma;return out('statistics','z-Wert',z,'z = (x−μ)/σ',['x = '+p.x,'μ = '+p.mu,'σ = '+p.sigma]);
 }
 if(/kombination|binomialkoeffizient|n\s+über\s+k/i.test(q)&&Number.isInteger(p.n)&&Number.isInteger(p.k)&&p.n>=0&&p.k>=0&&p.k<=p.n){
  const v=choose(p.n,p.k);return out('arithmetic','Kombination ohne Reihenfolge',v,'C(n,k)=n!/[k!(n−k)!]',['n = '+p.n,'k = '+p.k]);
 }
 if(/wilson|konfidenzintervall|trefferquote.*intervall/i.test(q)&&Number.isInteger(p.n)&&Number.isInteger(p.k)&&p.n>0&&p.k>=0&&p.k<=p.n){
  const z=1.96,phat=p.k/p.n,z2=z*z,den=1+z2/p.n,center=(phat+z2/(2*p.n))/den,margin=z*Math.sqrt((phat*(1-phat)+z2/(4*p.n))/p.n)/den;
  return out('probability','95-%-Konfidenzintervall (Wilson)',phat*100,'Wilson-Intervall: (p̂ + z²/2n ± z·√(p̂(1−p̂)/n + z²/4n²)) / (1+z²/n)',['Erfolge = '+p.k+' von '+p.n+' Versuchen','Beobachtete Quote = '+(phat*100).toFixed(2)+' %','95-%-Intervall = '+(Math.max(0,center-margin)*100).toFixed(2)+' % bis '+(Math.min(1,center+margin)*100).toFixed(2)+' %'],{unit:'%',probability:phat,confidence_interval:{level:0.95,lower:Math.max(0,center-margin),upper:Math.min(1,center+margin)},scouting_interpretation:'Beschreibt statistische Unsicherheit der beobachteten Quote; keine individuelle Spielerprognose.'});
 }
 return null;
}
function physics(q){
 const interpreted=naturalPhysics(q);if(interpreted)return interpreted;
 const p=params(q),has=(...k)=>k.every(x=>Number.isFinite(p[x]));
 if(/newton|kraft berechnen/i.test(q)&&has('m','a'))return out('physics','Kraft nach Newton',p.m*p.a,'F = m · a',['m = '+p.m+' kg','a = '+p.a+' m/s²'],{unit:'N'});
 if(/geschwindigkeit|tempo berechnen/i.test(q)&&has('s','t')&&p.t!==0)return out('physics','Durchschnittsgeschwindigkeit',p.s/p.t,'v = s / t',['s = '+p.s+' m','t = '+p.t+' s'],{unit:'m/s'});
 if(/beschleunigung/i.test(q)&&has('v1','v0','t')&&p.t!==0)return out('physics','Beschleunigung',(p.v1-p.v0)/p.t,'a = (v − v₀) / t',['v₀ = '+p.v0+' m/s','v = '+p.v1+' m/s','t = '+p.t+' s'],{unit:'m/s²'});
 if(/kinetische energie|bewegungsenergie/i.test(q)&&has('m','v'))return out('physics','Kinetische Energie',0.5*p.m*p.v**2,'Eₖ = ½ · m · v²',['m = '+p.m+' kg','v = '+p.v+' m/s'],{unit:'J'});
 if(/potenzielle energie|lageenergie/i.test(q)&&has('m','g','h'))return out('physics','Potenzielle Energie',p.m*p.g*p.h,'Eₚ = m · g · h',['m = '+p.m+' kg','g = '+p.g+' m/s²','h = '+p.h+' m'],{unit:'J'});
 if(/leistung/i.test(q)&&has('energie','t')&&p.t!==0)return out('physics','Leistung',p.energie/p.t,'P = E / t',['E = '+p.energie+' J','t = '+p.t+' s'],{unit:'W'});
 if(/dichte/i.test(q)&&has('m','volumen')&&p.volumen!==0)return out('physics','Dichte',p.m/p.volumen,'ρ = m / V',['m = '+p.m+' kg','V = '+p.volumen+' m³'],{unit:'kg/m³'});
 if(/druck/i.test(q)&&has('kraft','flaeche')&&p.flaeche!==0)return out('physics','Druck',p.kraft/p.flaeche,'p = F / A',['F = '+p.kraft+' N','A = '+p.flaeche+' m²'],{unit:'Pa'});
 if(/impuls/i.test(q)&&has('m','v'))return out('physics','Impuls',p.m*p.v,'p = m · v',['m = '+p.m+' kg','v = '+p.v+' m/s'],{unit:'kg·m/s'});
 if(/arbeit/i.test(q)&&has('kraft','s'))return out('physics','Mechanische Arbeit',p.kraft*p.s,'W = F · s',['F = '+p.kraft+' N','s = '+p.s+' m'],{unit:'J'});
 if(/hooke|federkraft/i.test(q)&&has('k','x'))return out('physics','Federkraft nach Hooke',p.k*p.x,'F = k · x',['k = '+p.k+' N/m','x = '+p.x+' m'],{unit:'N'});
 if(/ohm|spannung/i.test(q)&&has('u','i')&&p.i!==0)return out('physics','Elektrischer Widerstand',p.u/p.i,'R = U / I',['U = '+p.u+' V','I = '+p.i+' A'],{unit:'Ω'});
 if(/ohm|widerstand/i.test(q)&&has('u','i')&&p.i===0)return {status:'invalid_input',kind:'physics',message:'Der Strom I darf bei R = U / I nicht null sein.'};
 if(/elektrische leistung/i.test(q)&&has('u','i'))return out('physics','Elektrische Leistung',p.u*p.i,'P = U · I',['U = '+p.u+' V','I = '+p.i+' A'],{unit:'W'});
 if(/wellengeschwindigkeit/i.test(q)&&has('frequenz','wellenlaenge'))return out('physics','Wellengeschwindigkeit',p.frequenz*p.wellenlaenge,'v = f · λ',['f = '+p.frequenz+' Hz','λ = '+p.wellenlaenge+' m'],{unit:'m/s'});
 if(/kreisumfang/i.test(q)&&has('r'))return out('physics','Kreisumfang',2*Math.PI*p.r,'U = 2πr',['r = '+p.r+' m'],{unit:'m'});
 if(/kreisfläche/i.test(q)&&has('r'))return out('physics','Kreisfläche',Math.PI*p.r**2,'A = πr²',['r = '+p.r+' m'],{unit:'m²'});
 return null;
}
export function calculateMessinhoMathQuestion(question){
 const q=clean(question);if(!q||q.length>1200)return null;
 // A bare four-digit year range is a scouting/date filter, not subtraction.
 if(/^\s*\d{4}\s*[-–—]\s*\d{4}\s*$/.test(q))return null;
 try{
  const ph=physics(q);if(ph)return ph;const pr=probability(q);if(pr)return pr;
  const expressionText=q.replace(/\bgeteilt durch\b/gi,'/').replace(/\bplus\b/gi,'+').replace(/\bminus\b/gi,'-').replace(/\bmal\b/gi,'*').replace(/÷/g,'/').replace(/×/g,'*');
  let m=expressionText.match(/(?:wie viel sind|was sind|berechne|rechne|calculate)?\s*([0-9.,\s()+\-*/%^·]+)\s*[?]?$/i);
  if(m&&/[+*/%^·-]/.test(m[1])&&(m[1].match(/\d+(?:[.,]\d+)?/g)||[]).length>=2){const e=m[1].replace(/,/g,'.').replace(/·/g,'*');const v=evaluate(e);return out('arithmetic','Mathematische Berechnung',v,e,['Ausdruck: '+e,'Punktrechnung vor Strichrechnung; Klammern zuerst.']);}
  m=q.match(/(-?\d+(?:[.,]\d+)?)\s*(?:%|prozent)\s*(?:von|aus)\s*(-?\d+(?:[.,]\d+)?)/i);
  if(m){const a=Number(m[1].replace(',','.')),b=Number(m[2].replace(',','.')),v=b*a/100;return out('arithmetic','Prozentrechnung',v,a+' % von '+b+' = '+b+' · '+a+' / 100',[a+' % = '+a/100,b+' · '+a/100+' = '+fmt(v)]);}
  m=q.match(/dreisatz\D{0,40}(\d+(?:[.,]\d+)?)\D{1,15}(\d+(?:[.,]\d+)?)\D{1,30}(\d+(?:[.,]\d+)?)/i);
  if(m){const [a,b,c]=m.slice(1).map(x=>Number(x.replace(',','.')));if(a!==0){const v=b*c/a;return out('arithmetic','Dreisatz (proportional)',v,'x = ('+b+' · '+c+') / '+a,[a+' entsprechen '+b,c+' entsprechen x','x = '+b+' × '+c+' ÷ '+a]);}}
  if(/bruch|fraction/i.test(q)){m=q.match(/(-?\d+)\s*\/\s*(\d+)/);if(m&&Number(m[2])!==0){const v=Number(m[1])/Number(m[2]);return out('arithmetic','Bruchrechnung',v,m[1]+' / '+m[2],['Zähler ÷ Nenner = '+fmt(v)]);}}
  if(/wahrscheinlichkeit|binomial|poisson|bayes|physik|newton|energie|dichte|druck|impuls/i.test(q))return {status:'needs_inputs',kind:/physik|newton|energie|dichte|druck|impuls/i.test(q)?'physics':'probability',message:'Für diese Berechnung fehlen Parameter. Beispiele: Binomial n=10 p=0,7 k=5; Newton m=80 a=3.'};
  return null;
 }catch(e){return {status:'invalid_input',kind:'arithmetic',message:e.message};}
}
,'i').test(unit));
 return {value:value*entry[1],raw:value,unit:entry[2]};
}
function naturalPhysics(q){
 const distance=quantity(q,[['kilometer|kilometer|km',1000,'km'],['meter|meter|metern|meter',1,'m'],['zentimeter|zentimeter|cm',0.01,'cm'],['millimeter|millimeter|mm',0.001,'mm']]);
 const time=quantity(q,[['stunden|stunde|stunden|h',3600,'h'],['minuten|minute|min',60,'min'],['sekunden|sekunde|sek|s',1,'s']]);
 if(distance&&time&&time.value>0&&distance.value>=0&&/(geschwindigkeit|tempo|schnell|läuft|laeuft|fährt|faehrt|zurücklegt|zuruecklegt|legt zurück|legt zurueck)/i.test(q)){
  const speed=distance.value/time.value;
  return out('physics','Durchschnittsgeschwindigkeit',speed,'v = s / t',
   ['Strecke: '+distance.raw+' '+distance.unit+' = '+fmt(distance.value)+' m','Zeit: '+time.raw+' '+time.unit+' = '+fmt(time.value)+' s','v = '+fmt(distance.value)+' m ÷ '+fmt(time.value)+' s'],
   {unit:'m/s',converted:{km_h:round(speed*3.6),formatted_km_h:fmt(speed*3.6)+' km/h'},known_values:{distance_m:distance.value,time_s:time.value},unknown:'Durchschnittsgeschwindigkeit',assumptions:['Gleichmäßig gemittelte Geschwindigkeit über die gesamte Strecke.']});
 }
 if(distance&&time&&time.value>0&&distance.value>=0&&/\\bin\\s+\\d+(?:[.,]\\d+)?\\s*(?:sekunden|sekunde|minuten|minute|stunden|stunde)/i.test(q)){
  const speed=distance.value/time.value;
  return out('physics','Durchschnittsgeschwindigkeit',speed,'v = s / t',
   ['Strecke: '+fmt(distance.value)+' m','Zeit: '+fmt(time.value)+' s'],
   {unit:'m/s',converted:{km_h:round(speed*3.6),formatted_km_h:fmt(speed*3.6)+' km/h'},known_values:{distance_m:distance.value,time_s:time.value},unknown:'Durchschnittsgeschwindigkeit'});
 }
 return null;
}
function probability(q){
 const p=params(q),n=p.n,k=p.k,prob=p.p;
 if(/binomial|binomialverteilung|scouting.*wahrscheinlichkeit|wahrscheinlichkeit.*scouting/i.test(q)&&Number.isInteger(n)&&n>=0&&n<=1000&&prob>=0&&prob<=1&&Number.isInteger(k)&&k>=0&&k<=n){
  const mode=/mindestens|at least/i.test(q)?'at_least':/höchstens|hoechstens|at most/i.test(q)?'at_most':'exact';let sum=0;
  for(let j=0;j<=n;j++)if((mode==='exact'&&j===k)||(mode==='at_least'&&j>=k)||(mode==='at_most'&&j<=k))sum+=choose(n,j)*prob**j*(1-prob)**(n-j);
  return out('probability','Binomialwahrscheinlichkeit',sum*100,'P(X = k) = C(n,k) · p^k · (1−p)^(n−k)',['n = '+n+' unabhängige Versuche','p = '+(prob*100).toFixed(2)+' % je Versuch','Gesucht: '+(mode==='exact'?'genau':mode==='at_least'?'mindestens':'höchstens')+' '+k+' Erfolge'],{unit:'%',probability:sum,scouting_interpretation:'Gilt nur bei unabhängigen, gleichartigen Versuchen mit konstanter Erfolgswahrscheinlichkeit.'});
 }
 if(/poisson|poissonverteilung/i.test(q)&&p.lambda>=0&&p.lambda<=1000&&Number.isInteger(k)&&k>=0&&k<=1000){
  const l=p.lambda,pmf=j=>Math.exp(-l)*l**j/factorial(j),mode=/mindestens/.test(q)?'at_least':/höchstens|hoechstens/.test(q)?'at_most':'exact';
  let v=mode==='exact'?pmf(k):0;if(mode==='at_least'){v=1;for(let j=0;j<k;j++)v-=pmf(j);}if(mode==='at_most'){for(let j=0;j<=k;j++)v+=pmf(j);}
  return out('probability','Poissonwahrscheinlichkeit',v*100,'P(X=k) = e^(−λ) · λ^k / k!',['λ = '+l+' erwartete Ereignisse','Gesucht: '+mode+' '+k+' Ereignisse'],{unit:'%',probability:v,assumptions:['Unabhängige Ereignisse mit konstanter mittlerer Rate.']});
 }
 if(/bayes|bedingte wahrscheinlichkeit/i.test(q)&&[p.a,p.b,p.c].every(x=>Number.isFinite(x)&&x>=0&&x<=1)){
  const v=p.b*p.a/(p.b*p.a+p.c*(1-p.a));return out('probability','Bayes-Update',v*100,'P(A|B)=P(B|A)P(A)/[P(B|A)P(A)+P(B|¬A)P(¬A)]',['Prior = '+p.a,'Sensitivität = '+p.b,'Falsch-Positiv-Rate = '+p.c],{unit:'%',probability:v});
 }
 if(/hypergeometr/i.test(q)&&Number.isInteger(p.population)&&Number.isInteger(p.successes)&&Number.isInteger(p.draws)&&Number.isInteger(p.k)&&p.population>0&&p.successes>=0&&p.successes<=p.population&&p.draws>=0&&p.draws<=p.population&&p.k>=0&&p.k<=p.draws){
  const N=p.population,K=p.successes,n=p.draws,k=p.k,mode=/mindestens/.test(q)?'at_least':/höchstens|hoechstens/.test(q)?'at_most':'exact';let sum=0;
  for(let j=0;j<=n;j++)if((mode==='exact'&&j===k)||(mode==='at_least'&&j>=k)||(mode==='at_most'&&j<=k))sum+=choose(K,j)*choose(N-K,n-j)/choose(N,n);
  return out('probability','Hypergeometrische Wahrscheinlichkeit',sum*100,'P(X=k)=C(K,k)·C(N−K,n−k)/C(N,n)',['Population N = '+N,'Davon Erfolge K = '+K,'Stichprobe n = '+n,'Gesucht: '+mode+' '+k+' Treffer'],{unit:'%',probability:sum,assumptions:['Ziehen ohne Zurücklegen aus einer endlichen Population.']});
 }
 if(/normalverteilung|normal distribution/i.test(q)&&Number.isFinite(p.mu)&&Number.isFinite(p.sigma)&&p.sigma>0&&Number.isFinite(p.x)){
  const z=(p.x-p.mu)/p.sigma,v=normalCdf(z);return out('probability','Kumulative Normalverteilung',v*100,'P(X ≤ x)=Φ((x−μ)/σ)',['Mittelwert μ = '+p.mu,'Standardabweichung σ = '+p.sigma,'Grenzwert x = '+p.x,'z = '+z.toFixed(4)],{unit:'%',probability:v,distribution:{z_score:z,mean:p.mu,standard_deviation:p.sigma}});
 }
 if(/z.?score|standardwert/i.test(q)&&Number.isFinite(p.mu)&&Number.isFinite(p.sigma)&&p.sigma>0&&Number.isFinite(p.x)){
  const z=(p.x-p.mu)/p.sigma;return out('statistics','z-Wert',z,'z = (x−μ)/σ',['x = '+p.x,'μ = '+p.mu,'σ = '+p.sigma]);
 }
 if(/kombination|binomialkoeffizient|n\s+über\s+k/i.test(q)&&Number.isInteger(p.n)&&Number.isInteger(p.k)&&p.n>=0&&p.k>=0&&p.k<=p.n){
  const v=choose(p.n,p.k);return out('arithmetic','Kombination ohne Reihenfolge',v,'C(n,k)=n!/[k!(n−k)!]',['n = '+p.n,'k = '+p.k]);
 }
 if(/wilson|konfidenzintervall|trefferquote.*intervall/i.test(q)&&Number.isInteger(p.n)&&Number.isInteger(p.k)&&p.n>0&&p.k>=0&&p.k<=p.n){
  const z=1.96,phat=p.k/p.n,z2=z*z,den=1+z2/p.n,center=(phat+z2/(2*p.n))/den,margin=z*Math.sqrt((phat*(1-phat)+z2/(4*p.n))/p.n)/den;
  return out('probability','95-%-Konfidenzintervall (Wilson)',phat*100,'Wilson-Intervall: (p̂ + z²/2n ± z·√(p̂(1−p̂)/n + z²/4n²)) / (1+z²/n)',['Erfolge = '+p.k+' von '+p.n+' Versuchen','Beobachtete Quote = '+(phat*100).toFixed(2)+' %','95-%-Intervall = '+(Math.max(0,center-margin)*100).toFixed(2)+' % bis '+(Math.min(1,center+margin)*100).toFixed(2)+' %'],{unit:'%',probability:phat,confidence_interval:{level:0.95,lower:Math.max(0,center-margin),upper:Math.min(1,center+margin)},scouting_interpretation:'Beschreibt statistische Unsicherheit der beobachteten Quote; keine individuelle Spielerprognose.'});
 }
 return null;
}
function physics(q){
 const interpreted=naturalPhysics(q);if(interpreted)return interpreted;
 const p=params(q),has=(...k)=>k.every(x=>Number.isFinite(p[x]));
 if(/newton|kraft berechnen/i.test(q)&&has('m','a'))return out('physics','Kraft nach Newton',p.m*p.a,'F = m · a',['m = '+p.m+' kg','a = '+p.a+' m/s²'],{unit:'N'});
 if(/geschwindigkeit|tempo berechnen/i.test(q)&&has('s','t')&&p.t!==0)return out('physics','Durchschnittsgeschwindigkeit',p.s/p.t,'v = s / t',['s = '+p.s+' m','t = '+p.t+' s'],{unit:'m/s'});
 if(/beschleunigung/i.test(q)&&has('v1','v0','t')&&p.t!==0)return out('physics','Beschleunigung',(p.v1-p.v0)/p.t,'a = (v − v₀) / t',['v₀ = '+p.v0+' m/s','v = '+p.v1+' m/s','t = '+p.t+' s'],{unit:'m/s²'});
 if(/kinetische energie|bewegungsenergie/i.test(q)&&has('m','v'))return out('physics','Kinetische Energie',0.5*p.m*p.v**2,'Eₖ = ½ · m · v²',['m = '+p.m+' kg','v = '+p.v+' m/s'],{unit:'J'});
 if(/potenzielle energie|lageenergie/i.test(q)&&has('m','g','h'))return out('physics','Potenzielle Energie',p.m*p.g*p.h,'Eₚ = m · g · h',['m = '+p.m+' kg','g = '+p.g+' m/s²','h = '+p.h+' m'],{unit:'J'});
 if(/leistung/i.test(q)&&has('energie','t')&&p.t!==0)return out('physics','Leistung',p.energie/p.t,'P = E / t',['E = '+p.energie+' J','t = '+p.t+' s'],{unit:'W'});
 if(/dichte/i.test(q)&&has('m','volumen')&&p.volumen!==0)return out('physics','Dichte',p.m/p.volumen,'ρ = m / V',['m = '+p.m+' kg','V = '+p.volumen+' m³'],{unit:'kg/m³'});
 if(/druck/i.test(q)&&has('kraft','flaeche')&&p.flaeche!==0)return out('physics','Druck',p.kraft/p.flaeche,'p = F / A',['F = '+p.kraft+' N','A = '+p.flaeche+' m²'],{unit:'Pa'});
 if(/impuls/i.test(q)&&has('m','v'))return out('physics','Impuls',p.m*p.v,'p = m · v',['m = '+p.m+' kg','v = '+p.v+' m/s'],{unit:'kg·m/s'});
 if(/arbeit/i.test(q)&&has('kraft','s'))return out('physics','Mechanische Arbeit',p.kraft*p.s,'W = F · s',['F = '+p.kraft+' N','s = '+p.s+' m'],{unit:'J'});
 if(/hooke|federkraft/i.test(q)&&has('k','x'))return out('physics','Federkraft nach Hooke',p.k*p.x,'F = k · x',['k = '+p.k+' N/m','x = '+p.x+' m'],{unit:'N'});
 if(/ohm|spannung/i.test(q)&&has('u','i')&&p.i!==0)return out('physics','Elektrischer Widerstand',p.u/p.i,'R = U / I',['U = '+p.u+' V','I = '+p.i+' A'],{unit:'Ω'});
 if(/ohm|widerstand/i.test(q)&&has('u','i')&&p.i===0)return {status:'invalid_input',kind:'physics',message:'Der Strom I darf bei R = U / I nicht null sein.'};
 if(/elektrische leistung/i.test(q)&&has('u','i'))return out('physics','Elektrische Leistung',p.u*p.i,'P = U · I',['U = '+p.u+' V','I = '+p.i+' A'],{unit:'W'});
 if(/wellengeschwindigkeit/i.test(q)&&has('frequenz','wellenlaenge'))return out('physics','Wellengeschwindigkeit',p.frequenz*p.wellenlaenge,'v = f · λ',['f = '+p.frequenz+' Hz','λ = '+p.wellenlaenge+' m'],{unit:'m/s'});
 if(/kreisumfang/i.test(q)&&has('r'))return out('physics','Kreisumfang',2*Math.PI*p.r,'U = 2πr',['r = '+p.r+' m'],{unit:'m'});
 if(/kreisfläche/i.test(q)&&has('r'))return out('physics','Kreisfläche',Math.PI*p.r**2,'A = πr²',['r = '+p.r+' m'],{unit:'m²'});
 return null;
}
export function calculateMessinhoMathQuestion(question){
 const q=clean(question);if(!q||q.length>1200)return null;
 // A bare four-digit year range is a scouting/date filter, not subtraction.
 if(/^\s*\d{4}\s*[-–—]\s*\d{4}\s*$/.test(q))return null;
 try{
  const ph=physics(q);if(ph)return ph;const pr=probability(q);if(pr)return pr;
  const expressionText=q.replace(/\bgeteilt durch\b/gi,'/').replace(/\bplus\b/gi,'+').replace(/\bminus\b/gi,'-').replace(/\bmal\b/gi,'*').replace(/÷/g,'/').replace(/×/g,'*');
  let m=expressionText.match(/(?:wie viel sind|was sind|berechne|rechne|calculate)?\s*([0-9.,\s()+\-*/%^·]+)\s*[?]?$/i);
  if(m&&/[+*/%^·-]/.test(m[1])&&(m[1].match(/\d+(?:[.,]\d+)?/g)||[]).length>=2){const e=m[1].replace(/,/g,'.').replace(/·/g,'*');const v=evaluate(e);return out('arithmetic','Mathematische Berechnung',v,e,['Ausdruck: '+e,'Punktrechnung vor Strichrechnung; Klammern zuerst.']);}
  m=q.match(/(-?\d+(?:[.,]\d+)?)\s*(?:%|prozent)\s*(?:von|aus)\s*(-?\d+(?:[.,]\d+)?)/i);
  if(m){const a=Number(m[1].replace(',','.')),b=Number(m[2].replace(',','.')),v=b*a/100;return out('arithmetic','Prozentrechnung',v,a+' % von '+b+' = '+b+' · '+a+' / 100',[a+' % = '+a/100,b+' · '+a/100+' = '+fmt(v)]);}
  m=q.match(/dreisatz\D{0,40}(\d+(?:[.,]\d+)?)\D{1,15}(\d+(?:[.,]\d+)?)\D{1,30}(\d+(?:[.,]\d+)?)/i);
  if(m){const [a,b,c]=m.slice(1).map(x=>Number(x.replace(',','.')));if(a!==0){const v=b*c/a;return out('arithmetic','Dreisatz (proportional)',v,'x = ('+b+' · '+c+') / '+a,[a+' entsprechen '+b,c+' entsprechen x','x = '+b+' × '+c+' ÷ '+a]);}}
  if(/bruch|fraction/i.test(q)){m=q.match(/(-?\d+)\s*\/\s*(\d+)/);if(m&&Number(m[2])!==0){const v=Number(m[1])/Number(m[2]);return out('arithmetic','Bruchrechnung',v,m[1]+' / '+m[2],['Zähler ÷ Nenner = '+fmt(v)]);}}
  if(/wahrscheinlichkeit|binomial|poisson|bayes|physik|newton|energie|dichte|druck|impuls/i.test(q))return {status:'needs_inputs',kind:/physik|newton|energie|dichte|druck|impuls/i.test(q)?'physics':'probability',message:'Für diese Berechnung fehlen Parameter. Beispiele: Binomial n=10 p=0,7 k=5; Newton m=80 a=3.'};
  return null;
 }catch(e){return {status:'invalid_input',kind:'arithmetic',message:e.message};}
}
