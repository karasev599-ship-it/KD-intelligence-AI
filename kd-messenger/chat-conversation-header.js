(()=>{
  if(window.__KD_CHAT_CONVERSATION_HEADER__)return;
  window.__KD_CHAT_CONVERSATION_HEADER__=true;
  const BUCKET='kd-profile-media';
  const CANDIDATES=['sender_id','author_id','user_id','from_id','recipient_id','receiver_id','to_id','other_user_id','participant_id'];
  const CSS='.kd-conv-head{display:none;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(16,16,23,.92);backdrop-filter:blur(14px);position:sticky;top:0;z-index:40;min-height:64px}.kd-conv-head.show{display:flex}.kd-conv-avatar{width:42px;height:42px;border-radius:50%;background:#29243a;display:grid;place-items:center;font-weight:900;font-size:16px;overflow:hidden;background-size:cover;background-position:center;flex:0 0 auto}.kd-conv-main{min-width:0;flex:1}.kd-conv-name{font-weight:900;color:#fff;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kd-conv-status{font-size:11px;color:#8e899a;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kd-conv-head button{border:0;background:transparent;color:inherit;padding:0;cursor:pointer;text-align:left}.kd-conv-head.online .kd-conv-status{color:#b5f2df}';
  const roots=()=>[...document.querySelectorAll('[data-kd-messenger],.kd-messenger,.messenger-shell')];
  const initial=v=>(String(v||'K').trim()[0]||'K').toUpperCase();
  const mount=()=>{
    if(document.getElementById('kd-conv-head'))return;
    if(!document.getElementById('kd-conv-head-css')){const st=document.createElement('style');st.id='kd-conv-head-css';st.textContent=CSS;document.head.appendChild(st)}
    const head=document.createElement('div');head.id='kd-conv-head';head.className='kd-conv-head';head.innerHTML='<div class="kd-conv-avatar">K</div><button class="kd-conv-main" type="button"><div class="kd-conv-name">Диалог</div><div class="kd-conv-status">поиск собеседника…</div></button>';
    const root=roots()[0]||document.body;const anchor=document.querySelector('#messageInput');if(anchor?.parentElement)anchor.parentElement.insertBefore(head,anchor.parentElement.firstChild);else root.prepend(head);
    const client=window.__KD_SUPABASE_CLIENT__;
    const api={element:head,userId:null,show:()=>head.classList.add('show'),hide:()=>head.classList.remove('show'),refresh:()=>refresh()};
    window.KDConversationHeader=api;
    const setProfile=p=>{
      const name=p?.display_name||p?.username||'Пользователь';
      head.querySelector('.kd-conv-name').textContent=name;
      head.querySelector('.kd-conv-status').textContent=p?.is_online?'в сети':(p?.status||'был(а) недавно');
      head.classList.toggle('online',!!p?.is_online);
      const av=head.querySelector('.kd-conv-avatar');av.textContent=initial(name);av.style.backgroundImage='none';
      if(p?.avatar_url&&client)client.storage.from(BUCKET).createSignedUrl(p.avatar_url,900).then(r=>{if(!r.error&&r.data?.signedUrl){av.textContent='';av.style.backgroundImage=`url(${r.data.signedUrl})`}}).catch(()=>{});
    };
    const findParticipant=async session=>{
      const nodes=[...document.querySelectorAll('.msg[data-message-id]')];
      for(let i=nodes.length-1;i>=0;i--){const el=nodes[i];const direct=el.dataset.userId||el.dataset.senderId||el.dataset.authorId||el.dataset.recipientId;if(direct&&String(direct)!==String(session.user.id))return direct}
      if(!client)return null;
      for(let i=nodes.length-1;i>=0;i--){const mid=nodes[i].dataset.messageId;if(!mid)continue;const r=await client.from('kd_messages').select('*').eq('id',mid).maybeSingle();if(r.error||!r.data)continue;const row=r.data;for(const key of CANDIDATES){const v=row[key];if(v&&String(v)!==String(session.user.id))return v}for(const key of Object.keys(row)){if(!/id$/i.test(key))continue;const v=row[key];if(typeof v==='string'&&v.length>10&&v!==session.user.id&&/user|sender|author|recipient|receiver|from|to|member|participant/i.test(key))return v}}
      return null;
    };
    const refresh=async()=>{
      if(!client)return;
      const session=(await client.auth.getSession()).data.session;if(!session)return;
      const userId=await findParticipant(session);if(!userId)return;
      api.userId=userId;
      const r=await client.from('kd_profiles').select('display_name,username,status,avatar_url,is_online,last_seen').eq('id',userId).maybeSingle();
      if(!r.error&&r.data){setProfile(r.data);head.classList.add('show')}
    };
    head.querySelector('.kd-conv-main').addEventListener('click',()=>{
      if(!api.userId)return;
      if(window.KDChatParticipantProfile?.loadProfile)window.KDChatParticipantProfile.loadProfile(api.userId);
      else if(window.KDChatParticipantProfile?.open)window.KDChatParticipantProfile.open({dataset:{userId:api.userId}});
    });
    refresh();
    const obs=new MutationObserver(()=>{clearTimeout(head.__kdRefreshTimer);head.__kdRefreshTimer=setTimeout(refresh,250)});obs.observe(document.body,{childList:true,subtree:true});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,3600),{once:true});else setTimeout(mount,3600);
})();