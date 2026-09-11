/* KD Messenger E2EE direct-message transport v1 */
(function(){
  'use strict';
  const SB_URL='https://qqofizfqkctycyeafgsa.supabase.co';
  const SB_KEY='sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK';
  const INFO='KD Messenger E2EE v1';
  let sb=null;
  const te=new TextEncoder(), td=new TextDecoder();
  const b64=u=>btoa(String.fromCharCode(...new Uint8Array(u)));
  const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  async function client(){
    if(sb)return sb;
    if(!window.supabase?.createClient)throw new Error('Supabase unavailable');
    sb=window.supabase.createClient(SB_URL,SB_KEY); return sb;
  }
  async function identity(){
    if(!window.kdE2EE)throw new Error('E2EE foundation unavailable');
    return window.kdE2EE.getIdentity()||await window.kdE2EE.ensure();
  }
  async function session(){
    const c=await client(), s=(await c.auth.getSession()).data.session;
    if(!s?.user)throw new Error('Not authenticated');
    return s;
  }
  async function peerId(conversationId,me){
    const c=await client();
    const r=await c.from('kd_conversation_members').select('user_id').eq('conversation_id',conversationId).neq('user_id',me);
    if(r.error)throw r.error;
    if(r.data?.length!==1)throw new Error('E2EE direct chat requires exactly one peer');
    return r.data[0].user_id;
  }
  async function peerPublic(userId){
    const c=await client();
    const r=await c.from('kd_identity_keys').select('public_key_jwk,key_version').eq('user_id',userId).maybeSingle();
    if(r.error)throw r.error;
    const jwk=r.data?.public_key_jwk?.ecdh;
    if(!jwk)throw new Error('Peer E2EE key is not published');
    return {jwk,version:r.data.key_version||1};
  }
  async function aesFor(identityObj,peerJwk,conversationId){
    const peer=await crypto.subtle.importKey('jwk',peerJwk,{name:'ECDH',namedCurve:'P-256'},false,[]);
    const bits=await crypto.subtle.deriveBits({name:'ECDH',public:peer},identityObj.ecdhPrivate,256);
    const base=await crypto.subtle.importKey('raw',bits,'HKDF',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:te.encode(conversationId),info:te.encode(INFO)},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
  }
  async function encrypt(text,conversationId){
    const s=await session(), i=await identity(), pid=await peerId(conversationId,s.user.id), pk=await peerPublic(pid);
    const key=await aesFor(i,pk.jwk,conversationId);
    const messageId=crypto.randomUUID(), nonce=crypto.getRandomValues(new Uint8Array(12));
    const aad=`kd-e2ee-v1:${conversationId}:${messageId}`;
    const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv:nonce,additionalData:te.encode(aad)},key,te.encode(text));
    return {id:messageId,conversation_id:conversationId,sender_id:s.user.id,body:null,message_type:'text',e2ee_version:1,ciphertext:b64(cipher),cipher_nonce:b64(nonce),cipher_aad:aad,key_version:pk.version};
  }
  async function send(text,conversationId){
    if(!text?.trim())return false;
    const c=await client(), row=await encrypt(text.trim(),conversationId), r=await c.from('kd_messages').insert(row).select('id').single();
    if(r.error)throw r.error;
    return r.data.id;
  }
  window.kdE2EEMessages={send,encrypt};
})();