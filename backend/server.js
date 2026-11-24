import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

const app=express();
app.set('trust proxy',1);
const PORT=Number(process.env.PORT||3000);
const JWT_SECRET=process.env.JWT_SECRET;
const supabaseUrl=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminUsername=process.env.ADMIN_USERNAME||'Admin';
const adminInitialPassword=process.env.ADMIN_INITIAL_PASSWORD;
if(!JWT_SECRET||JWT_SECRET.length<32) console.warn('WARNING: Set JWT_SECRET to a random value with at least 32 characters.');
if(!supabaseUrl) console.error('CONFIG CHECK: SUPABASE_URL is missing or empty.');
if(!serviceKey) console.error('CONFIG CHECK: SUPABASE_SERVICE_ROLE_KEY is missing or empty.');
if(supabaseUrl&&serviceKey) console.log(`CONFIG CHECK: Supabase server credentials are present (key type: ${serviceKey.startsWith('sb_secret_')?'new secret key':serviceKey.startsWith('eyJ')?'legacy JWT key':'unknown'}).`);
const db=supabaseUrl&&serviceKey?createClient(supabaseUrl,serviceKey,{auth:{autoRefreshToken:false,persistSession:false},global:{headers:{'X-Client-Info':'myscoutingdatabase-server'}}}):null;
async function diagnoseSupabase(){
  if(!supabaseUrl||!serviceKey)return;
  try{
    const response=await fetch(`${supabaseUrl}/rest/v1/`,{headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'User-Agent':'myscoutingdatabase-server/1.0'}});
    const detail=(await response.text()).slice(0,300).replace(/[\\r\\n]+/g,' ');
    console.log(`SUPABASE CHECK: Data API returned HTTP ${response.status}; response: ${detail}`);
  }catch(e){console.error('SUPABASE CHECK: Data API request failed:',e.message);}
}
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'},contentSecurityPolicy:{directives:{connectSrc:["'self'",...(supabaseUrl?[new URL(supabaseUrl).origin]:[])],imgSrc:["'self'","data:","blob:",...(supabaseUrl?[new URL(supabaseUrl).origin]:[])]}}}));
app.use(cors({origin:(process.env.APP_ORIGIN||'http://localhost:5173').split(',').map(x=>x.trim()),credentials:true}));
app.use(express.json({limit:'1mb'}));
const authLimiter=rateLimit({windowMs:15*60*1000,limit:12,standardHeaders:true,legacyHeaders:false,message:{error:'Zu viele Anmeldeversuche. Bitte später erneut versuchen.'}});
app.use('/api/auth',authLimiter);
async function bootstrapAdmin(){
  if(!db||!adminInitialPassword) return;
  if(adminInitialPassword.length<8){console.error('ADMIN_INITIAL_PASSWORD must contain at least 8 chars.');return;}
  const {data,error}=await db.auth.admin.listUsers({page:1,perPage:1000});
  if(error) throw error;
  if(!process.env.ADMIN_EMAIL){console.error('Set ADMIN_EMAIL to a real, controlled mailbox before creating the admin account.');return;}
  let user=data.users.find(u=>u.user_metadata?.username===adminUsername||u.email===process.env.ADMIN_EMAIL);
  if(!user){
    const email=process.env.ADMIN_EMAIL.trim().toLowerCase();
    const created=await db.auth.admin.createUser({email,password:adminInitialPassword,email_confirm:true,user_metadata:{username:adminUsername,role:'admin'}});
    if(created.error) throw created.error;
    user=created.data.user;
  }
  const {error:profileError}=await db.from('profiles').upsert({id:user.id,username:adminUsername,email:user.email,role:'admin',approved:true,approval_status:'approved'},{onConflict:'id'});
  if(profileError) throw profileError;
  console.log('Admin bootstrap verified. Change the initial password after first login.');
}
function requireAuth(req,res,next){const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!token)return res.status(401).json({error:'Anmeldung erforderlich.'});try{req.user=jwt.verify(token,JWT_SECRET,{issuer:'myScoutingDatabase'});if(!req.user.approved)return res.status(403).json({error:'Konto noch nicht freigeschaltet.'});next();}catch{return res.status(401).json({error:'Sitzung abgelaufen. Bitte erneut anmelden.'});}}
function requireAdmin(req,res,next){if(req.user?.role!=='admin')return res.status(403).json({error:'Admin-Rechte erforderlich.'});next();}
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'myScoutingDatabase',database:!!db}));
app.post('/api/auth/login',async(req,res)=>{
  try{
    if(!db)return res.status(503).json({error:'Datenbankverbindung ist noch nicht konfiguriert.'});
    const {username,password}=req.body||{};
    if(typeof username!=='string'||typeof password!=='string'||!username||!password)return res.status(400).json({error:'Benutzername und Passwort erforderlich.'});
    // Never use the privileged service-role client for end-user sign-in.
    // signInWithPassword mutates the Supabase client's in-memory auth session;
    // sharing that client would replace the service-role request context with
    // the last signed-in scout/admin and can break subsequent profile lookups.
    const publicKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if(!publicKey)return res.status(503).json({error:'Anmeldedienst ist nicht vollständig konfiguriert.'});
    const loginClient=createClient(supabaseUrl,publicKey,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false},global:{headers:{'X-Client-Info':'myscoutingdatabase-login'}}});
    const {data:profile,error:pErr}=await db.from('profiles').select('id,username,email,role,approved,approval_status').ilike('username',username.trim()).maybeSingle();
    if(pErr||!profile)return res.status(401).json({error:'Benutzername oder Passwort ist nicht korrekt.'});
    const signIn=await loginClient.auth.signInWithPassword({email:profile.email,password});
    if(signIn.error)return res.status(401).json({error:'Benutzername oder Passwort ist nicht korrekt.'});
    // Record a verified login server-side so the timestamp does not depend on
    // a browser auth-state callback or an RPC succeeding after setSession.
    const loginAt=new Date().toISOString();
    const {error:loginStampError}=await db.from('profiles').update({last_login_at:loginAt,last_seen_at:loginAt}).eq('id',profile.id);
    if(loginStampError)console.error('Could not record verified login timestamp:',loginStampError.message);
    if(profile.approval_status==='blocked'){
      const ticketToken=jwt.sign({sub:profile.id,username:profile.username,scope:'ticket:create'},JWT_SECRET,{issuer:'myScoutingDatabase',expiresIn:'15m'});
      return res.json({blocked:true,ticket_token:ticketToken,user:{id:profile.id,username:profile.username}});
    }
    if(!profile.approved||profile.approval_status!=='approved')return res.status(403).json({error:'Dein Zugang ist noch nicht vom Administrator freigeschaltet.'});
    res.json({access_token:signIn.data.session.access_token,refresh_token:signIn.data.session.refresh_token,user:{id:profile.id,username:profile.username,role:profile.role,approved:profile.approved}});
  }catch(e){res.status(500).json({error:'Anmeldung aktuell nicht möglich.'});}
});
app.post('/api/auth/register',async(req,res)=>{
  try{
    if(!db)return res.status(503).json({error:'Datenbankverbindung ist noch nicht konfiguriert.'});
    const {username,email,password,password2}=req.body||{};
    if(typeof username!=='string'||typeof email!=='string'||typeof password!=='string')return res.status(400).json({error:'Benutzername, E-Mail und Passwort erforderlich.'});
    if(password!==password2)return res.status(400).json({error:'Die Passwörter stimmen nicht überein.'});
    if(password.length<12)return res.status(400).json({error:'Passwort muss mindestens 12 Zeichen lang sein.'});
    if(!/^[a-zA-Z0-9._-]{3,32}$/.test(username))return res.status(400).json({error:'Benutzername: 3–32 Zeichen (Buchstaben, Zahlen, Punkt, Unterstrich, Bindestrich).'});
    if(!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:'Bitte eine gültige E-Mail-Adresse eingeben.'});
    const {count,error:cErr}=await db.from('profiles').select('*',{count:'exact',head:true}).eq('role','scout');
    if(cErr)throw cErr;
    if(count>=15)return res.status(409).json({error:'Die maximale Anzahl von 15 Scout-Konten ist erreicht.'});
    const {error}=await db.auth.admin.createUser({email:email.trim().toLowerCase(),password,email_confirm:true,user_metadata:{username:username.trim()}});
    if(error)throw error;
    res.status(201).json({ok:true,message:'Registrierung eingegangen. Der Administrator muss dein Scout-Konto freischalten.'});
  }catch(e){const msg=String(e.message||'');res.status(msg.includes('duplicate')||msg.includes('already')?409:500).json({error:msg.includes('duplicate')||msg.includes('already')?'Benutzername oder E-Mail ist bereits vergeben.':'Registrierung konnte nicht abgeschlossen werden.'});}
});
app.get('/api/me',requireAuth,async(req,res)=>res.json({id:req.user.sub,username:req.user.username,role:req.user.role,approved:req.user.approved}));
app.post('/api/scouts',async(req,res)=>{
  try{
    if(!db)return res.status(503).json({error:'Datenbankverbindung ist nicht verfügbar.'});
    const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
    if(!token)return res.status(401).json({error:'Anmeldung erforderlich.'});
    const {data:authData,error:authError}=await db.auth.getUser(token);
    if(authError||!authData?.user)return res.status(401).json({error:'Sitzung ungültig oder abgelaufen.'});
    const {data:actor,error:actorError}=await db.from('profiles').select('id,role').eq('id',authData.user.id).maybeSingle();
    if(actorError||actor?.role!=='admin')return res.status(403).json({error:'Nur Administratoren dürfen Scouts anlegen.'});
    const {username,email,password,password2}=req.body||{};
    if(typeof username!=='string'||typeof email!=='string'||typeof password!=='string')return res.status(400).json({error:'Benutzername, E-Mail und Startpasswort erforderlich.'});
    if(!/^[a-zA-Z0-9._-]{3,32}$/.test(username.trim()))return res.status(400).json({error:'Benutzername: 3–32 Zeichen (Buchstaben, Zahlen, Punkt, Unterstrich, Bindestrich).'});
    if(!/^\S+@\S+\.\S+$/.test(email.trim()))return res.status(400).json({error:'Bitte eine gültige E-Mail-Adresse eingeben.'});
    if(password!==password2)return res.status(400).json({error:'Die Startpasswörter stimmen nicht überein.'});
    if(password.length<12)return res.status(400).json({error:'Das Startpasswort muss mindestens 12 Zeichen lang sein.'});
    const {count,error:countError}=await db.from('profiles').select('id',{count:'exact',head:true}).eq('role','scout');
    if(countError)throw countError;
    if((count||0)>=15)return res.status(409).json({error:'Die maximale Anzahl von 15 Scout-Konten ist erreicht.'});
    const {data:existing,error:existingError}=await db.from('profiles').select('id').ilike('username',username.trim()).maybeSingle();
    if(existingError)throw existingError;
    if(existing)return res.status(409).json({error:'Dieser Benutzername ist bereits vergeben.'});
    const {data:created,error:createError}=await db.auth.admin.createUser({email:email.trim().toLowerCase(),password,email_confirm:true,user_metadata:{username:username.trim(),role:'scout'}});
    if(createError)throw createError;
    const {data:profile,error:profileError}=await db.from('profiles').select('id,username,email,role,approved,approval_status,scout_number').eq('id',created.user.id).maybeSingle();
    if(profileError||!profile||profile.role!=='scout'){
      await db.auth.admin.deleteUser(created.user.id);
      console.error('Scout profile creation did not complete for user:',created.user.id,profileError?.message);
      return res.status(500).json({error:'Scout-Konto wurde nicht vollständig angelegt. Es wurde vorsorglich zurückgerollt. Bitte Datenbank-Trigger prüfen.'});
    }
    return res.status(201).json({ok:true,id:profile.id,username:profile.username,approved:profile.approved});
  }catch(error){
    const msg=String(error.message||'');
    console.error('Admin scout creation failed:',msg);
    return res.status(msg.includes('already')||msg.includes('duplicate')?409:500).json({error:msg.includes('already')||msg.includes('duplicate')?'Diese E-Mail-Adresse oder dieser Benutzername ist bereits vergeben.':'Scout konnte nicht angelegt werden. Bitte Eingaben und Datenbank prüfen.'});
  }
});
app.get('/api/scouts',requireAuth,requireAdmin,async(_req,res)=>{const {data,error}=await db.from('profiles').select('id,username,email,role,approved,created_at').eq('role','scout').order('created_at',{ascending:false});if(error)return res.status(500).json({error:'Scouts konnten nicht geladen werden.'});res.json(data);});
app.patch('/api/scouts/:id/approval',requireAuth,requireAdmin,async(req,res)=>{const approved=!!req.body?.approved;const {data,error}=await db.from('profiles').update({approved}).eq('id',req.params.id).eq('role','scout').select('id,username,approved').maybeSingle();if(error||!data)return res.status(400).json({error:'Freigabe konnte nicht geändert werden.'});res.json(data);});
app.delete('/api/scouts/:id',async(req,res)=>{try{if(!db)return res.status(503).json({error:'Datenbankverbindung ist nicht verfügbar.'});const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!token)return res.status(401).json({error:'Anmeldung erforderlich.'});const {data:authData,error:authError}=await db.auth.getUser(token);if(authError||!authData?.user)return res.status(401).json({error:'Sitzung ungültig oder abgelaufen.'});const {data:actor,error:actorError}=await db.from('profiles').select('role').eq('id',authData.user.id).maybeSingle();if(actorError||actor?.role!=='admin')return res.status(403).json({error:'Nur Administratoren dürfen Scouts löschen.'});const targetId=req.params.id;const {data:target,error:targetError}=await db.from('profiles').select('id,username,email,role').eq('id',targetId).eq('role','scout').maybeSingle();if(targetError||!target)return res.status(404).json({error:'Scout nicht gefunden.'});const {count,error:countError}=await db.from('players').select('player_id',{count:'exact',head:true}).eq('owner_id',targetId);if(countError)return res.status(500).json({error:'Spielerzuordnungen konnten nicht geprüft werden.'});if((count||0)>0)return res.status(409).json({error:'Dieser Scout hat noch '+count+' zugeordnete Spieler. Bitte übertrage oder kläre diese Spieler zuerst. Es wurden keine Daten gelöscht.'});const {data:removedProfile,error:profileDeleteError}=await db.from('profiles').delete().eq('id',targetId).eq('role','scout').select('id,username,email,role').maybeSingle();if(profileDeleteError||!removedProfile)return res.status(500).json({error:'Scout-Profil konnte nicht entfernt werden.'});const {error:authDeleteError}=await db.auth.admin.deleteUser(targetId);if(authDeleteError){const {error:restoreError}=await db.from('profiles').insert(removedProfile);if(restoreError)return res.status(500).json({error:'Auth-Zugang konnte nicht gelöscht werden; zusätzlich ließ sich das Scout-Profil nicht automatisch wiederherstellen. Bitte Datenbank prüfen.'});return res.status(500).json({error:'Scout-Zugang konnte nicht gelöscht werden. Das Profil wurde wiederhergestellt.'});}return res.json({ok:true,id:targetId,username:target.username});}catch(error){console.error('Scout deletion failed:',error);return res.status(500).json({error:'Scout konnte aufgrund eines Serverfehlers nicht gelöscht werden.'});}});
app.post('/api/scouts/:id/reset-password',async(req,res)=>{
  try{
    if(!db)return res.status(503).json({error:'Datenbankverbindung ist nicht verfügbar.'});
    const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
    if(!token)return res.status(401).json({error:'Anmeldung erforderlich.'});
    const {data:authData,error:authError}=await db.auth.getUser(token);
    if(authError||!authData?.user)return res.status(401).json({error:'Sitzung ungültig oder abgelaufen.'});
    const {data:actor,error:actorError}=await db.from('profiles').select('id,role').eq('id',authData.user.id).maybeSingle();
    if(actorError||actor?.role!=='admin')return res.status(403).json({error:'Nur Administratoren dürfen Scout-Passwörter zurücksetzen.'});
    const targetId=req.params.id;
    const {data:target,error:targetError}=await db.from('profiles').select('id,username,email,role').eq('id',targetId).eq('role','scout').maybeSingle();
    if(targetError||!target)return res.status(404).json({error:'Scout nicht gefunden.'});
    const temporaryPassword=randomBytes(24).toString('base64url')+'A7!';
    const {error:resetError}=await db.auth.admin.updateUserById(targetId,{password:temporaryPassword});
    if(resetError){console.error('Scout password reset failed:',{targetId,message:resetError.message});return res.status(500).json({error:'Das Scout-Passwort konnte nicht zurückgesetzt werden.'});}
    console.log('Scout password reset completed:',{targetId,actorId:authData.user.id});
    return res.json({ok:true,username:target.username,email:target.email,temporary_password:temporaryPassword});
  }catch(error){console.error('Scout password reset failed:',error);return res.status(500).json({error:'Passwort konnte aufgrund eines Serverfehlers nicht zurückgesetzt werden.'});}
});
app.get('/api/players',requireAuth,async(req,res)=>{let q=db.from('players').select('*').order('player_id',{ascending:true});if(req.user.role!=='admin')q=q.eq('owner_id',req.user.sub);const {data,error}=await q;if(error)return res.status(500).json({error:'Spieler konnten nicht geladen werden.'});res.json(data);});
app.post('/api/players',requireAuth,async(req,res)=>{const body=req.body||{};const payload={...body,owner_id:req.user.sub};delete payload.player_id;const {data,error}=await db.from('players').insert(payload).select('*').single();if(error)return res.status(400).json({error:'Spieler konnte nicht erstellt werden.'});res.status(201).json(data);});
app.patch('/api/players/:id',requireAuth,async(req,res)=>{const payload={...req.body};delete payload.player_id;delete payload.owner_id;let q=db.from('players').update(payload).eq('player_id',Number(req.params.id)).select('*').maybeSingle();if(req.user.role!=='admin')q=q.eq('owner_id',req.user.sub);const {data,error}=await q;if(error||!data)return res.status(404).json({error:'Spieler nicht gefunden oder kein Zugriff.'});res.json(data);});
app.delete('/api/players/:id',requireAuth,requireAdmin,async(req,res)=>{const id=Number(req.params.id);if(!Number.isSafeInteger(id)||id<1)return res.status(400).json({error:'Ungültige Spieler-ID.'});const {data:player,error:lookupError}=await db.from('players').select('player_id,owner_id,photo_path').eq('player_id',id).maybeSingle();if(lookupError||!player)return res.status(404).json({error:'Spieler nicht gefunden.'});const paths=new Set(player.photo_path?[player.photo_path]:[]);if(player.owner_id){const {data:files,error:fileError}=await db.storage.from('player-photos').list(player.owner_id,{limit:1000});if(fileError)return res.status(500).json({error:'Zugehörige Dateien konnten nicht ermittelt werden.'});for(const file of files||[])if(file.name.startsWith(String(id)+'-'))paths.add(player.owner_id+'/'+file.name)}const {data,error}=await db.from('players').delete().eq('player_id',id).select('player_id').maybeSingle();if(error||!data)return res.status(500).json({error:'Spieler-Datensatz konnte nicht gelöscht werden.'});if(paths.size){const {error:storageError}=await db.storage.from('player-photos').remove([...paths]);if(storageError)return res.status(500).json({error:'Spieler wurde gelöscht, aber Fotodateien konnten nicht vollständig entfernt werden.'})}res.json({ok:true,player_id:data.player_id,deleted_files:paths.size});});

