import crypto from 'node:crypto';
import { sbJson } from './_supabase.js';

const COOKIE = 'kd_session';
const SESSION_DAYS = 30;
const FREE_TRIAL_DAYS = 21;
const secret = () => process.env.AUTH_SECRET || '';

function json(res, status, body) { res.statusCode = status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(body)); }
function hashPassword(password) { const salt=crypto.randomBytes(16).toString('hex'); const hash=crypto.scryptSync(password,salt,64).toString('hex'); return `${salt}:${hash}`; }
function verifyPassword(password,stored) { const [salt,hex]=String(stored||'').split(':'); if(!salt||!hex)return false; const got=crypto.scryptSync(password,salt,64), expected=Buffer.from(hex,'hex'); return expected.length===got.length&&crypto.timingSafeEqual(got,expected); }
function sign(value) { return crypto.createHmac('sha256',secret()).update(value).digest('base64url'); }
function makeSession(userId) { const exp=Math.floor(Date.now()/1000)+SESSION_DAYS*86400; const payload=`${userId}.${exp}`; return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`; }
function parseCookies(req) { const out={}; String(req.headers.cookie||'').split(';').forEach(part=>{const i=part.indexOf('=');if(i<0)return;out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());});return out; }

function trialMeta(user) {
  const created = new Date(user?.created_at || Date.now());
  const freeUntil = user?.free_until ? new Date(user.free_until) : new Date(created.getTime() + FREE_TRIAL_DAYS * 86400000);
  const now = new Date();
  const isPro = user?.plan === 'pro' && (!user?.pro_until || new Date(user.pro_until) > now);
  const trialActive = !isPro && freeUntil > now;
  const daysLeft = trialActive ? Math.max(0, Math.ceil((freeUntil - now) / 86400000)) : 0;
  return { effective_plan: isPro ? 'pro' : (trialActive ? 'free_trial' : 'free_expired'), free_until: freeUntil.toISOString(), trial_active: trialActive, trial_days_left: daysLeft, pro_active: isPro };
}
function decorateUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return { ...safeUser, ...trialMeta(safeUser) };
}

async function currentUser(req) {
  if(!secret())return null;
  const token=parseCookies(req)[COOKIE];if(!token)return null;
  const [enc,sig]=token.split('.');if(!enc||!sig)return null;
  let payload;try{payload=Buffer.from(enc,'base64url').toString('utf8')}catch{return null}
  if(sign(payload)!==sig)return null;
  const [id,exp]=payload.split('.');if(!id||Number(exp)<Math.floor(Date.now()/1000))return null;
  const rows=await sbJson(`users?id=eq.${encodeURIComponent(id)}&select=id,email,name,username,plan,pro_until,free_until,created_at,last_seen_at,blocked,is_admin&limit=1`);
  const user=Array.isArray(rows)?rows[0]:null;
  if(!user||user.blocked)return null;
  return decorateUser(user);
}

function setSession(res,token){res.setHeader('Set-Cookie',`${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${SESSION_DAYS*86400}; HttpOnly; Secure; SameSite=Lax`)}
function clearSession(res){res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`)}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)}
export { currentUser, trialMeta };

export default async function handler(req,res){
 const action=String(req.query?.action||'me'); if(!secret())return json(res,500,{error:'AUTH_SECRET is not configured.'});
 try{
  if(req.method==='GET'&&action==='me'){const user=await currentUser(req);return json(res,200,{authenticated:!!user,user});}
  if(req.method==='POST'&&action==='signup'){
   const body=typeof req.body==='string'?JSON.parse(req.body):(req.body||{});const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||''),name=String(body.name||'').trim().slice(0,80),username=String(body.username||'').trim().slice(0,40);
   if(!validEmail(email))return json(res,400,{error:'Введите корректный email.'});if(password.length<8)return json(res,400,{error:'Пароль должен быть не короче 8 символов.'});
   const exists=await sbJson(`users?email=eq.${encodeURIComponent(email)}&select=id&limit=1`);if(Array.isArray(exists)&&exists.length)return json(res,409,{error:'Пользователь с таким email уже существует.'});
   const createdAt=new Date(); const freeUntil=new Date(createdAt.getTime()+FREE_TRIAL_DAYS*86400000);
   const rows=await sbJson('users',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({email,password_hash:hashPassword(password),name,username:username||email.split('@')[0],plan:'free',free_until:freeUntil.toISOString()})});
   const user=rows?.[0];if(!user)throw new Error('User creation failed.');
   setSession(res,makeSession(user.id));return json(res,201,{authenticated:true,user:decorateUser(user)});
  }
  if(req.method==='POST'&&action==='login'){
   const body=typeof req.body==='string'?JSON.parse(req.body):(req.body||{});const email=String(body.email||'').trim().toLowerCase(),password=String(body.password||'');const rows=await sbJson(`users?email=eq.${encodeURIComponent(email)}&select=id,email,password_hash,name,username,plan,pro_until,free_until,created_at,last_seen_at,blocked,is_admin&limit=1`);const user=rows?.[0];if(!user||user.blocked||!verifyPassword(password,user.password_hash))return json(res,401,{error:'Неверный email или пароль.'});await sbJson(`users?id=eq.${encodeURIComponent(user.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({last_seen_at:new Date().toISOString()})});setSession(res,makeSession(user.id));return json(res,200,{authenticated:true,user:decorateUser(user)});
  }
  if(req.method==='POST'&&action==='logout'){clearSession(res);return json(res,200,{authenticated:false});}
  if(req.method==='PATCH'&&action==='profile'){const user=await currentUser(req);if(!user)return json(res,401,{error:'Войдите в аккаунт.'});const body=typeof req.body==='string'?JSON.parse(req.body):(req.body||{}),patch={};if(body.name!==undefined)patch.name=String(body.name).trim().slice(0,80);if(body.username!==undefined)patch.username=String(body.username).trim().slice(0,40);if(Object.keys(patch).length)await sbJson(`users?id=eq.${encodeURIComponent(user.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});return json(res,200,{authenticated:true,user:await currentUser(req)});}
  return json(res,405,{error:'Method not allowed.'});
 }catch(e){console.error('Auth API:',e);return json(res,500,{error:e.message||'Auth service failed.'});}
}
