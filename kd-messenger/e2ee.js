/* KD Messenger E2EE v1: P-256 ECDH key wrapping + AES-256-GCM message encryption. */
(function(){
  'use strict';
  const SB_URL='https://qqofizfqkctycyeafgsa.supabase.co';
  const SB_KEY='sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK';
  const DB_NAME='kd-e2ee-v1';
  const STORE='identity';
  const KEY_STORE='conversationKeys';
  const RECORD='current';
  const VERSION=1;
  let client=null, identity=null;

  const b64=u8=>btoa(String.fromCharCode(...new Uint8Array(u8)));
  const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const textBytes=s=>new TextEncoder().encode(s);
  const bytesText=b=>new TextDecoder().decode(b);

  function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,2);r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'id'});if(!db.objectStoreNames.contains(KEY_STORE))db.createObjectStore(KEY_STORE,{keyPath:'conversation_id'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error||new Error('IndexedDB unavailable'));});}
  async function dbGet(store,key){const db=await openDb();return new Promise((resolve,reject)=>{const r=db.transaction(store,'readonly').objectStore(store).get(key);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
  async function dbPut(store,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(value);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}

  async function loadLocal(){return dbGet(STORE,RECORD);}
  async function generate(){
    const ecdh=await crypto.subtle.generateKey({name:'ECDH',namedCurve:'P-256'},false,['deriveBits']);
    const ecdsa=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},false,['sign','verify']);
    return {id:RECORD,version:VERSION,createdAt:new Date().toISOString(),ecdhPrivate:ecdh.privateKey,ecdhPublic:await crypto.subtle.exportKey('jwk',ecdh.publicKey),ecdsaPrivate:ecdsa.privateKey,ecdsaPublic:await crypto.subtle.exportKey('jwk',ecdsa.publicKey)};
  }
  async function getClient(){if(client)return client;if(!window.supabase?.createClient)throw new Error('Supabase client unavailable');client=window.supabase.createClient(SB_URL,SB_KEY);return client;}
  async function publishPublicBundle(){const sb=await getClient(),session=(await sb.auth.getSession()).data.session;if(!session?.user)return false;const r=await sb.from('kd_identity_keys').upsert({user_id:session.user.id,public_key_jwk:{ecdh:identity.ecdhPublic,ecdsa:identity.ecdsaPublic},key_version:VERSION,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(r.error)throw r.error;return true;}
  async function ensure(){identity=await loadLocal();if(!identity){identity=await generate();await dbPut(STORE,identity);}await publishPublicBundle();return identity;}

  async function importEcdhPublic(jwk){return crypto.subtle.importKey('jwk',jwk,{name:'ECDH',namedCurve:'P-256'},false,[]);}
  async function deriveWrapKey(privateKey,publicJwk){const pub=await importEcdhPublic(publicJwk);const bits=await crypto.subtle.deriveBits({name:'ECDH',public:pub},privateKey,256);return crypto.subtle.importKey('raw',bits,{name:'AES-GCM'},false,['encrypt','decrypt']);}
  async function wrapConversationKey(key,recipientPublic){const raw=await crypto.subtle.exportKey('raw',key),wrapKey=await deriveWrapKey(identity.ecdhPrivate,recipientPublic),nonce=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:textBytes('KD-E2EE-WRAP-v1')},wrapKey,raw);return {wrapped_key:b64(ct),wrap_nonce:b64(nonce)};}
  async function unwrapConversationKey(row){const wrapKey=await deriveWrapKey(identity.ecdhPrivate,row.sender_public_key_jwk.ecdh);const raw=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(row.wrap_nonce),additionalData:textBytes('KD-E2EE-WRAP-v1')},wrapKey,unb64(row.wrapped_key));return crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['encrypt','decrypt']);}

  async function conversationKey(cid){
    await ensure();
    const cached=await dbGet(KEY_STORE,cid);if(cached?.key)return cached.key;
    const sb=await getClient(),session=(await sb.auth.getSession()).data.session;if(!session?.user)throw new Error('Not authenticated');
    const me=session.user.id;
    const conv=(await sb.from('kd_conversations').select('id,kind,created_by').eq('id',cid).maybeSingle()).data;
    if(!conv)throw new Error('Conversation not found');
    if(conv.kind!=='direct')throw new Error('Групповое E2EE ещё не активировано');
    const rows=(await sb.from('kd_conversation_keys').select('*').eq('conversation_id',cid)).data||[];
    const own=rows.find(x=>x.user_id===me);
    if(own){
      const key=await unwrapConversationKey(own);
      await dbPut(KEY_STORE,{conversation_id:cid,key,version:own.key_version||1});
      return key;
    }
    const members=(await sb.from('kd_conversation_members').select('user_id').eq('conversation_id',cid)).data||[];
    if(!members.some(x=>x.user_id===me))throw new Error('Not a conversation member');
    const memberIds=[...new Set(members.map(x=>x.user_id))];
    // Exactly one side is allowed to establish the initial conversation key.
    // This prevents two simultaneous clients from generating different AES keys.
    const initiator=conv.created_by||[...memberIds].sort()[0];
    if(me!==initiator)throw new Error('E2EE key is being established by the conversation initiator');
    const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
    const pubRows=(await sb.from('kd_identity_keys').select('user_id,public_key_jwk,key_version').in('user_id',memberIds)).data||[];
    const pubBy=new Map(pubRows.map(x=>[x.user_id,x]));
    for(const uid of memberIds){
      const p=pubBy.get(uid);
      if(!p?.public_key_jwk?.ecdh)throw new Error('Участник ещё не зарегистрировал ключ E2EE');
      const wrapped=await wrapConversationKey(key,p.public_key_jwk);
      const row={conversation_id:cid,user_id:uid,sender_user_id:me,sender_public_key_jwk:{ecdh:identity.ecdhPublic,ecdsa:identity.ecdsaPublic},key_version:VERSION,...wrapped};
      const ins=await sb.from('kd_conversation_keys').insert(row);
      if(ins.error && !String(ins.error.message||'').toLowerCase().includes('duplicate'))throw ins.error;
    }
    // Never cache a locally-created key if another client won the race.
    const finalRows=(await sb.from('kd_conversation_keys').select('*').eq('conversation_id',cid)).data||[];
    const finalOwn=finalRows.find(x=>x.user_id===me);
    if(!finalOwn)throw new Error('E2EE key establishment incomplete');
    const finalKey=await unwrapConversationKey(finalOwn);
    await dbPut(KEY_STORE,{conversation_id:cid,key:finalKey,version:finalOwn.key_version||1});
    return finalKey;
  }

  async function encryptText(cid,text){const key=await conversationKey(cid),nonce=crypto.getRandomValues(new Uint8Array(12)),aad=textBytes('KD-E2EE-v1:'+cid),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:aad},key,textBytes(text));return {e2ee_version:VERSION,ciphertext:b64(ct),cipher_nonce:b64(nonce),cipher_aad:b64(aad)};}
  async function decryptText(cid,row){if(!row?.ciphertext)return row?.body??'';try{const key=await conversationKey(cid),aad=unb64(row.cipher_aad),pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(row.cipher_nonce),additionalData:aad},key,unb64(row.ciphertext));return bytesText(pt);}catch(e){return '🔒 Не удалось расшифровать сообщение';}}
  async function status(){try{await ensure();return{ready:true,version:VERSION,algorithm:'P-256 ECDH + AES-256-GCM',messageEncryption:true};}catch(e){return{ready:false,error:e?.message||String(e),messageEncryption:false};}}
  window.kdE2EE={ensure,status,getIdentity:()=>identity,conversationKey,encryptText,decryptText};
  window.addEventListener('load',()=>setTimeout(()=>ensure().catch(e=>console.warn('[KD E2EE]',e)),0));
})();
