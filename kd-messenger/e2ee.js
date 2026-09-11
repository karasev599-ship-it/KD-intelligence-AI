/* KD Messenger E2EE foundation v1
 * Device-local P-256 ECDH + ECDSA identity keys.
 * This module does NOT encrypt messages yet.
 */
(function(){
  'use strict';
  const SB_URL='https://qqofizfqkctycyeafgsa.supabase.co';
  const SB_KEY='sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK';
  const DB_NAME='kd-e2ee-v1';
  const STORE='identity';
  const RECORD='current';
  const VERSION=1;

  let client=null;
  let identity=null;

  function openDb(){
    return new Promise((resolve,reject)=>{
      const r=indexedDB.open(DB_NAME,1);
      r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});
      r.onsuccess=()=>resolve(r.result);
      r.onerror=()=>reject(r.error||new Error('IndexedDB unavailable'));
    });
  }
  async function loadLocal(){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const r=db.transaction(STORE,'readonly').objectStore(STORE).get(RECORD);
      r.onsuccess=()=>resolve(r.result||null);
      r.onerror=()=>reject(r.error);
    });
  }
  async function saveLocal(value){
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put(value);
      tx.oncomplete=()=>resolve();
      tx.onerror=()=>reject(tx.error);
    });
  }
  async function generate(){
    const ecdh=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
    const ecdsa=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
    const ecdhPublic=await crypto.subtle.exportKey('jwk',ecdh.publicKey);
    const ecdsaPublic=await crypto.subtle.exportKey('jwk',ecdsa.publicKey);
    return {id:RECORD,version:VERSION,createdAt:new Date().toISOString(),ecdhPrivate:ecdh.privateKey,ecdhPublic,ecdsaPrivate:ecdsa.privateKey,ecdsaPublic};
  }
  async function getClient(){
    if(client)return client;
    if(!window.supabase?.createClient)throw new Error('Supabase client unavailable');
    client=window.supabase.createClient(SB_URL,SB_KEY);
    return client;
  }
  async function publishPublicBundle(){
    if(!identity)return;
    const sb=await getClient();
    const session=(await sb.auth.getSession()).data.session;
    if(!session?.user)return false;
    const payload={
      user_id:session.user.id,
      public_key_jwk:{ecdh:identity.ecdhPublic,ecdsa:identity.ecdsaPublic},
      key_version:VERSION,
      updated_at:new Date().toISOString()
    };
    const r=await sb.from('kd_identity_keys').upsert(payload,{onConflict:'user_id'});
    if(r.error)throw r.error;
    return true;
  }
  async function ensure(){
    const existing=await loadLocal();
    identity=existing||await generate();
    if(!existing)await saveLocal(identity);
    try{await publishPublicBundle();}catch(e){console.warn('[KD E2EE] public key publish failed',e);}
    return identity;
  }
  async function status(){
    try{
      const i=await ensure();
      return {ready:true,version:i.version,algorithm:'P-256 ECDH + ECDSA',messageEncryption:false};
    }catch(e){return {ready:false,error:e?.message||String(e),messageEncryption:false};}
  }
  window.kdE2EE={ensure,status,getIdentity:()=>identity};
  window.addEventListener('load',()=>{setTimeout(()=>ensure().catch(e=>console.warn('[KD E2EE]',e)),0);});
})();
