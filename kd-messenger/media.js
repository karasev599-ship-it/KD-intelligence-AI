(()=>{
  const start=async()=>{
    if(!window.supabase)return;
    const SB_URL='https://qqofizfqkctycyeafgsa.supabase.co';
    const SB_KEY='sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK';
    const sb=window.supabase.createClient(SB_URL,SB_KEY);
    const session=(await sb.auth.getSession()).data.session;
    if(!session)return;
    const user=session.user;
    const $=s=>document.querySelector(s);
    const toast=x=>{const t=$('#toast');if(!t)return;t.textContent=x;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800)};
    const composer=$('#composer'),attach=$('#attach'),emoji=$('#emoji');
    if(!composer||!attach)return;

    let pendingFiles=[];
    let recording=null,recordingChunks=[],recordStarted=0;
    let voiceBlob=null,voiceDuration=0;

    const css=document.createElement('style');
    css.textContent='.media-file{margin-top:7px;border-radius:12px;overflow:hidden}.media-file img{display:block;max-width:min(280px,100%);max-height:320px;object-fit:cover;border-radius:12px}.media-file a{display:flex;align-items:center;gap:8px;color:inherit;text-decoration:none;padding:9px 11px;background:#ffffff0b;border:1px solid #ffffff12;border-radius:11px}.media-file audio{display:block;width:min(280px,100%);height:38px}.media-name{font-size:11px;opacity:.8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.attach-preview{display:flex;gap:6px;flex-wrap:wrap;padding:0 12px 6px}.attach-chip{display:flex;align-items:center;gap:5px;background:#15151e;border:1px solid #30303d;color:#ddd;border-radius:9px;padding:5px 8px;font-size:10px}.attach-chip button{border:0;background:none;color:#aaa;cursor:pointer}.voice-recording{display:flex;align-items:center;gap:8px;padding:6px 10px;margin:0 10px 6px;background:#21151b;border:1px solid #59303a;border-radius:10px;color:#ff9aa5;font-size:11px}.voice-recording button{margin-left:auto;border:0;border-radius:8px;background:#3a2028;color:#fff;padding:5px 8px}.voice-btn.recording{background:#ff5969!important;color:#fff!important}';
    document.head.appendChild(css);

    const fileInput=document.createElement('input');
    fileInput.type='file';fileInput.multiple=true;fileInput.hidden=true;
    fileInput.accept='image/*,.pdf,.txt,.zip,audio/*';
    document.body.appendChild(fileInput);

    const voiceBtn=document.createElement('button');
    voiceBtn.type='button';voiceBtn.id='voice';voiceBtn.className='emoji-btn voice-btn';voiceBtn.textContent='🎙';
    emoji?.before(voiceBtn);

    const preview=document.createElement('div');
    preview.className='attach-preview';composer.before(preview);

    const safeName=x=>String(x||'Файл').replace(/[<>\"]/g,'').slice(0,80);
    const iconFor=f=>f.type?.startsWith('image/')?'🖼️':f.type?.startsWith('audio/')?'🎵':'📎';
    const extFor=(name,type)=>{
      const known=(name||'').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8);
      if(known)return known;
      const map={'audio/webm':'webm','audio/ogg':'ogg','audio/mp4':'m4a','audio/mpeg':'mp3','audio/wav':'wav'};
      return map[type]||'bin';
    };

    function renderPreview(){
      preview.innerHTML=pendingFiles.map((f,i)=>'<div class="attach-chip">'+iconFor(f)+' '+safeName(f.name).slice(0,28)+' <button type="button" data-i="'+i+'">×</button></div>').join('');
      preview.querySelectorAll('button').forEach(b=>b.onclick=()=>{pendingFiles.splice(+b.dataset.i,1);renderPreview()});
    }

    attach.type='button';
    attach.onclick=()=>fileInput.click();
    fileInput.onchange=()=>{
      const selected=[...fileInput.files];
      const room=Math.max(0,6-pendingFiles.length);
      pendingFiles=[...pendingFiles,...selected.slice(0,room)];
      fileInput.value='';renderPreview();
      if(selected.length>room)toast('Можно выбрать до 6 файлов');
    };

    async function uploadBlob(blob,path,type){
      const r=await sb.storage.from('kd-messenger').upload(path,blob,{contentType:type||'application/octet-stream',upsert:false});
      if(r.error)throw r.error;
      return path;
    }

    function currentConversation(){return document.querySelector('.chat.active')?.dataset.id||window.kdActiveConversation||null}

    async function insertMedia(conversationId,file,caption='',duration=null){
      if(!conversationId)throw new Error('Откройте чат');
      if(!file?.size)throw new Error('Пустой файл');
      if(file.size>50*1024*1024)throw new Error('Файл больше 50 МБ');
      const type=file.type||'application/octet-stream';
      const ext=extFor(file.name,type);
      const path=conversationId+'/'+user.id+'/'+crypto.randomUUID()+'.'+ext;
      await uploadBlob(file,path,type);
      const r=await sb.from('kd_messages').insert({conversation_id:conversationId,sender_id:user.id,body:caption||'',message_type:type.startsWith('audio/')?'voice':'file',attachment_path:path,attachment_name:file.name||('file.'+ext),attachment_type:type,attachment_size:file.size,voice_duration:duration}).select().single();
      if(r.error){await sb.storage.from('kd-messenger').remove([path]);throw r.error}
      return r.data;
    }

    async function appendMediaMessage(m){
      const box=$('#messages');if(!box||!m?.id||document.querySelector('[data-message-id="'+m.id+'"]'))return;
      const el=document.createElement('div');el.className='msg out';el.dataset.messageId=m.id;
      el.innerHTML='<div class="bubble">'+(m.body?'<div class="media-caption"></div>':'')+'</div><div class="msg-meta">сейчас ✓✓</div>';
      if(m.body)el.querySelector('.media-caption').textContent=m.body;
      box.appendChild(el);await decorate(el,m);box.scrollTop=box.scrollHeight;
    }

    async function decorate(el,m){
      if(!m?.id||el.querySelector('.media-file'))return;
      const r=await sb.from('kd_messages').select('attachment_path,attachment_name,attachment_type,attachment_size,voice_duration,body,message_type').eq('id',m.id).maybeSingle();
      if(r.error||!r.data?.attachment_path)return;
      const d=r.data;
      const u=await sb.storage.from('kd-messenger').createSignedUrl(d.attachment_path,3600);
      if(u.error||!u.data?.signedUrl)return;
      const wrap=document.createElement('div');wrap.className='media-file';
      const type=d.attachment_type||'';
      if(type.startsWith('image/')){
        const a=document.createElement('a');a.href=u.data.signedUrl;a.target='_blank';a.rel='noreferrer';
        const img=document.createElement('img');img.loading='lazy';img.src=u.data.signedUrl;img.alt=safeName(d.attachment_name||'Фото');a.appendChild(img);wrap.appendChild(a);
      }else if(type.startsWith('audio/')){
        const musicData={id:m.id,attachment_path:d.attachment_path,attachment_name:d.attachment_name,attachment_type:type,voice_duration:d.voice_duration};
        const player=window.kdRenderMusicMessage?.(musicData);
        if(player)wrap.appendChild(player);else{const audio=document.createElement('audio');audio.controls=true;audio.preload='metadata';audio.src=u.data.signedUrl;wrap.appendChild(audio)}
      }else{
        const a=document.createElement('a');a.href=u.data.signedUrl;a.target='_blank';a.rel='noreferrer';a.textContent='📎 ';
        const span=document.createElement('span');span.className='media-name';span.textContent=safeName(d.attachment_name||'Файл');a.appendChild(span);wrap.appendChild(a);
      }
      el.querySelector('.bubble')?.appendChild(wrap);
    }

    async function decorateAll(){
      for(const el of document.querySelectorAll('.msg[data-message-id]')){
        if(!el.querySelector('.media-file'))await decorate(el,{id:el.dataset.messageId});
      }
    }

    const target=$('#messages')||document.body;
    new MutationObserver(()=>{clearTimeout(window.__kdMediaTimer);window.__kdMediaTimer=setTimeout(decorateAll,80)}).observe(target,{childList:true,subtree:true});
    setTimeout(decorateAll,500);

    function pickVoiceMime(){
      if(!window.MediaRecorder?.isTypeSupported)return '';
      const options=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus','audio/ogg'];
      return options.find(x=>MediaRecorder.isTypeSupported(x))||'';
    }

    async function recordVoice(){
      if(recording)return;
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Запись голоса не поддерживается');
      if(!window.MediaRecorder)throw new Error('Браузер не поддерживает запись голоса');
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mime=pickVoiceMime();
      try{recording=mime?new MediaRecorder(stream,{mimeType:mime}):new MediaRecorder(stream)}catch(e){stream.getTracks().forEach(t=>t.stop());throw e}
      recordingChunks=[];recordStarted=Date.now();
      const bar=document.createElement('div');bar.className='voice-recording';bar.id='voiceRecording';
      bar.innerHTML='<span>● Запись голоса <b>0:00</b></span><button type="button">Готово</button>';composer.before(bar);
      const tick=setInterval(()=>{const s=Math.floor((Date.now()-recordStarted)/1000);const b=bar.querySelector('b');if(b)b.textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},250);
      bar.querySelector('button').onclick=()=>recording?.stop();
      recording.ondataavailable=e=>{if(e.data?.size)recordingChunks.push(e.data)};
      recording.onerror=()=>toast('Ошибка записи голоса');
      recording.onstop=()=>{
        clearInterval(tick);stream.getTracks().forEach(t=>t.stop());
        voiceDuration=Math.max(1,Math.round((Date.now()-recordStarted)/1000));
        voiceBlob=new Blob(recordingChunks,{type:recording?.mimeType||mime||'audio/webm'});
        recording=null;bar.remove();voiceBtn.classList.remove('recording');toast('Голосовое готово — нажми отправить');
      };
      recording.start();voiceBtn.classList.add('recording');
    }

    voiceBtn.onclick=async()=>{
      try{
        if(recording){recording.stop();return}
        if(voiceBlob){voiceBlob=null;voiceDuration=0;toast('Голосовое отменено');return}
        await recordVoice();
      }catch(e){toast(e.message||'Нет доступа к микрофону')}
    };

    composer.addEventListener('submit',async e=>{
      if(!pendingFiles.length&&!voiceBlob)return;
      e.preventDefault();e.stopImmediatePropagation();
      const cid=currentConversation();if(!cid){toast('Сначала откройте чат');return}
      const input=$('#messageInput'),caption=input?.value.trim()||'';
      try{
        if(voiceBlob){
          const mime=voiceBlob.type||'audio/webm';
          const ext=extFor('',mime);
          const file=new File([voiceBlob],'voice-'+Date.now()+'.'+ext,{type:mime});
          const m=await insertMedia(cid,file,caption,voiceDuration);await appendMediaMessage(m);voiceBlob=null;voiceDuration=0;
        }
        for(const f of pendingFiles){const m=await insertMedia(cid,f,caption);await appendMediaMessage(m)}
        pendingFiles=[];renderPreview();if(input)input.value='';toast('Отправлено');
        if(window.kdRefreshNotificationMemberships)window.kdRefreshNotificationMemberships();
      }catch(err){toast(err.message||'Не удалось отправить файл')}
    },true);

    window.kdSendMedia=insertMedia;
    window.kdDecorateMedia=decorateAll;
  };
  setTimeout(start,900);
})();