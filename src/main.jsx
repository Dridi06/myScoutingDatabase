import React,{useEffect,useMemo,useState} from 'react';
import{createRoot}from'react-dom/client';
import{createClient}from'@supabase/supabase-js';
import{Goal,LayoutDashboard,UserPlus,Pencil,Trash2,Search,Database,LogOut,ShieldCheck,Menu,X}from'lucide-react';
import'./styles.css';
const url=import.meta.env.VITE_SUPABASE_URL,key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const sb=url&&key?createClient(url,key):null;
const RATING_SECTIONS={
 Technik:['Dribbling','Passspiel kurz','Passspiel lang','Beidfüssigkeit','Kopfballspiel','1:1 Offensiv','Ball An/Mitnahme','Erster Kontakt','Repertoire Finten','Variabler Torschuss'],
 Taktik:['1:1 Defensiv','Kreativität','Raumverhalten','Spiel ohne Ball','Anspielbereitschaft','Zweikampf','Umschaltspiel','Handlungsschnelligkeit','Antizipationsfähigkeit','Lösen vom Gegner'],
 Athletik:['Laufbild','Laufaktivität','Körperlichkeit','Antrittsschnelligkeit','Schnelligkeit Distanz','Bewegungsgeschicklichkeit'],
 Mentalität:['Einstellung','Führungsspieler','Kommunikation','Risikofreude','Positive Körpersprache','Teamplayer','Spieleinfluss','Disziplin/Konzentration']
};
const POS=['AV re/li','IV re/li','6er','8er','10er','Flügel re/li','9er'];
const EMPTY={name:'',club:'',year:'',foot:'Rechtsfuß',positions:[],category:'',height:'',observed_on:new Date().toISOString().slice(0,10),notes:'',ratings:{},contract:false,contract_term:'',agent:false,agent_name:'',documented_by:'',father_contact:'',father_phone:'',mother_contact:'',mother_phone:''};
function BrandMark(){return <svg className="brand-mark" viewBox="0 0 120 132" role="img" aria-label="myScoutingDatabase Logo">
 <defs>
  <linearGradient id="crest-red" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff6476"/><stop offset=".48" stopColor="#ff1838"/><stop offset="1" stopColor="#8e0922"/></linearGradient>
  <linearGradient id="crest-steel" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".45" stopColor="#aeb6c5"/><stop offset="1" stopColor="#596273"/></linearGradient>
  <radialGradient id="ball-white" cx=".3" cy=".2" r=".85"><stop stopColor="#fff"/><stop offset=".58" stopColor="#d8dce4"/><stop offset="1" stopColor="#737d8d"/></radialGradient>
  <filter id="crest-glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
 </defs>
 <path d="M60 4 111 24v39c0 29-19 49-51 65C28 112 9 92 9 63V24Z" fill="#090b11" stroke="url(#crest-red)" strokeWidth="5" filter="url(#crest-glow)"/>
 <path d="M60 13 101 29v33c0 23-15 40-41 54C34 102 19 85 19 62V29Z" fill="#151a24" stroke="url(#crest-steel)" strokeWidth="2"/>
 <path d="M60 22 91 34v27c0 18-11 31-31 43-20-12-31-25-31-43V34Z" fill="url(#crest-red)"/>
 <path d="M60 28 84 38v22c0 14-9 25-24 34-15-9-24-20-24-34V38Z" fill="#10151f" stroke="#ff9aa5" strokeOpacity=".55"/>
 <circle cx="60" cy="57" r="23" fill="url(#ball-white)" stroke="#fff" strokeWidth="1.5"/>
 <path d="m60 43 9 7-3 11H54l-3-11Zm-9 7-9 3-4 10 8 9 9-11m23-11 9 3 4 10-8 9-9-11M46 72l8 9-2 8m22-17-8 9 2 8m-14-9h12" fill="#111722" stroke="#111722" strokeWidth="2.3" strokeLinejoin="round"/>
 <path d="M31 92 60 110 89 92" fill="none" stroke="#ff6678" strokeOpacity=".8" strokeWidth="1.3"/>
 <path d="M14 26 60 8l46 18" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1"/>
</svg>}
function App(){
 const [session,S]=useState(null),[profile,P]=useState(null),[players,D]=useState([]),[scouts,SC]=useState([]),[page,G]=useState('dashboard'),[authMode,AM]=useState('login'),[auth,A]=useState({username:'',email:'',password:'',password2:''}),[form,F]=useState(EMPTY),[edit,E]=useState(null),[search,Q]=useState(''),[filters,FT]=useState({year:'',position:'',foot:''}),[deleteId,DI]=useState(''),[notice,N]=useState(''),[loading,L]=useState(false),[drawer,DR]=useState(false);
 const admin=profile?.role==='admin';
 async function load(){if(!sb||!session)return;L(true);try{const{data:pr,error}=await sb.from('profiles').select('*').eq('id',session.user.id).single();if(error)throw error;P(pr);const{data,error:pe}=await sb.from('players').select('*').order('player_id');if(pe)throw pe;D((data||[]).map(p=>({...p,id:p.player_id,positions:p.positions||[],ratings:p.ratings||{}})));if(pr.role==='admin'){const{data:s}=await sb.from('profiles').select('*').eq('role','scout').order('created_at',{ascending:false});SC(s||[]);}}catch(e){N(e.message)}finally{L(false)}}
 useEffect(()=>{if(!sb)return;sb.auth.getSession().then(({data})=>{if(data.session)S({user:data.session.user})});const{data:{subscription}}=sb.auth.onAuthStateChange((_e,s)=>{if(s)S({user:s.user});else S(null)});return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{load()},[session]);
 async function login(e){e.preventDefault();L(true);try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:auth.username,password:auth.password})});const j=await r.json();if(!r.ok)throw Error(j.error);const{error}=await sb.auth.setSession({access_token:j.access_token,refresh_token:j.refresh_token});if(error)throw error;}catch(e){N(e.message)}finally{L(false)}}
 async function register(e){e.preventDefault();L(true);try{const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(auth)});const j=await r.json();if(!r.ok)throw Error(j.error);N('Registrierung eingegangen. Der Admin muss deinen Zugang freischalten.');AM('login')}catch(e){N(e.message)}finally{L(false)}}
 async function save(e){e.preventDefault();L(true);try{const {id,player_id,owner_id,created_at,updated_at,...cleanForm}=form;const payload={...cleanForm,height:form.height?Number(form.height):null,positions:form.positions,ratings:form.ratings};let q;if(edit)q=await sb.from('players').update(payload).eq('player_id',edit);else q=await sb.rpc('create_player',{p_player:payload});if(q.error)throw q.error;N('Spielerdaten gespeichert.');F(EMPTY);E(null);G('all');await load()}catch(e){N(e.message)}finally{L(false)}}
 async function remove(){const{error}=await sb.from('players').delete().eq('player_id',Number(deleteId));if(error)N(error.message);else{N('Spieler gelöscht.');DI('');await load()}}
 async function approve(s){const{error}=await sb.rpc('admin_set_scout_approval',{p_scout_id:s.id,p_approved:!s.approved});if(error)N(error.message);else await load()}
 const filtered=useMemo(()=>players.filter(p=>[p.name,p.club,p.year,p.foot,...(p.positions||[])].join(' ').toLowerCase().includes(search.toLowerCase())&&(!filters.year||String(p.year||'').includes(filters.year))&&(!filters.position||(p.positions||[]).includes(filters.position))&&(!filters.foot||p.foot===filters.foot)),[players,search,filters]);
 if(!session)return <div className="auth auth-redesign auth-no-logo">
  <div className="auth-particles" aria-hidden="true">
   <span/><span/><span/><span/><span/><span/><span/><span/>
   <div className="auth-orbit orbit-one"/><div className="auth-orbit orbit-two"/>
   <div className="auth-field-line field-one"/><div className="auth-field-line field-two"/>
  </div>
  <header className="auth-topbar">
   <div className="auth-wordmark"><span>myScouting</span><strong>Database</strong><i>.</i></div>
   <div className="auth-top-tag"><i/> PROFESSIONAL SCOUTING PLATFORM</div>
  </header>
  <main className="auth-layout">
   <section className="auth-showcase">
    <div className="showcase-eyebrow"><span/> THE FUTURE OF FOOTBALL SCOUTING</div>
    <h1>Jedes Talent hat<br/>eine <em>Geschichte.</em></h1>
    <p className="showcase-copy">Erkenne Potenziale früher. Bewerte Leistungen präziser. Triff Entscheidungen mit Überblick – in einer zentralen Scouting-Plattform.</p>
    <div className="showcase-rule"/>
    <div className="showcase-features">
     <div><span className="feature-symbol">01</span><section><b>LIVE SCOUTING</b><small>Talente strukturiert erfassen</small></section></div>
     <div><span className="feature-symbol">02</span><section><b>PLAYER ANALYTICS</b><small>Leistungen fundiert analysieren</small></section></div>
     <div><span className="feature-symbol">03</span><section><b>TALENT DATABASE</b><small>Informationen zentral bündeln</small></section></div>
    </div>
    <div className="showcase-signature">SCOUT SMARTER <b>◆</b> THINK AHEAD</div>
   </section>
   <section className="auth-card auth-card-new">
    <div className="auth-card-topline"><span>MEMBER ACCESS</span><span className="auth-card-status"><i/> SECURE LOGIN</span></div>
    <div className="auth-card-wordmark"><span>myScouting</span><strong>Database</strong></div>
    <div className="auth-card-line"/>
    <div className="auth-kicker"><span/> {authMode==='login'?'WELCOME BACK':'JOIN THE NETWORK'}</div>
    <h2>{authMode==='login'?'Schön, dass du da bist.':'Dein Scout-Zugang.'}</h2>
    <p className="auth-intro">{authMode==='login'?'Melde dich an und setze deine Arbeit mit den Talenten fort.':'Erstelle deinen Zugang zur Scouting-Plattform.'}</p>
    <form onSubmit={authMode==='login'?login:register} className="auth-form-new">
     <label><span>BENUTZERNAME</span><input autoComplete="username" placeholder="Benutzername eingeben" value={auth.username} onChange={e=>A({...auth,username:e.target.value})} required/></label>
     {authMode==='register'&&<label><span>E-MAIL-ADRESSE</span><input type="email" autoComplete="email" placeholder="name@verein.de" value={auth.email} onChange={e=>A({...auth,email:e.target.value})} required/></label>}
     <label><span>PASSWORT</span><input type="password" autoComplete={authMode==='login'?'current-password':'new-password'} placeholder="Passwort eingeben" value={auth.password} onChange={e=>A({...auth,password:e.target.value})} required/></label>
     {authMode==='register'&&<label><span>PASSWORT WIEDERHOLEN</span><input type="password" autoComplete="new-password" placeholder="Passwort bestätigen" value={auth.password2} onChange={e=>A({...auth,password2:e.target.value})} required/></label>}
     <button className="auth-submit" disabled={loading}>{loading?'BITTE WARTEN…':authMode==='login'?'JETZT ANMELDEN':'REGISTRIERUNG ABSENDEN'}<span>↗</span></button>
    </form>
    <div className="auth-switch"><span>{authMode==='login'?'Noch keinen Zugang?':'Bereits registriert?'}</span><button className="link" onClick={()=>AM(authMode==='login'?'register':'login')}>{authMode==='login'?'Scout registrieren':'Zur Anmeldung'}</button></div>
    {notice&&<p className="notice">{notice}</p>}
    <div className="auth-card-foot"><span><i/> CONNECTION ENCRYPTED</span><span>MYSCOUTINGDATABASE</span></div>
   </section>
  </main>
  <footer className="auth-footer"><span>© 2026 MYSCOUTINGDATABASE</span><span>BUILT FOR THE GAME <b>◆</b></span><span>PRECISION. PASSION. PERFORMANCE.</span></footer>
 </div>;
 const nav=[['dashboard','Dashboard',LayoutDashboard],['create','Spieler erstellen',UserPlus],['edit','Spieler bearbeiten',Pencil],['delete','Spieler löschen',Trash2],['search','Datenbankabfrage',Search],['all','Gesamte Spielerdatenbank',Database],...(admin?[['scouts','Scout-Verwaltung',ShieldCheck]]:[])];
 return <div className="shell"><aside className={drawer?'open':''}><div className="logo"><BrandMark/><div className="sidebar-brand"><span>myScouting</span><strong>Database</strong><small>PLAYER SCOUTING</small></div><button className="close" onClick={()=>DR(false)} aria-label="Menü schließen"><X/></button></div>{nav.map(([id,label,Icon])=><button className={page===id?'active':''} onClick={()=>{G(id);DR(false)}}><Icon size={18}/>{label}</button>)}<button className="logout" onClick={()=>sb.auth.signOut()}><LogOut/> Abmelden</button></aside><main><header><button className="menu" onClick={()=>DR(true)}><Menu/></button><span>WORKSPACE / {page.toUpperCase()}</span><b>{profile?.username}</b></header>{notice&&<p className="notice" onClick={()=>N('')}>{notice} ×</p>}
 {page==='dashboard'&&<><h1>Dashboard</h1><div className="stats"><article><small>SPIELER GESAMT</small><strong>{players.length}</strong></article><article><small>SCOUT-KONTEN</small><strong>{admin?scouts.length:'1'}</strong></article><article><small>POSITIONEN</small><strong>{POS.length}</strong></article></div><h2>Spieler nach Position</h2><div className="stats">{POS.map(p=><article><small>{p}</small><strong>{players.filter(x=>x.positions?.includes(p)).length}</strong></article>)}</div></>}
 {['create','edit'].includes(page)&&<><h1>{page==='edit'?'Spieler bearbeiten':'Spieler erstellen'}</h1>{page==='edit'&&!edit&&<div className="panel">{players.map(p=><button className="pick" onClick={()=>{F({...EMPTY,...p});E(p.id)}}>#{p.id} · {p.name} · Jg. {p.year}</button>)}</div>}{(page==='create'||edit)&&<form className="panel form" onSubmit={save}><div className="grid">{[['name','Spielername'],['club','Verein'],['year','Jahrgang'],['height','Größe (cm)'],['documented_by','Erfasst von'],['category','Kategorie'],['contract_term','Vertragslaufzeit'],['agent_name','Berater'],['father_contact','Kontakt Vater'],['father_phone','Telefon Vater'],['mother_contact','Kontakt Mutter'],['mother_phone','Telefon Mutter']].map(([k,l])=><label>{l}<input value={form[k]||''} onChange={e=>F({...form,[k]:e.target.value})}/></label>)}<label>Spielfuß<select value={form.foot} onChange={e=>F({...form,foot:e.target.value})}><option>Rechtsfuß</option><option>Linksfuß</option></select></label><label>Beobachtet am<input type="date" value={form.observed_on||''} onChange={e=>F({...form,observed_on:e.target.value})}/></label></div><label>Positionen</label><div className="checks">{POS.map(p=><label><input type="checkbox" checked={form.positions.includes(p)} onChange={e=>F({...form,positions:e.target.checked?[...form.positions,p]:form.positions.filter(x=>x!==p)})}/>{p}</label>)}</div><div className="checks"><label><input type="checkbox" checked={!!form.contract} onChange={e=>F({...form,contract:e.target.checked})}/> Vertrag vorhanden</label><label><input type="checkbox" checked={!!form.agent} onChange={e=>F({...form,agent:e.target.checked})}/> Berater vorhanden</label></div><h2>Scouting-Bewertung · Skala 1–4</h2><div className="ratings">{Object.entries(RATING_SECTIONS).map(([section,criteria])=><section><h3>{section}</h3><div className="rating-grid">{criteria.map(c=><label>{c}<select value={form.ratings?.[c]||''} onChange={e=>F({...form,ratings:{...form.ratings,[c]:Number(e.target.value)}})}><option value="">–</option>{[1,2,3,4].map(n=><option value={n}>{n}</option>)}</select></label>)}</div></section>)}</div><label>Notizen<textarea value={form.notes||''} onChange={e=>F({...form,notes:e.target.value})}/></label><button>{loading?'Speichern…':'Spieler speichern'}</button></form>}</>}
 {['all','search'].includes(page)&&<><h1>{page==='search'?'Datenbankabfrage':'Gesamte Spielerdatenbank'}</h1><input className="search" placeholder="Name oder Verein suchen…" value={search} onChange={e=>Q(e.target.value)}/><div className="filter-row"><input aria-label="Jahrgang" placeholder="Jahrgang" value={filters.year} onChange={e=>FT({...filters,year:e.target.value})}/><select aria-label="Position" value={filters.position} onChange={e=>FT({...filters,position:e.target.value})}><option value="">Alle Positionen</option>{POS.map(p=><option>{p}</option>)}</select><select aria-label="Spielfuß" value={filters.foot} onChange={e=>FT({...filters,foot:e.target.value})}><option value="">Alle Füße</option><option>Linksfuß</option><option>Rechtsfuß</option></select><button onClick={()=>{Q('');FT({year:'',position:'',foot:''})}}>Filter zurücksetzen</button></div><div className="panel table"><table><thead><tr><th>ID</th><th>Name</th><th>Verein</th><th>Jahrgang</th><th>Position</th><th>Fuß</th><th></th></tr></thead><tbody>{filtered.map(p=><tr><td>#{p.id}</td><td>{p.name}</td><td>{p.club}</td><td>{p.year}</td><td>{p.positions?.join(', ')}</td><td>{p.foot}</td><td><button onClick={()=>{F({...EMPTY,...p});E(p.id);G('edit')}}>Bearbeiten</button></td></tr>)}</tbody></table></div></>}
 {page==='delete'&&<><h1>Spieler löschen</h1><div className="panel"><label>Spieler-ID<input type="number" min="1" value={deleteId} onChange={e=>DI(e.target.value)}/></label><button className="danger" onClick={()=>{if(window.confirm('Spieler endgültig löschen?'))remove()}}>Spieler-ID löschen</button></div></>}
 {page==='scouts'&&admin&&<><h1>Scout-Verwaltung</h1><div className="panel table"><table><thead><tr><th>Benutzername</th><th>E-Mail</th><th>Status</th><th></th></tr></thead><tbody>{scouts.map(s=><tr><td>{s.username}</td><td>{s.email}</td><td>{s.approved?'Freigeschaltet':'Ausstehend'}</td><td><button onClick={()=>approve(s)}>{s.approved?'Sperren':'Freischalten'}</button></td></tr>)}</tbody></table></div></>}
 </main></div>;
}
createRoot(document.getElementById('root')).render(<App/>);