// Blocked scouts receive a short-lived, ticket-only token after Supabase has
// verified their password. It cannot authenticate normal workspace endpoints.
function requireTicketIdentity(req,res,next){
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token)return res.status(401).json({error:'Bitte melde dich erneut mit deinen Zugangsdaten an.'});
  try{
    const claims=jwt.verify(token,JWT_SECRET,{issuer:'myScoutingDatabase'});
    if(claims.scope!=='ticket:create'||!claims.sub)return res.status(403).json({error:'Dieser Zugang darf ausschließlich ein Support-Ticket erstellen.'});
    req.ticketUser=claims;next();
  }catch{return res.status(401).json({error:'Der Ticketzugang ist abgelaufen. Bitte erneut anmelden.'});}
}
const ticketCreateLimiter=rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:true,legacyHeaders:false,message:{error:'Zu viele Ticketanfragen. Bitte später erneut versuchen.'}});
app.post('/api/tickets',ticketCreateLimiter,requireTicketIdentity,async(req,res)=>{
  try{
    const {data:scout,error:scoutError}=await db.from('profiles').select('id,username,role,approved,approval_status').eq('id',req.ticketUser.sub).maybeSingle();
    if(scoutError||!scout||scout.role!=='scout'||scout.approved||scout.approval_status!=='blocked')return res.status(403).json({error:'Für dieses Konto kann kein Ticket erstellt werden.'});
    const category=typeof req.body?.category==='string'?req.body.category.trim():'';
    const message=typeof req.body?.message==='string'?req.body.message.trim():'';
    if(!SCOUT_TICKET_CATEGORIES.includes(category))return res.status(400).json({error:'Bitte wähle einen gültigen Grund für dein Support-Ticket aus.'});
    if(message.length<10)return res.status(400).json({error:'Bitte beschreibe dein Problem mit mindestens 10 Zeichen.'});
    if(message.length>3000)return res.status(400).json({error:'Deine Beschreibung darf höchstens 3.000 Zeichen enthalten.'});
    const {data:existing,error:existingError}=await db.from('support_tickets').select('id').eq('scout_id',scout.id).eq('status','offen').limit(1);
    if(existingError)throw existingError;
    if(existing?.length)return res.status(409).json({error:'Für deinen Account liegt bereits ein offenes Support-Ticket vor.'});
    const {data:ticket,error}=await db.from('support_tickets').insert({scout_id:scout.id,scout_username:scout.username,category,message,status:'offen'}).select('id,scout_id,scout_username,category,message,status,created_at').single();
    if(error)throw error;
    const {error:messageError}=await db.from('support_ticket_messages').insert({ticket_id:ticket.id,sender_id:scout.id,sender_role:'scout',message});
    if(messageError)throw messageError;
    return res.status(201).json(ticket);
  }catch(error){console.error('Support ticket creation failed:',error.message);return res.status(500).json({error:'Ticket konnte nicht erstellt werden. Bitte versuche es erneut.'});}
});
const SCOUT_TICKET_CATEGORIES=[
  'Probleme bei Spieler erstellen',
  'Probleme bei Spieler bearbeiten',
  'Probleme bei der Datenbankabfrage',
  'Probleme bei der gesamten Datenbank',
  'Login Probleme',
  'Anderes Anliegen'
];
const scoutTicketCreateLimiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:true,legacyHeaders:false,message:{error:'Du hast zu viele Support-Tickets erstellt. Bitte versuche es später erneut.'}});
async function requireApprovedScout(req,res,next){
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token)return res.status(401).json({error:'Anmeldung erforderlich.'});
  try{
    const {data:authData,error:authError}=await db.auth.getUser(token);
    if(authError||!authData?.user)return res.status(401).json({error:'Sitzung abgelaufen. Bitte erneut anmelden.'});
    const {data:scout,error:profileError}=await db.from('profiles').select('id,username,role,approved,approval_status').eq('id',authData.user.id).maybeSingle();
    if(profileError||!scout)return res.status(403).json({error:'Scout-Profil konnte nicht geprüft werden.'});
    if(scout.role!=='scout')return res.status(403).json({error:'Dieser Bereich ist ausschließlich für Scouts vorgesehen.'});
    if(!scout.approved||scout.approval_status!=='approved')return res.status(403).json({error:'Dein Scout-Konto ist nicht freigeschaltet.'});
    req.scout=scout;
    next();
  }catch(error){console.error('Scout ticket authentication failed:',error.message);return res.status(401).json({error:'Sitzung konnte nicht geprüft werden. Bitte erneut anmelden.'});}
}
app.get('/api/scout/tickets',requireApprovedScout,async(req,res)=>{
  const {data,error}=await db.from('support_tickets')
    .select('id,scout_id,scout_username,category,message,status,created_at,resolved_at')
    .eq('scout_id',req.scout.id)
    .order('created_at',{ascending:false});
  if(error){console.error('Scout ticket history load failed:',error.message);return res.status(500).json({error:'Deine Support-Tickets konnten nicht geladen werden.'});}
  const ticketIds=(data||[]).map(ticket=>ticket.id);
  let unreadCounts={};
  if(ticketIds.length){
    const {data:unread,error:unreadError}=await db.from('support_ticket_messages').select('ticket_id').in('ticket_id',ticketIds).eq('sender_role','admin').is('scout_read_at',null);
    if(unreadError)return res.status(500).json({error:'Nachrichtenstatus konnte nicht geladen werden.'});
    for(const row of unread||[])unreadCounts[row.ticket_id]=(unreadCounts[row.ticket_id]||0)+1;
  }
  res.set('Cache-Control','no-store');
  res.json((data||[]).map(ticket=>({...ticket,unread_admin_count:unreadCounts[ticket.id]||0})));
});
app.post('/api/scout/tickets',requireApprovedScout,scoutTicketCreateLimiter,async(req,res)=>{
  try{
    const category=typeof req.body?.category==='string'?req.body.category.trim():'';
    const message=typeof req.body?.message==='string'?req.body.message.trim():'';
    if(!SCOUT_TICKET_CATEGORIES.includes(category))return res.status(400).json({error:'Bitte wähle einen gültigen Grund für dein Support-Ticket aus.'});
    if(message.length<10)return res.status(400).json({error:'Bitte beschreibe dein Problem mit mindestens 10 Zeichen.'});
    if(message.length>3000)return res.status(400).json({error:'Deine Beschreibung darf höchstens 3.000 Zeichen enthalten.'});
    const {data:ticket,error}=await db.from('support_tickets').insert({
      scout_id:req.scout.id,
      scout_username:req.scout.username,
      category,
      message,
      status:'offen'
    }).select('id,scout_id,scout_username,category,message,status,created_at,resolved_at').single();
    if(error)throw error;
    const {error:messageError}=await db.from('support_ticket_messages').insert({ticket_id:ticket.id,sender_id:req.scout.id,sender_role:'scout',message});
    if(messageError)throw messageError;
    res.set('Cache-Control','no-store');
    return res.status(201).json(ticket);
  }catch(error){console.error('Scout support ticket creation failed:',error.message);return res.status(500).json({error:'Support-Ticket konnte nicht erstellt werden. Bitte versuche es erneut.'});}
});
// Admin ticket endpoints receive the Supabase access token from the browser.
// Verify it with Supabase Auth (not the app's separate JWT verifier).
async function requireSupabaseAdmin(req,res,next){
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  if(!token)return res.status(401).json({error:'Anmeldung erforderlich.'});
  try{
    // Match the already-working admin API authentication path (/api/scouts).
    // getUser(token) validates the supplied Supabase access token remotely;
    // the service-role client is used only for this verification and privileged DB access.
    const {data:authData,error:authError}=await db.auth.getUser(token);
    if(authError||!authData?.user){console.error('Admin ticket token rejected:',authError?.message||'No user returned');return res.status(401).json({error:'Sitzung abgelaufen. Bitte erneut anmelden.'});}
    const {data:profile,error:profileError}=await db.from('profiles').select('id,role').eq('id',authData.user.id).maybeSingle();
    if(profileError||profile?.role!=='admin')return res.status(403).json({error:'Admin-Rechte erforderlich.'});
    req.user={sub:authData.user.id,role:profile.role};
    next();
  }catch(error){console.error('Admin ticket authentication failed:',error.message);return res.status(401).json({error:'Sitzung konnte nicht geprüft werden. Bitte erneut anmelden.'});}
}
app.get('/api/tickets',requireSupabaseAdmin,async(_req,res)=>{
  const {data,error}=await db.from('support_tickets').select('id,scout_id,scout_username,category,message,status,created_at,resolved_at,resolved_by').order('created_at',{ascending:false});
  if(error)return res.status(500).json({error:'Tickets konnten nicht geladen werden.'});
  res.json(data||[]);
});
app.patch('/api/tickets/:id/resolve',requireSupabaseAdmin,async(req,res)=>{
  const {data,error}=await db.from('support_tickets').update({status:'erledigt',resolved_at:new Date().toISOString(),resolved_by:req.user.sub}).eq('id',req.params.id).eq('status','offen').select('id,scout_id,scout_username,category,message,status,created_at,resolved_at,resolved_by').maybeSingle();
  if(error)return res.status(500).json({error:'Ticket konnte nicht erledigt werden.'});
  if(!data)return res.status(404).json({error:'Offenes Ticket nicht gefunden.'});
  res.json(data);
});


