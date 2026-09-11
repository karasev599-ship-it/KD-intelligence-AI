(()=>{
  if(window.__KD_CHAT_PROFILE_UI__)return;
  window.__KD_CHAT_PROFILE_UI__=true;
  const STORY_BUCKET='kd-stories';
  const CSS=`
  #kd-chat-social{width:100%;box-sizing:border-box;padding:10px 12px 8px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(10,10,15,.72);backdrop-filter:blur(14px);overflow:hidden}
  #kd-chat-social .kds-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
  #kd-chat-social .kds-title{font-size:12px;font-weight:800;color:#fff;letter-spacing:.2px}
  #kd-chat-social .kds-status{font-size:10px;color:#858391}
  #kd-chat-social .kds-row{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding:2px 1px 5px}
  #kd-chat-social .kds-row::-webkit-scrollbar{display:none}
  #kd-chat-social .kds-item{flex:0 0 64px;border:0;background:none;color:#fff;padding:0;cursor:pointer;text-align:center}
  #kd-chat-social .kds-avatar{width:54px;height:54px;margin:auto;border-radius:50%;display:grid;place-items:center;background:#242132;border:2px solid #765fff;box-shadow:0 0 0 2px rgba(118,95,255,.16);background-size:cover;background-position:center;font-size:18px;font-weight:900;overflow:hidden}
  #kd-chat-social .kds-item.self .kds-avatar{border-color:#43c6a0}
  #kd-chat-social .kds-name{display:block;margin-top:4px;font-size:9px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #kd-chat-social .kds-add .kds-avatar{border-style:dashed;color:#9f91ff;font-size:24px}
  #kd-chat-social .kds-empty{padding:9px 0;color:#777;font-size:11px}
  #kd-chat-social .kds-view{position:fixed;inset:0;z-index:6000;background:#050507;display:none;place-items:center;padding:18px}
  #kd-chat-social .kds-view.open{display:grid}
  #kd-chat-social .kds-media{max-width:min(720px,96vw);max-height:86vh;display:grid;place-items:center}
  #kd-chat-social .kds-media img,#kd-chat-social .kds-media video{max-width:96vw;max-height:82vh;border-radius:16px;object-fit:contain}
  #kd-chat-social .kds-text{max-width:720px;color:#fff;font-size:28px;line-height:1.35;text-align:center;padding:28px}
  #kd-chat-social .kds-close{position:fixed;right:18px;top:14px;width:42px;height:42px;border:0;border-radius:50%;background:#ffffff18;color:#fff;font-size:24px;cursor:pointer}
  #kd-chat-social .kds-react{position:fixed;bottom:24px;display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
  #kd-chat-social .kds-react button{border:1px solid #ffffff22;background:#171717dd;color:#fff;border-radius:20px;padding:8px 11px;cursor:pointer}
  @media(max-width:600px){#kd-chat-social{padding:8px 8px 6px}.kds-item{flex-basis:58px!important}.kds-avatar{width:48px!important;height:48px!important}.kds-text{font-size:22px!important}}
  `;
  const mount=sb=>{
    if(!sb||document.getElementById('kd-chat-social'))return;
    const input=document.querySelector('#messageInput');
    const root=document.querySelector('[data-kd-messenger],.kd-messenger,.messenger-shell')||input?.closest('main,section,.chat,.chat-window,.messenger,.messages')||input?.parentElement;
    if(!root)return;
    const style=document.createElement('style');style.textContent=CSS;document.head.appendChild(style);
    const rail=document.createElement('section');rail.id='kd-chat-social';rail.innerHTML=`<div class="kds-head"><div><div class="kds-title">Истории</div><div class="kds-status" id="kdsStatus">Загрузка…</div></div><button id="kdsProfile" style="border:1px solid #343044;background:#191722;color:#ddd;border-radius:10px;padding:7px 10px;cursor:pointer;font-weight:700">Профиль</button></div><div class="kds-row" id="kdsRow"></div><div class="kds-view" id="kdsView"><button class="kds-close" id="kdsClose">×</button><div class="kds-media" id="kdsMedia"></div><div class="kds-react" id="kdsReact"><button>❤️</button><button>🔥</button><button>😂</button><button>😍</button><button>😮</button><button>👏</button></div></div>`;
    const anchor=input?.closest('form,.composer,.message-input,.input-area')||input?.parentElement;
    if(anchor&&anchor.parentElement)anchor.parentElement.insertBefore(rail,anchor);else root.prepend(rail);
    const q=id=>rail.querySelector('#'+id);
    let session=null,stories=[],active=null;
    const initial=v=>(String(v||'K').trim()[0]||'K').toUpperCase();
    const publicUrl=path=>sb.storage.from(STORY_BUCKET).getPublicUrl(path).data.publicUrl;
    const getSession=async()=>{session=(await sb.auth.getSession()).data.session;return session};
    const load=async()=>{
      try{
        await getSession();
        const r=await sb.from('kd_stories').select('id,user_id,media_type,media_url,caption,created_at,expires_at,kd_profiles!kd_stories_user_id_fkey(display_name,username,avatar_url)').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(50);
        if(r.error)throw r.error;
        stories=r.data||[];
        const row=q('kdsRow');row.innerHTML='';
        if(session){
          const add=document.createElement('button');add.className='kds-item kds-add self';add.innerHTML='<span class="kds-avatar">＋</span><span class="kds-name">Моя история</span>';add.onclick=()=>q('kdsProfile').click();row.appendChild(add);
        }
        const seen=new Set();
        for(const st of stories){if(seen.has(st.user_id))continue;seen.add(st.user_id);const item=document.createElement('button');item.className='kds-item'+(session&&st.user_id===session.user.id?' self':'');const av=document.createElement('span');av.className='kds-avatar';av.textContent=initial(st.kd_profiles?.display_name);if(st.kd_profiles?.avatar_url){try{const u=await sb.storage.from('kd-profile-media').createSignedUrl(st.kd_profiles.avatar_url,900);if(!u.error&&u.data?.signedUrl){av.textContent='';av.style.backgroundImage=`url("${u.data.signedUrl}")`}}catch{}}const name=document.createElement('span');name.className='kds-name';name.textContent=st.kd_profiles?.display_name||'KD User';item.append(av,name);item.onclick=()=>openStory(st.id);row.appendChild(item)}
        q('kdsStatus').textContent=stories.length?`${seen.size} активн.`:'Пока нет активных историй';
      }catch(e){q('kdsStatus').textContent='Истории недоступны'}
    };
    const openStory=async id=>{
      const st=stories.find(x=>x.id===id);if(!st)return;active=st;const media=q('kdsMedia');media.innerHTML='';
      if(st.media_type==='text'){const t=document.createElement('div');t.className='kds-text';t.textContent=st.caption||'';media.appendChild(t)}else if(st.media_url){const u=publicUrl(st.media_url);if(st.media_type==='video'){const v=document.createElement('video');v.src=u;v.controls=true;v.autoplay=true;v.playsInline=true;media.appendChild(v)}else{const img=document.createElement('img');img.src=u;img.alt='История';media.appendChild(img)}}
      q('kdsView').classList.add('open');if(session&&st.user_id!==session.user.id)await sb.from('kd_story_views').upsert({story_id:st.id,viewer_id:session.user.id,viewed_at:new Date().toISOString()},{onConflict:'story_id,viewer_id'});
    };
    q('kdsClose').onclick=()=>q('kdsView').classList.remove('open');
    q('kdsView').addEventListener('click',e=>{if(e.target===q('kdsView'))q('kdsView').classList.remove('open')});
    q('kdsProfile').onclick=()=>document.querySelector('#kdps .kdps-btn')?.click();
    q('kdsReact').querySelectorAll('button').forEach(b=>b.onclick=async()=>{if(active&&session)await sb.from('kd_story_reactions').upsert({story_id:active.id,user_id:session.user.id,reaction:b.textContent},{onConflict:'story_id,user_id'})});
    load();
    window.addEventListener('focus',load);document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});setInterval(load,60000);
  };
  window.KDChatProfileUI={mount};
  const auto=()=>{if(window.__KD_SUPABASE_CLIENT__)mount(window.__KD_SUPABASE_CLIENT__)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(auto,2600),{once:true});else setTimeout(auto,2600);
})();