(()=>{
'use strict';
const U='https://qqofizfqkctycyeafgsa.supabase.co',K='sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK';
const sb=window.supabase?.createClient(U,K); if(!sb)return;
let lastPrompt='',busy=false;
const toast=t=>{const x=document.querySelector('#toast');if(x){x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1800)}};
function currentText(){return [...document.querySelectorAll('.msg')].slice(-20).map(x=>x.innerText.trim()).filter(Boolean).join('\n').slice(-7000)}
async function suggest(){
 const cid=window.kdActiveConversation, text=currentText(); if(!cid||!text||busy||text===lastPrompt)return; lastPrompt=text; busy=true;
 try{
  const r=await fetch(U+'/functions/v1/kd-ai-agent',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(await sb.auth.getSession()).data.session?.access_token},body:JSON.stringify({mode:'memory_suggest',conversation_id:cid,context:text})});
  if(!r.ok)return; const j=await r.json(); const fact=String(j.memory||'').trim(); if(!fact)return;
  show(fact,cid);
 }catch(e){}finally{busy=false}
}
function show(fact,cid){
 if(document.querySelector('#kdMemorySuggest'))return;
 const d=document.createElement('div');d.id='kdMemorySuggest';d.innerHTML=`<div class="kms-icon">🧠</div><div class="kms-copy"><b>Запомнить это?</b><span>${esc(fact)}</span></div><button id="kmsYes">Сохранить</button><button id="kmsNo">×</button>`;
 document.body.appendChild(d);d.querySelector('#kmsYes').onclick=async()=>{const u=(await sb.auth.getUser()).data.user;if(!u)return;const {error}=await sb.from('kd_chat_memory').insert({conversation_id:cid,user_id:u.id,memory_text:fact});if(error)toast('Не удалось сохранить');else toast('Сохранено в 🧠 KD Memory');d.remove()};d.querySelector('#kmsNo').onclick=()=>d.remove();
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
const st=document.createElement('style');st.textContent=`#kdMemorySuggest{position:fixed;right:22px;bottom:88px;z-index:120;display:flex;align-items:center;gap:9px;width:min(430px,calc(100vw - 28px));padding:12px;border:1px solid rgba(130,105,255,.28);background:rgba(17,16,25,.96);backdrop-filter:blur(16px);border-radius:16px;box-shadow:0 18px 55px rgba(0,0,0,.45)}.kms-icon{font-size:20px}.kms-copy{flex:1;min-width:0}.kms-copy b{display:block;font-size:11px}.kms-copy span{display:block;color:#999;font-size:10px;line-height:1.35;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kdMemorySuggest button{border:0;cursor:pointer}.kdMemorySuggest #kmsYes{background:#6652c5;color:#fff;border-radius:9px;padding:8px 10px;font-size:10px}.kdMemorySuggest #kmsNo{background:transparent;color:#777;font-size:18px}`;document.head.appendChild(st);
setInterval(suggest,7000);window.kdSuggestMemory=suggest;
})();