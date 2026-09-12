(()=>{
  if(window.__KD_CHAT_PROFILE_ENHANCEMENTS__)return;
  window.__KD_CHAT_PROFILE_ENHANCEMENTS__=true;
  const CSS=`
  #kd-chat-social .kds-profile-open{display:inline-flex;align-items:center;gap:6px}
  #kd-chat-social .kds-profile-open:active{transform:scale(.98)}
  .kd-chat-profile-card{position:fixed;inset:0;z-index:6100;display:none;place-items:center;background:#000b;backdrop-filter:blur(12px);padding:16px}
  .kd-chat-profile-card.open{display:grid}
  .kd-chat-profile-box{width:min(430px,100%);background:#101017;color:#fff;border:1px solid #2b2938;border-radius:22px;overflow:hidden;box-shadow:0 25px 80px #0008}
  .kd-chat-profile-cover{height:92px;background:linear-gradient(135deg,#241d3b,#15151d)}
  .kd-chat-profile-body{padding:0 20px 20px;text-align:center}
  .kd-chat-profile-avatar{width:92px;height:92px;margin:-46px auto 10px;border-radius:50%;background:#29243a;border:4px solid #101017;background-size:cover;background-position:center;display:grid;place-items:center;font-size:30px;font-weight:900}
  .kd-chat-profile-name{font-size:21px;font-weight:900}.kd-chat-profile-username{color:#8d879e;margin-top:3px}
  .kd-chat-profile-status{margin:14px 0 6px;color:#b5f2df;font-size:12px}.kd-chat-profile-bio{color:#aaa;line-height:1.45;font-size:13px;white-space:pre-wrap}
  .kd-chat-profile-close{margin-top:18px;width:100%;border:1px solid #343044;background:#191722;color:#ddd;border-radius:12px;padding:10px;font-weight:800;cursor:pointer}
  `;
  const initial=v=>(String(v||'K').trim()[0]||'K').toUpperCase();
  const mount=sb=>{
    if(!sb||document.getElementById('kd-chat-profile-card'))return;
    const s=document.createElement('style');s.textContent=CSS;document.head.appendChild(s);
    const card=document.createElement('div');card.id='kd-chat-profile-card';card.className='kd-chat-profile-card';card.innerHTML='<section class="kd-chat-profile-box"><div class="kd-chat-profile-cover"></div><div class="kd-chat-profile-body"><div class="kd-chat-profile-avatar" id="kcpAvatar">K</div><div class="kd-chat-profile-name" id="kcpName">KD User</div><div class="kd-chat-profile-username" id="kcpUsername"></div><div class="kd-chat-profile-status" id="kcpStatus"></div><div class="kd-chat-profile-bio" id="kcpBio"></div><button class="kd-chat-profile-close" id="kcpClose">Закрыть</button></div></section>';
    document.body.appendChild(card);
    const q=id=>card.querySelector('#'+id);
    const open=async()=>{
      const session=(await sb.auth.getSession()).data.session;
      if(!session){q('kcpStatus').textContent='Войдите в аккаунт';card.classList.add('open');return}
      const r=await sb.from('kd_profiles').select('display_name,username,status,bio,avatar_url,is_online,last_seen').eq('id',session.user.id).maybeSingle();
      if(r.error){q('kcpStatus').textContent='Профиль временно недоступен';card.classList.add('open');return}
      const p=r.data||{};q('kcpName').textContent=p.display_name||'KD User';q('kcpUsername').textContent=p.username?'@'+p.username:'';q('kcpStatus').textContent=p.is_online?'● В сети':(p.status||'');q('kcpBio').textContent=p.bio||'';
      const av=q('kcpAvatar');av.textContent=initial(p.display_name);av.style.backgroundImage='';
      if(p.avatar_url){const u=await sb.storage.from('kd-profile-media').createSignedUrl(p.avatar_url,900);if(!u.error&&u.data?.signedUrl){av.textContent='';av.style.backgroundImage=`url("${u.data.signedUrl}")`}}
      card.classList.add('open');
    };
    q('kcpClose').onclick=()=>card.classList.remove('open');card.onclick=e=>{if(e.target===card)card.classList.remove('open')};document.addEventListener('keydown',e=>{if(e.key==='Escape')card.classList.remove('open')});
    const bind=()=>{const b=document.querySelector('#kdsProfile');if(!b||b.dataset.kcpBound)return false;b.dataset.kcpBound='1';b.classList.add('kds-profile-open');b.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();open()};return true};
    if(!bind())new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
    window.KDChatProfileEnhancements={open};
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>mount(window.__KD_SUPABASE_CLIENT__),3000),{once:true});else setTimeout(()=>mount(window.__KD_SUPABASE_CLIENT__),3000);
})();
