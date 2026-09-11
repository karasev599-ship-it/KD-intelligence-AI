(()=>{
  const BOOT=Symbol.for('kd.profileStories.boot');
  if(window[BOOT])return; window[BOOT]=true;

  const SUPABASE_URL='https://qqofizfqkctycyeafgsa.supabase.co';
  const SUPABASE_KEY='sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK';
  const BUCKET='kd-profile-media';
  const css=`
  .kdps-trigger{position:fixed;right:18px;bottom:18px;z-index:3000;width:48px;height:48px;border-radius:50%;border:1px solid rgba(255,255,255,.16);background:linear-gradient(145deg,#171722,#28223d);color:#fff;font-weight:900;cursor:pointer;box-shadow:0 14px 40px rgba(0,0,0,.35)}
  .kdps-overlay{position:fixed;inset:0;z-index:2999;display:none;place-items:center;padding:18px;background:rgba(5,5,10,.72);backdrop-filter:blur(12px)}
  .kdps-overlay.open{display:grid}.kdps-modal{width:min(680px,100%);max-height:min(820px,92vh);overflow:auto;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:#0e0e15;color:#f5f5f7;box-shadow:0 30px 100px rgba(0,0,0,.55)}
  .kdps-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.07)}.kdps-head h2{margin:0;font-size:18px}.kdps-close{border:0;background:transparent;color:#aaa;font-size:25px;cursor:pointer}
  .kdps-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:10px;background:#0a0a0f}.kdps-tabs button{border:0;background:#14141c;color:#888;padding:10px;border-radius:10px;cursor:pointer}.kdps-tabs button.active{background:#29223f;color:#fff}
  .kdps-pane{padding:20px}.kdps-profile{display:grid;grid-template-columns:92px 1fr;gap:18px;align-items:center}.kdps-avatar{width:92px;height:92px;border-radius:50%;object-fit:cover;background:#242433;display:grid;place-items:center;font-size:30px;font-weight:900;border:2px solid rgba(255,255,255,.12)}
  .kdps-fields{display:grid;gap:10px}.kdps-fields label{display:grid;gap:5px;font-size:11px;color:#999}.kdps-fields input,.kdps-fields textarea,.kdps-fields select{box-sizing:border-box;width:100%;border:1px solid #292936;border-radius:11px;background:#09090e;color:#fff;padding:11px 12px;outline:none}.kdps-fields textarea{min-height:78px;resize:vertical}.kdps-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.kdps-btn{border:1px solid #34344a;background:#181824;color:#ddd;border-radius:10px;padding:9px 12px;cursor:pointer;font-weight:700}.kdps-btn.primary{background:linear-gradient(135deg,#725cff,#a18cff);border-color:transparent;color:#fff}.kdps-btn.danger{color:#ff9b9b}.kdps-status{min-height:18px;margin-top:8px;color:#8f8f9c;font-size:12px}.kdps-stories{display:grid;gap:12px}.kdps-story-row{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;padding:10px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:#12121a;cursor:pointer}.kdps-story-thumb{width:56px;height:70px;border-radius:10px;object-fit:cover;background:#22223a;display:grid;place-items:center;font-size:20px;overflow:hidden}.kdps-story-thumb img,.kdps-story-thumb video{width:100%;height:100%;object-fit:cover}.kdps-story-copy{min-width:0}.kdps-story-copy strong{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.kdps-story-copy small{display:block;color:#888;margin-top:4px}.kdps-story-empty{padding:30px 10px;text-align:center;color:#777}.kdps-viewer{position:fixed;inset:0;z-index:3100;display:none;place-items:center;background:#000}.kdps-viewer.open{display:grid}.kdps-viewer-media{max-width:min(94vw,700px);max-height:88vh;border-radius:14px;overflow:hidden;display:grid;place-items:center}.kdps-viewer-media img,.kdps-viewer-media video{max-width:100%;max-height:82vh;object-fit:contain}.kdps-viewer-text{max-width:650px;padding:36px;color:#fff;font-size:28px;line-height:1.25;text-align:center}.kdps-viewer-close{position:fixed;right:20px;top:16px;border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:50%;width:42px;height:42px;font-size:25px;cursor:pointer}.kdps-viewer-meta{position:fixed;left:18px;top:18px;color:#fff;font-size:13px;background:rgba(0,0,0,.35);padding:9px 12px;border-radius:10px}.kdps-reactions{position:fixed;bottom:24px;display:flex;gap:7px}.kdps-reactions button{border:1px solid rgba(255,255,255,.18);background:rgba(20,20,25,.85);color:#fff;border-radius:20px;padding:8px 11px;cursor:pointer}.kdps-upload{display:none}.kdps-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.kdps-card{padding:14px;border:1px solid rgba(255,255,255,.07);border-radius:14px;background:#12121a}.kdps-card h3{margin:0 0 8px;font-size:14px}.kdps-card p{margin:0;color:#8d8d99;font-size:12px;line-height:1.5}@media(max-width:600px){.kdps-overlay{padding:0}.kdps-modal{height:100%;max-height:none;border-radius:0}.kdps-profile{grid-template-columns:72px 1fr}.kdps-avatar{width:72px;height:72px}.kdps-grid{grid-template-columns:1fr}.kdps-trigger{right:12px;bottom:12px}}
  `;

  const mount=()=>{
    if(!window.supabase)return;
    const messenger=document.querySelector('.msg[data-message-id],#messageInput,[data-kd-messenger],.kd-messenger,.messenger-shell');
    if(!messenger)return;
    if(document.getElementById('kdpsTrigger'))return;

    const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

    const trigger=document.createElement('button');trigger.id='kdpsTrigger';trigger.className='kdps-trigger';trigger.title='KD Messenger — профиль и истории';trigger.textContent='KD';
    const overlay=document.createElement('div');overlay.className='kdps-overlay';overlay.id='kdpsOverlay';overlay.innerHTML=`<section class="kdps-modal" role="dialog" aria-modal="true"><header class="kdps-head"><h2>Профиль KD Messenger</h2><button class="kdps-close" id="kdpsClose">×</button></header><div class="kdps-tabs"><button class="active" data-pane="profile">Профиль</button><button data-pane="stories">Истории</button></div><div class="kdps-pane" id="kdpsProfilePane"><div class="kdps-profile"><div><div class="kdps-avatar" id="kdpsAvatar">KD</div><input class="kdps-upload" id="kdpsAvatarInput" type="file" accept="image/*"></div><div class="kdps-fields"><label>Отображаемое имя<input id="kdpsName" maxlength="60" placeholder="Ваше имя"></label><label>Username<input id="kdpsUsername" maxlength="32" placeholder="username"></label></div></div><div class="kdps-fields" style="margin-top:14px"><label>Статус<textarea id="kdpsStatus" maxlength="120" placeholder="Например: В сети, занят, в зале…"></textarea></label><label>О себе<textarea id="kdpsBio" maxlength="240" placeholder="Коротко о себе"></textarea></label></div><div class="kdps-actions"><button class="kdps-btn" id="kdpsAvatarBtn">📷 Фото профиля</button><button class="kdps-btn primary" id="kdpsSave">Сохранить профиль</button></div><div class="kdps-status" id="kdpsProfileStatus"></div><div class="kdps-grid" style="margin-top:16px"><div class="kdps-card"><h3>Статус</h3><p id="kdpsOnlineText">—</p></div><div class="kdps-card"><h3>Публичный профиль</h3><p id="kdpsTagText">—</p></div></div></div><div class="kdps-pane" id="kdpsStoriesPane" hidden><div class="kdps-actions" style="margin-top:0"><button class="kdps-btn primary" id="kdpsAddStory">＋ Добавить историю</button><input class="kdps-upload" id="kdpsStoryInput" type="file" accept="image/*,video/*"></div><div class="kdps-status" id="kdpsStoryStatus"></div><div class="kdps-stories" id="kdpsStoriesList"></div></div></section>`;
    document.body.append(trigger,overlay);

    const viewer=document.createElement('div');viewer.className='kdps-viewer';viewer.id='kdpsViewer';viewer.innerHTML='<button class="kdps-viewer-close" id="kdpsViewerClose">×</button><div class="kdps-viewer-meta" id="kdpsViewerMeta"></div><div class="kdps-viewer-media" id="kdpsViewerMedia"></div><div class="kdps-reactions" id="kdpsReactions"><button>❤️</button><button>🔥</button><button>😂</button><button>😍</button><button>😮</button><button>👏</button></div>';document.body.appendChild(viewer);

    const $=id=>document.getElementById(id);const profile={};let me=null;let stories=[];let currentStory=null;
    const status=(id,text)=>{const el=$(id);if(el)el.textContent=text||''};
    const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
    const initial=name=>(String(name||'KD').trim().charAt(0)||'K').toUpperCase();

    async function session(){const r=await sb.auth.getSession();return r.data.session;}
    async function ensureProfile(){
      me=await session();
      if(!me){status('kdpsProfileStatus','Войди в KD Messenger, чтобы редактировать профиль.');return null;}
      const q=await sb.from('kd_profiles').select('*').eq('id',me.user.id).maybeSingle();
      if(q.error)throw q.error;
      if(q.data)Object.assign(profile,q.data);
      else{
        const fallback={id:me.user.id,display_name:me.user.user_metadata?.name||me.user.email?.split('@')[0]||'KD User',username:null,status:'В сети',bio:null};
        const ins=await sb.from('kd_profiles').insert(fallback).select('*').single();
        if(ins.error)throw ins.error;Object.assign(profile,ins.data);
      }
      return profile;
    }
    async function signed(path){const q=await sb.storage.from(BUCKET).createSignedUrl(path,3600);if(q.error)throw q.error;return q.data.signedUrl;}
    async function upload(file,folder){
      if(!me)throw Error('Нет сессии');
      if(!file.type.startsWith('image/')&&!file.type.startsWith('video/'))throw Error('Неподдерживаемый файл');
      const max=file.type.startsWith('video/')?40:8;
      if(file.size>max*1024*1024)throw Error(`Файл больше ${max} МБ`);
      const ext=(file.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'')||'bin';
      const path=`${folder}/${me.user.id}/${crypto.randomUUID()}.${ext}`;
      const q=await sb.storage.from(BUCKET).upload(path,file,{upsert:false,contentType:file.type,cacheControl:'3600'});
      if(q.error)throw q.error;return path;
    }
    function renderProfile(){
      $('kdpsName').value=profile.display_name||'';$('kdpsUsername').value=profile.username||'';$('kdpsStatus').value=profile.status||'';$('kdpsBio').value=profile.bio||'';
      const a=$('kdpsAvatar');a.textContent=initial(profile.display_name);a.style.backgroundImage='none';
      if(profile.avatar_url){signed(profile.avatar_url).then(url=>{a.textContent='';a.style.backgroundImage=`url("${url}")`;a.style.backgroundSize='cover';a.style.backgroundPosition='center'}).catch(()=>{});}
      $('kdpsOnlineText').textContent=profile.status||'В сети';$('kdpsTagText').textContent=profile.tag?`@${profile.tag}`:(profile.username?`@${profile.username}`:'Username не задан');
    }
    async function saveProfile(){
      if(!me)return;
      const display_name=$('kdpsName').value.trim()||'KD User';const username=$('kdpsUsername').value.trim().replace(/^@/,'').toLowerCase();const statusText=$('kdpsStatus').value.trim()||'В сети';const bio=$('kdpsBio').value.trim();
      if(username&&!/^[a-z0-9_\.]{3,32}$/.test(username)){status('kdpsProfileStatus','Username: 3–32 символа, только a-z, 0-9, _ и .');return;}
      const q=await sb.from('kd_profiles').update({display_name,username:username||null,status:statusText,bio:bio||null,updated_at:new Date().toISOString()}).eq('id',me.user.id).select('*').single();
      if(q.error){status('kdpsProfileStatus',q.error.message.includes('duplicate')?'Этот username уже занят.':'Не удалось сохранить профиль.');return;}
      Object.assign(profile,q.data);renderProfile();status('kdpsProfileStatus','Профиль сохранён.');
    }
    async function saveAvatar(file){
      if(!file)return;status('kdpsProfileStatus','Загружаю фото…');
      try{const path=await upload(file,'avatars');const q=await sb.from('kd_profiles').update({avatar_url:path,updated_at:new Date().toISOString()}).eq('id',me.user.id).select('*').single();if(q.error)throw q.error;Object.assign(profile,q.data);renderProfile();status('kdpsProfileStatus','Фото профиля обновлено.');}catch(e){status('kdpsProfileStatus,'+String(e.message||'Не удалось загрузить фото'));}
    }
    async function loadStories(){
      if(!me)return;
      const q=await sb.from('kd_stories').select('id,user_id,media_type,media_url,caption,created_at,expires_at,kd_profiles!kd_stories_user_id_fkey(display_name,username,avatar_url)').gt('expires_at',new Date().toISOString()).order('created_at',{ascending:false}).limit(50);
      if(q.error){status('kdpsStoryStatus','Не удалось загрузить истории.');return;}
      stories=q.data||[];renderStories();
    }
    function renderStories(){
      const box=$('kdpsStoriesList');if(!stories.length){box.innerHTML='<div class="kdps-story-empty">Пока нет активных историй.<br>Добавь первую — она будет доступна 24 часа.</div>';return;}
      box.innerHTML=stories.map(s=>{const p=s.kd_profiles||{};const meta=`${escape(p.display_name||'KD User')} · ${new Date(s.created_at).toLocaleString()}`;return `<article class="kdps-story-row" data-story="${escape(s.id)}"><div class="kdps-story-thumb" data-thumb="${escape(s.id)}">${s.media_type==='text'?'Aa':''}</div><div class="kdps-story-copy"><strong>${escape(s.caption||meta)}</strong><small>${meta}</small></div><span>›</span></article>`}).join('');
      stories.forEach(s=>{const el=document.querySelector(`[data-thumb="${s.id}"]`);if(!el||s.media_type==='text'||!s.media_url)return;signed(s.media_url).then(url=>{el.innerHTML=s.media_type==='video'?`<video muted playsinline src="${url}"></video>`:`<img src="${url}" alt="">`}).catch(()=>{});});
      box.querySelectorAll('[data-story]').forEach(el=>el.onclick=()=>openStory(el.dataset.story));
    }
    async function openStory(id){
      const s=stories.find(x=>x.id===id);if(!s)return;currentStory=s;$('kdpsViewerMedia').innerHTML='';$('kdpsViewerMeta').textContent=`${s.kd_profiles?.display_name||'KD User'}${s.caption?' · '+s.caption:''}`;
      if(s.media_type==='text'){$('kdpsViewerMedia').innerHTML=`<div class="kdps-viewer-text">${escape(s.caption||'')}</div>`}
      else if(s.media_url){try{const url=await signed(s.media_url);$('kdpsViewerMedia').innerHTML=s.media_type==='video'?`<video controls autoplay playsinline src="${url}"></video>`:`<img src="${url}" alt="История">`;}catch{status('kdpsStoryStatus','Не удалось открыть историю.');return;}}
      $('kdpsViewer').classList.add('open');
      if(me&&s.user_id!==me.user.id)await sb.from('kd_story_views').upsert({story_id:s.id,viewer_id:me.user.id,viewed_at:new Date().toISOString()},{onConflict:'story_id,viewer_id'});
    }
    async function addStory(file){
      if(!me)return;const caption=prompt('Подпись к истории (необязательно):','');if(caption===null)return;status('kdpsStoryStatus','Публикую историю…');
      try{let media_type='text',media_url=null;if(file){media_type=file.type.startsWith('video/')?'video':'image';media_url=await upload(file,'stories');}const q=await sb.from('kd_stories').insert({user_id:me.user.id,media_type,media_url,caption:caption.trim()||null}).select('*').single();if(q.error)throw q.error;status('kdpsStoryStatus','История опубликована на 24 часа.');await loadStories();}catch(e){status('kdpsStoryStatus',String(e.message||'Не удалось опубликовать историю.'));}
    }
    async function react(reaction){if(!currentStory||!me)return;const q=await sb.from('kd_story_reactions').upsert({story_id:currentStory.id,user_id:me.user.id,reaction},{onConflict:'story_id,user_id'});if(q.error)status('kdpsStoryStatus','Не удалось отправить реакцию.');}

    $('kdpsTrigger').onclick=async()=>{overlay.classList.add('open');try{await ensureProfile();renderProfile();await loadStories();}catch(e){status('kdpsProfileStatus','Ошибка профиля: '+(e.message||'неизвестно'));}};
    $('kdpsClose').onclick=()=>overlay.classList.remove('open');overlay.onclick=e=>{if(e.target===overlay)overlay.classList.remove('open')};
    $('kdpsViewerClose').onclick=()=>viewer.classList.remove('open');
    $('kdpsAvatarBtn').onclick=()=>$('kdpsAvatarInput').click();$('kdpsAvatarInput').onchange=e=>saveAvatar(e.target.files?.[0]);
    $('kdpsSave').onclick=saveProfile;$('kdpsAddStory').onclick=()=>$('kdpsStoryInput').click();$('kdpsStoryInput').onchange=e=>addStory(e.target.files?.[0]);
    document.querySelectorAll('.kdps-tabs button').forEach(btn=>btn.onclick=async()=>{document.querySelectorAll('.kdps-tabs button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const pane=btn.dataset.pane;$('kdpsProfilePane').hidden=pane!=='profile';$('kdpsStoriesPane').hidden=pane!=='stories';if(pane==='stories')await loadStories();});
    document.querySelectorAll('#kdpsReactions button').forEach(btn=>btn.onclick=()=>react(btn.textContent));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){overlay.classList.remove('open');viewer.classList.remove('open')}});

    sb.auth.onAuthStateChange(()=>{setTimeout(async()=>{try{await ensureProfile();renderProfile();}catch(_){ }},0)});
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,2200),{once:true});else setTimeout(mount,2200);
})();