async function listTicketMessages(ticketId){
  return db.from('support_ticket_messages').select('id,ticket_id,sender_id,sender_role,message,created_at').eq('ticket_id',ticketId).order('created_at',{ascending:true});
}
app.get('/api/tickets/:id/messages',requireSupabaseAdmin,async(req,res)=>{
  const {data:ticket,error:ticketError}=await db.from('support_tickets').select('id').eq('id',req.params.id).maybeSingle();
  if(ticketError||!ticket)return res.status(404).json({error:'Ticket nicht gefunden.'});
  const {data,error}=await listTicketMessages(req.params.id);
  if(error)return res.status(500).json({error:'Nachrichten konnten nicht geladen werden.'});
  res.set('Cache-Control','no-store');return res.json(data||[]);
});
app.post('/api/tickets/:id/messages',requireSupabaseAdmin,async(req,res)=>{
  const message=typeof req.body?.message==='string'?req.body.message.trim():'';
  if(!message||message.length>3000)return res.status(400).json({error:'Die Nachricht muss 1 bis 3.000 Zeichen enthalten.'});
  const {data:ticket,error:ticketError}=await db.from('support_tickets').select('id').eq('id',req.params.id).maybeSingle();
  if(ticketError||!ticket)return res.status(404).json({error:'Ticket nicht gefunden.'});
  const {data,error}=await db.from('support_ticket_messages').insert({ticket_id:ticket.id,sender_id:req.user.sub,sender_role:'admin',message}).select('id,ticket_id,sender_id,sender_role,message,created_at').single();
  if(error)return res.status(500).json({error:'Nachricht konnte nicht gespeichert werden.'});
  res.set('Cache-Control','no-store');return res.status(201).json(data);
});
app.get('/api/scout/tickets/:id/messages',requireApprovedScout,async(req,res)=>{
  const {data:ticket,error:ticketError}=await db.from('support_tickets').select('id').eq('id',req.params.id).eq('scout_id',req.scout.id).maybeSingle();
  if(ticketError||!ticket)return res.status(404).json({error:'Ticket nicht gefunden.'});
  const {data,error}=await listTicketMessages(ticket.id);
  if(error)return res.status(500).json({error:'Nachrichten konnten nicht geladen werden.'});
  res.set('Cache-Control','no-store');return res.json(data||[]);
});
app.post('/api/scout/tickets/:id/messages/read',requireApprovedScout,async(req,res)=>{
  const {data:ticket,error:ticketError}=await db.from('support_tickets').select('id').eq('id',req.params.id).eq('scout_id',req.scout.id).maybeSingle();
  if(ticketError||!ticket)return res.status(404).json({error:'Ticket nicht gefunden.'});
  const {error}=await db.from('support_ticket_messages').update({scout_read_at:new Date().toISOString()}).eq('ticket_id',ticket.id).eq('sender_role','admin').is('scout_read_at',null);
  if(error)return res.status(500).json({error:'Nachrichten konnten nicht als gelesen markiert werden.'});
  res.set('Cache-Control','no-store');return res.json({success:true});
});
app.post('/api/scout/tickets/:id/messages',requireApprovedScout,async(req,res)=>{
  const message=typeof req.body?.message==='string'?req.body.message.trim():'';
  if(!message||message.length>3000)return res.status(400).json({error:'Die Nachricht muss 1 bis 3.000 Zeichen enthalten.'});
  const {data:ticket,error:ticketError}=await db.from('support_tickets').select('id').eq('id',req.params.id).eq('scout_id',req.scout.id).maybeSingle();
  if(ticketError||!ticket)return res.status(404).json({error:'Ticket nicht gefunden.'});
  const {data,error}=await db.from('support_ticket_messages').insert({ticket_id:ticket.id,sender_id:req.scout.id,sender_role:'scout',message}).select('id,ticket_id,sender_id,sender_role,message,created_at').single();
  if(error)return res.status(500).json({error:'Nachricht konnte nicht gespeichert werden.'});
  res.set('Cache-Control','no-store');return res.status(201).json(data);
});

app.use(express.static('dist',{maxAge:'1h',setHeaders(res,path){if(path.endsWith('/index.html'))res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');}}));
app.get(/^(?!\/api\/).*/,(_req,res)=>{res.setHeader('Cache-Control','no-store, no-cache, must-revalidate, proxy-revalidate');res.sendFile(process.cwd()+'/dist/index.html');});
app.listen(PORT,async()=>{console.log(`myScoutingDatabase API listening on ${PORT}`);await diagnoseSupabase();try{await bootstrapAdmin();}catch(e){console.error('Admin bootstrap failed:',e.message);}});
