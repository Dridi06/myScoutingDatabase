import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';

const app=express();
const PORT=Number(process.env.PORT||3000);
const JWT_SECRET=process.env.JWT_SECRET;
const supabaseUrl=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;
const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminUsername=process.env.ADMIN_USERNAME||'Admin';
const adminInitialPassword=process.env.ADMIN_INITIAL_PASSWORD;
if(!JWT_SECRET||JWT_SECRET.length<32) console.warn('WARNING: Set JWT_SECRET to a random value with at least 32 characters.');
if(!supabaseUrl) console.error('CONFIG CHECK: SUPABASE_URL is missing or empty.');
if(!serviceKey) console.error('CONFIG CHECK: SUPABASE_SERVICE_ROLE_KEY is missing or empty.');
if(supabaseUrl&&serviceKey) console.log('CONFIG CHECK: Supabase server credentials are present.');
const db=supabaseUrl&&serviceKey?createClient(supabaseUrl,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}}):null;
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
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
    const {data:profile,error:pErr}=await db.from('profiles').select('*').ilike('username',username.trim()).maybeSingle();
    if(pErr||!profile)return res.status(401).json({error:'Benutzername oder Passwort ist nicht korrekt.'});
    const signIn=await db.auth.signInWithPassword({email:profile.email,password});
    if(signIn.error)return res.status(401).json({error:'Benutzername oder Passwort ist nicht korrekt.'});
    if(!profile.approved)return res.status(403).json({error:'Dein Zugang ist noch nicht vom Administrator freigeschaltet.'});
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
app.get('/api/scouts',requireAuth,requireAdmin,async(_req,res)=>{const {data,error}=await db.from('profiles').select('id,username,email,role,approved,created_at').eq('role','scout').order('created_at',{ascending:false});if(error)return res.status(500).json({error:'Scouts konnten nicht geladen werden.'});res.json(data);});
app.patch('/api/scouts/:id/approval',requireAuth,requireAdmin,async(req,res)=>{const approved=!!req.body?.approved;const {data,error}=await db.from('profiles').update({approved}).eq('id',req.params.id).eq('role','scout').select('id,username,approved').maybeSingle();if(error||!data)return res.status(400).json({error:'Freigabe konnte nicht geändert werden.'});res.json(data);});
app.get('/api/players',requireAuth,async(req,res)=>{let q=db.from('players').select('*').order('player_id',{ascending:true});if(req.user.role!=='admin')q=q.eq('owner_id',req.user.sub);const {data,error}=await q;if(error)return res.status(500).json({error:'Spieler konnten nicht geladen werden.'});res.json(data);});
app.post('/api/players',requireAuth,async(req,res)=>{const body=req.body||{};const payload={...body,owner_id:req.user.sub};delete payload.player_id;const {data,error}=await db.from('players').insert(payload).select('*').single();if(error)return res.status(400).json({error:'Spieler konnte nicht erstellt werden.'});res.status(201).json(data);});
app.patch('/api/players/:id',requireAuth,async(req,res)=>{const payload={...req.body};delete payload.player_id;delete payload.owner_id;let q=db.from('players').update(payload).eq('player_id',Number(req.params.id)).select('*').maybeSingle();if(req.user.role!=='admin')q=q.eq('owner_id',req.user.sub);const {data,error}=await q;if(error||!data)return res.status(404).json({error:'Spieler nicht gefunden oder kein Zugriff.'});res.json(data);});
app.delete('/api/players/:id',requireAuth,async(req,res)=>{let q=db.from('players').delete().eq('player_id',Number(req.params.id));if(req.user.role!=='admin')q=q.eq('owner_id',req.user.sub);const {data,error}=await q.select('player_id').maybeSingle();if(error||!data)return res.status(404).json({error:'Spieler nicht gefunden oder kein Zugriff.'});res.json({ok:true,player_id:data.player_id});});
app.use(express.static('dist',{maxAge:'1h'}));
app.get(/^(?!\/api\/).*/,(_req,res)=>res.sendFile(process.cwd()+'/dist/index.html'));
app.listen(PORT,async()=>{console.log(`myScoutingDatabase API listening on ${PORT}`);try{await bootstrapAdmin();}catch(e){console.error('Admin bootstrap failed:',e.message);}});
