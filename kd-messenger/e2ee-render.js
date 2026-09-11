/* KD Messenger E2EE message renderer v1 */
(function(){
  'use strict';
  const SB_URL='https://qqofizfqkctycyeafgsa.supabase.co';
  const SB_KEY='sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK';
  const INFO='KD Messenger E2EE v1';
  const te=new TextEncoder(), td=new TextDecoder(); let sb=null, cache=new Map();
  const ub=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  async function client(){if(sb)return sb;sb=window.supabase.createClient(SB_URL,SB_KEY);return sb;}
  async function identity(){return window.kdE2EE.getIdentity()||await window.kdE2EE.ensure();}
  async function keyFor(row){
    const s=(await (await client()).auth.getSession()).data.session;if(!s?.user)throw new Error('Not authenticated');
    const peer=row.sender_id===s.user.id?s.user.id:row.sender_id;
    const r=await (await client()).from('kd_identity_keys').select('public_key_jwk').eq('user_id',peer).maybeSingle();
    if(r.error)throw r.error; const jwk=r.data?.public_key_jwk?.ecdh;if(!jwk)throw new Error('Sender E2EE key unavailable');
    const i=await identity(), pub=await crypto.subtle.importKey('jwk',jwk,{name:'ECDH',namedCurve:'P-256'},false,[]);
    const bits=await crypto.subtle.deriveBits({name:'ECDH',public:pub},i.ecdhPrivate,256);
    const base=await crypto.subtle.importKey('raw',bits,'HKDF',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:te.encode(row.conversation_id),info:te.encode(INFO)},base,{name:'AES-GCM',length:256},false,['decrypt']);
  }
  async function decrypt(row){
    const k=row.id;if(cache.has(k))return cache.get(k);
    const key=await keyFor(row), plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(row.cipher_nonce),additionalData:te.encode(row.cipher_aad)},key,ub(row.ciphertext));
    const text=td.decode(plain);cache.set(k,text);return text;
  }
  async function hydrate(el){
    const id=el.dataset.messageId;if(!id||el.dataset.e2eeDone==='1')return;
    const c=await client(),r=await c.from('kd_messages').select('id,conversation_id,sender_id,e2ee_version,ciphertext,cipher_nonce,cipher_aad').eq('id',id).maybeSingle();
    if(r.error||!r.data?.e2ee_version)return;
    try{const text=await decrypt(r.data);el.textContent=text;el.dataset.e2eeDone='1';}catch(e){el.textContent='🔒 Не удалось расшифровать';el.dataset.e2eeDone='1';console.warn('[KD E2EE decrypt]',e);}
  }
  function scan(){document.querySelectorAll('#messages [data-message-id]').forEach(hydrate);}
  window.kdE2EEDecrypt={decrypt,scan};
  window.addEventListener('load',()=>{const m=document.getElementById('messages');if(!m)return;new MutationObserver(scan).observe(m,{childList:true,subtree:true});setTimeout(scan,500);});
})();