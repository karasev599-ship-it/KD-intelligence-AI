/* KD Messenger E2EE bridge: fails closed for new composer messages and decrypts ciphertext for rendering. */
(function(){
  'use strict';
  const SB_URL='https://qqofizfqkctycyeafgsa.supabase.co';
  const SB_KEY='sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK';
  let sb=null,wrapped=false;
  function getSb(){if(sb)return sb;if(!window.supabase?.createClient)return null;sb=window.supabase.createClient(SB_URL,SB_KEY);return sb;}
  function toast(msg){const t=document.querySelector('#toast');if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
  async function user(){const s=(await getSb().auth.getSession()).data.session;return s?.user||null;}
  async function secureSend(){
    const client=getSb(),u=await user(),input=document.querySelector('#messageInput'),cid=window.kdActiveConversation;
    if(!client||!u||!input||!cid)return;
    const text=input.value.trim();if(!text)return;
    try{
      const enc=await window.kdE2EE.encryptText(cid,text);
      const r=await client.from('kd_messages').insert({conversation_id:cid,sender_id:u.id,body:null,message_type:'text',...enc}).select().single();
      if(r.error)throw r.error;
      input.value='';
      if(window.kdOpenConversationById)await window.kdOpenConversationById(cid);
      setTimeout(decryptVisible,50);
    }catch(e){console.error('[KD E2EE send]',e);toast('🔒 Сообщение не отправлено: E2EE не готово');}
  }
  async function decryptVisible(){
    if(!window.kdE2EE?.decryptText||!window.kdActiveConversation)return;
    const ids=[...document.querySelectorAll('#messages [data-message-id]')].map(x=>x.dataset.messageId).filter(Boolean);if(!ids.length)return;
    const client=getSb();if(!client)return;
    const r=await client.from('kd_messages').select('id,conversation_id,body,ciphertext,cipher_nonce,cipher_aad,e2ee_version').in('id',ids);if(r.error)return;
    const by=new Map((r.data||[]).map(x=>[x.id,x]));
    for(const el of document.querySelectorAll('#messages [data-message-id]')){const row=by.get(el.dataset.messageId);if(!row)continue;const bubble=el.querySelector('.bubble');if(!bubble)continue;if(row.e2ee_version&&row.ciphertext){const plain=await window.kdE2EE.decryptText(row.conversation_id,row);const reply=bubble.querySelector('.msg-reply');bubble.textContent='';if(reply)bubble.appendChild(reply);bubble.appendChild(document.createTextNode(plain));}}
  }
  function install(){
    document.addEventListener('submit',e=>{if(e.target?.id!=='composer')return;e.preventDefault();e.stopImmediatePropagation();secureSend();},true);
    const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(decryptVisible,30);});
    const box=document.querySelector('#messages');if(box)observer.observe(box,{childList:true,subtree:true});
    const timer=setInterval(()=>{if(typeof window.kdRealtimeSend==='function'&&!wrapped){wrapped=true;window.kdRealtimeSend=secureSend;}if(window.kdE2EE)window.kdE2EE.status().catch(()=>{});},500);
    window.addEventListener('beforeunload',()=>clearInterval(timer));
  }
  window.kdE2EESecureSend=secureSend;
  window.addEventListener('load',()=>setTimeout(install,0));
})();
