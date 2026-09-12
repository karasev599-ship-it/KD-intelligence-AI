(()=>{
  if(window.__KD_CHAT_CONVERSATION_HEADER__)return;
  window.__KD_CHAT_CONVERSATION_HEADER__=true;
  const CSS='.kd-conv-head{display:none;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(16,16,23,.92);backdrop-filter:blur(14px);position:sticky;top:0;z-index:40;min-height:64px}.kd-conv-head.show{display:flex}.kd-conv-avatar{width:42px;height:42px;border-radius:50%;background:#29243a;display:grid;place-items:center;font-weight:900;font-size:16px;overflow:hidden;background-size:cover;background-position:center;flex:0 0 auto}.kd-conv-main{min-width:0;flex:1}.kd-conv-name{font-weight:900;color:#fff;font-size:15px}.kd-conv-status{font-size:11px;color:#8e899a;margin-top:3px}.kd-conv-head button{border:0;background:transparent;color:inherit;padding:0;cursor:pointer;text-align:left}';
  const roots=()=>[...document.querySelectorAll('[data-kd-messenger],.kd-messenger,.messenger-shell')];
  const mount=()=>{
    if(document.getElementById('kd-conv-head'))return;
    if(!document.getElementById('kd-conv-head-css')){const st=document.createElement('style');st.id='kd-conv-head-css';st.textContent=CSS;document.head.appendChild(st)}
    const head=document.createElement('div');head.id='kd-conv-head';head.className='kd-conv-head';head.innerHTML='<div class="kd-conv-avatar">K</div><button class="kd-conv-main" type="button"><div class="kd-conv-name">Диалог</div><div class="kd-conv-status">профиль собеседника</div></button>';
    const root=roots()[0]||document.body;const anchor=document.querySelector('#messageInput');if(anchor?.parentElement)anchor.parentElement.insertBefore(head,anchor.parentElement.firstChild);else root.prepend(head);
    window.KDConversationHeader={element:head,show:()=>head.classList.add('show'),hide:()=>head.classList.remove('show')};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,3600),{once:true});else setTimeout(mount,3600);
})();