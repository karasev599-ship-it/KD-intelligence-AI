(()=>{
  if(window.__KD_CHAT_PARTICIPANT_PROFILE__)return;
  window.__KD_CHAT_PARTICIPANT_PROFILE__=true;
  const BUCKET='kd-profile-media';
  const CSS=`
  .kd-participant-card{position:fixed;inset:0;z-index:6200;display:none;place-items:center;background:#000b;backdrop-filter:blur(14px);padding:16px}
  .kd-participant-card.open{display:grid}
  .kd-participant-box{width:min(440px,100%);background:#101017;color:#fff;border:1px solid #2b2938;border-radius:24px;overflow:hidden;box-shadow:0 28px 90px #0009}
  .kd-participant-cover{height:108px;background:linear-gradient(135deg,#281f48,#15151d)}
  .kd-participant-body{padding:0 22px 22px;text-align:center}
  .kd-participant-avatar{width:104px;height:104px;margin:-52px auto 10px;border-radius:50%;background:#29243a;border:4px solid #101017;background-size:cover;background-position:center;display:grid;place-items:center;font-size:34px;font-weight:900;overflow:hidden}
  .kd-participant-name{font-size:22px;font-weight:900}.kd-participant-username{color:#8d879e;margin-top:4px}
  .kd-participant-online{margin:13px 0 5px;color:#b5f2df;font-size:12px;font-weight:800}.kd-participant-bio{color:#aaa;line-height:1.5;font-size:13px;white-space:pre-wrap;min-height:18px}
  .kd-participant-meta{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:14px}.kd-participant-chip{padding:7px 10px;border-radius:999px;background:#191722;border:1px solid #343044;color:#bbb;font-size:11px}
  .kd-participant-close{margin-top:18px;width:100%;border:1px solid #343044;background:#191722;color:#ddd;border-radius:13px;padding:11px;font-weight:800;cursor:pointer}
  .kd-participant-loading{color:#9b96a8;font-size:13px;padding:12px 0}
  .kd-participant-error{color:#ff9f9f;font-size:13px;padding:12px 0}
  .kd-participant-trigger{cursor:pointer}
  `;
  const candidates=['sender_id','author_id','user_id','from_id','recipient_id','receiver_id','to_id','other_user_id','participant_id'];
  const mediaKeys=['media_url','file_url','attachment_url','image_url','video_url','audio_url','voice_url'];
  const initial=v=>(String(v||'K').trim()[0]||'K').toUpperCase();
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mount=sb=>{
    if(!sb||document.getElementById('kd-participant-card'))return;
    const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
    const card=document.createElement('div');card.id='kd-participant-card';card.className='kd-participant-card';card.innerHTML=`<section class="kd-participant-box"><div class="kd-participant-cover"></div><div class="kd-participant-body"><div class="kd-participant-avatar" id="kppAvatar">K</div><div class="kd-participant-name" id="kppName">Профиль</div><div class="kd-participant-username" id="kppUsername"></div><div class="kd-participant-online" id="kppOnline"></div><div class="kd-participant-bio" id="kppBio"></div><div class="kd-participant-meta" id="kppMeta"></div><button class="kd-participant-close" id="kppClose">Закрыть</button></div></section>`;
    document.body.appendChild(card);
    const q=id=>card.querySelector('#'+id);
    const close=()=>card.classList.remove('open');
    q('kppClose').onclick=close;card.onclick=e=>{if(e.target===card)close()};document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
    const reset=()=>{q('kppAvatar').textContent='K';q('kppAvatar').style.backgroundImage='';q('kppName').textContent='Профиль';q('kppUsername').textContent='';q('kppOnline').textContent='';q('kppBio').textContent='';q('kppMeta').innerHTML='<span class="kd-participant-loading">Загрузка…</span>'};
    const findParticipant=async(el,session)=>{
      const direct=el.dataset.userId||el.dataset.senderId||el.dataset.authorId||el.dataset.recipientId;
      if(direct&&direct!==session.user.id)return direct;
      const mid=el.dataset.messageId;
      if(!mid)return null;
      const r=await sb.from('kd_messages').select('*').eq('id',mid).maybeSingle();
      if(r.error||!r.data)return null;
      const row=r.data;
      for(const key of candidates){const value=row[key];if(value&&String(value)!==String(session.user.id))return value}
      for(const key of Object.keys(row)){if(!/id$/i.test(key))continue;const value=row[key];if(typeof value==='string'&&value.length>10&&value!==session.user.id&&/user|sender|author|recipient|receiver|from|to|member|participant/i.test(key))return value}
      return null;
    };
    const loadProfile=async userId=>{
      reset();card.classList.add('open');
      const r=await sb.from('kd_profiles').select('display_name,username,status,bio,avatar_url,is_online,last_seen').eq('id',userId).maybeSingle();
      if(r.error||!r.data){q('kppMeta').innerHTML='<span class="kd-participant-error">Профиль временно недоступен</span>';return}
      const p=r.data;q('kppName').textContent=p.display_name||'KD User';q('kppUsername').textContent=p.username?'@'+p.username:'';q('kppOnline').textContent=p.is_online?'● В сети':(p.status||'Был(а) недавно');q('kppBio').textContent=p.bio||'';
      const av=q('kppAvatar');av.textContent=initial(p.display_name);
      if(p.avatar_url){try{const u=await sb.storage.from(BUCKET).createSignedUrl(p.avatar_url,900);if(!u.error&&u.data?.signedUrl){av.textContent='';av.style.backgroundImage=`url("${u.data.signedUrl}")`}}catch{}}
      const meta=[];if(p.username)meta.push('username');if(p.is_online)meta.push('онлайн');q('kppMeta').innerHTML=meta.map(x=>`<span class="kd-participant-chip">${esc(x)}</span>`).join('');
    };
    const open=async el=>{
      const session=(await sb.auth.getSession()).data.session;if(!session)return;
      const userId=await findParticipant(el,session);if(!userId)return;
      await loadProfile(userId);
    };
    const bind=()=>{
      const nodes=document.querySelectorAll('.msg[data-message-id]');let count=0;
      nodes.forEach(el=>{if(el.dataset.kppBound)return;el.dataset.kppBound='1';el.classList.add('kd-participant-trigger');el.addEventListener('dblclick',e=>{if(e.target.closest('button,a,input,textarea,video,audio'))return;open(el)},{passive:true});count++});
      return count;
    };
    bind();new MutationObserver(()=>bind()).observe(document.body,{childList:true,subtree:true});
    window.KDChatParticipantProfile={open,loadProfile};
  };
  window.KDChatParticipantProfileMount=mount;
  const boot=()=>{if(window.__KD_SUPABASE_CLIENT__)mount(window.__KD_SUPABASE_CLIENT__)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,3200),{once:true});else setTimeout(boot,3200);
})();
