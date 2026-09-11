(()=>{
  setTimeout(()=>{
    if(!window.supabase)return;

    const sb=window.supabase.createClient(
      'https://qqofizfqkctycyeafgsa.supabase.co',
      'sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK'
    );
    const FN='https://qqofizfqkctycyeafgsa.supabase.co/functions/v1/kd-ai-agent';
    const $=s=>document.querySelector(s);
    const toast=x=>{
      const t=$('#toast');
      if(t){
        t.textContent=x;
        t.classList.add('show');
        setTimeout(()=>t.classList.remove('show'),1800);
      }
    };

    const css=document.createElement('style');
    css.textContent=`
      .kd-media-ai{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}
      .kd-media-ai button{border:1px solid #34344a;background:#171722;color:#ddd;border-radius:9px;padding:5px 8px;font-size:11px;cursor:pointer}
      .kd-media-ai button:hover{background:#242436}
      .kd-media-ai button:disabled{opacity:.55;cursor:wait}
      .kd-media-ai-result{margin-top:7px;padding:9px 10px;border-radius:12px;background:#11111a;border:1px solid #34344a;color:#eee;white-space:pre-wrap;line-height:1.4;font-size:13px}
      .kd-media-ai-result .head{font-size:10px;color:#999;font-weight:800;margin-bottom:5px}
      .kd-media-ai-result .actions{display:flex;gap:5px;margin-top:7px}
      .kd-media-ai-result .actions button{border:1px solid #34344a;background:#1a1a25;color:#ddd;border-radius:8px;padding:5px 8px;font-size:11px}
    `;
    document.head.appendChild(css);

    const session=async()=>{
      const x=await sb.auth.getSession();
      return x.data.session;
    };

    const b64=b=>new Promise((ok,no)=>{
      const r=new FileReader();
      r.onload=()=>ok(String(r.result).split(',')[1]||'');
      r.onerror=no;
      r.readAsDataURL(b);
    });

    async function call(payload){
      const s=await session();
      if(!s)throw Error('Войди в аккаунт');
      const r=await fetch(FN,{
        method:'POST',
        headers:{Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      });
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw Error(d.error||'KD AI error');
      return d;
    }

    function result(el,text){
      let r=el.querySelector('.kd-media-ai-result');
      if(!r){
        r=document.createElement('div');
        r.className='kd-media-ai-result';
        el.appendChild(r);
      }
      r.innerHTML='<div class="head">✦ KD AI</div><div class="body"></div><div class="actions"><button data-a="insert">Вставить</button><button data-a="copy">Копировать</button><button data-a="remember">💾 Запомнить</button></div>';
      r.querySelector('.body').textContent=text||'Нет ответа';
      r.querySelector('[data-a="insert"]').onclick=()=>{
        const i=$('#messageInput');
        if(i){
          i.value=text||'';
          i.dispatchEvent(new Event('input',{bubbles:true}));
          i.focus();
          toast('Готово — вставлено в сообщение');
        }
      };
      r.querySelector('[data-a="copy"]').onclick=()=>navigator.clipboard?.writeText(text||'');
      r.querySelector('[data-a="remember"]').onclick=async()=>{
        if(window.kdSaveMemory){
          await window.kdSaveMemory(text||'');
          toast('Сохранено в KD Memory');
        }
      };
      return r;
    }

    async function analyzeVideoFrame(box,url,prompt){
      const btns=[...box.querySelectorAll('button')];
      btns.forEach(b=>b.disabled=true);
      const r=result(box,'KD AI извлекает кадр…');
      try{
        const video=document.createElement('video');
        video.crossOrigin='anonymous';
        video.muted=true;
        video.playsInline=true;
        video.preload='metadata';
        video.src=url;

        await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(Error('Не удалось загрузить видео')),12000);
          video.onloadedmetadata=()=>{clearTimeout(timer);resolve()};
          video.onerror=()=>{clearTimeout(timer);reject(Error('Не удалось открыть видео'))};
        });

        const duration=Number.isFinite(video.duration)?video.duration:0;
        const target=duration>0?Math.min(Math.max(duration*0.25,0.1),Math.max(duration-0.1,0.1)):0;
        await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(Error('Не удалось получить кадр')),8000);
          video.onseeked=()=>{clearTimeout(timer);resolve()};
          video.currentTime=target;
        });

        const canvas=document.createElement('canvas');
        const max=1280;
        const scale=Math.min(1,max/(video.videoWidth||max));
        canvas.width=Math.max(1,Math.round((video.videoWidth||max)*scale));
        canvas.height=Math.max(1,Math.round((video.videoHeight||max)*scale));
        const ctx=canvas.getContext('2d');
        if(!ctx)throw Error('Canvas недоступен');
        ctx.drawImage(video,0,0,canvas.width,canvas.height);

        const blob=await new Promise((resolve,reject)=>canvas.toBlob(x=>x?resolve(x):reject(Error('Не удалось подготовить кадр')),'image/jpeg',0.82));
        const answer=await call({
          mode:'vision',
          image_base64:await b64(blob),
          mime:'image/jpeg',
          text:prompt
        });
        r.querySelector('.body').textContent=answer.answer||'Нет ответа';
        toast('KD AI готов');
      }catch(e){
        r.querySelector('.body').textContent='Ошибка KD AI: '+(e.message||'ошибка');
        toast('KD AI: ошибка');
      }finally{
        btns.forEach(b=>b.disabled=false);
      }
    }

    async function decorate(el){
      if(el.querySelector('.kd-media-ai'))return;
      const id=el.dataset.messageId;
      if(!id)return;

      const row=await sb.from('kd_messages')
        .select('attachment_path,attachment_type,message_type,attachment_name')
        .eq('id',id)
        .maybeSingle();
      const d=row.data;
      if(!d?.attachment_path)return;
      if(!['voice','video_note'].includes(d.message_type)&&!d.attachment_type?.startsWith('image/'))return;

      const q=await sb.storage.from('kd-messenger').createSignedUrl(d.attachment_path,600);
      if(q.error||!q.data?.signedUrl)return;

      const box=document.createElement('div');
      box.className='kd-media-ai';

      if(d.message_type==='voice'){
        box.innerHTML='<button data-k="transcribe">🎙 Расшифровать</button><button data-k="summary">📝 Кратко</button><button data-k="reply">💬 Ответить</button><button data-k="translate">🌐 Перевести</button>';
        box.onclick=async e=>{
          const k=e.target.dataset.k;
          if(!k)return;
          const buttons=[...box.querySelectorAll('button')];
          buttons.forEach(b=>b.disabled=true);
          try{
            const res=await call({
              mode:'transcribe',
              audio_url:q.data.signedUrl,
              text:k==='summary'?'Расшифруй и кратко перескажи голосовое.':k==='reply'?'Расшифруй голосовое и предложи естественный ответ.':k==='translate'?'Расшифруй голосовое и переведи содержание на русский.':'Точно расшифруй голосовое и расставь знаки препинания.'
            });
            result(box,res.answer||'Нет ответа');
            toast('KD AI готов');
          }catch(x){toast('KD AI: '+x.message)}
          finally{buttons.forEach(b=>b.disabled=false)}
        };
      }else if(d.attachment_type?.startsWith('image/')){
        box.innerHTML='<button data-k="analyze">🔎 KD AI: анализ</button><button data-k="text">🔤 Распознать текст</button>';
        box.onclick=async e=>{
          const k=e.target.dataset.k;
          if(!k)return;
          const buttons=[...box.querySelectorAll('button')];
          buttons.forEach(b=>b.disabled=true);
          try{
            const r=await fetch(q.data.signedUrl);
            const b=await r.blob();
            const res=await call({
              mode:'vision',
              image_base64:await b64(b),
              mime:b.type,
              text:k==='text'?'Распознай весь видимый текст на изображении.':'Проанализируй изображение и опиши важные детали.'
            });
            result(box,res.answer||'Нет ответа');
            toast('KD AI готов');
          }catch(x){toast('KD AI: '+x.message)}
          finally{buttons.forEach(b=>b.disabled=false)}
        };
      }else{
        box.innerHTML='<button data-k="analyze">🔎 Анализ кружка</button><button data-k="scene">🎬 Что происходит</button><button data-k="text">🔤 Текст с кадра</button>';
        box.onclick=async e=>{
          const k=e.target.dataset.k;
          if(!k)return;
          const prompt=k==='scene'
            ?'Проанализируй этот кадр из видео-кружка. Опиши, что происходит, кто или что находится в кадре и важные детали. Не выдумывай то, чего не видно.'
            :k==='text'
              ?'Распознай весь видимый текст в этом кадре. Если текста нет, так и скажи.'
              :'Проанализируй этот кадр из видео-кружка и кратко объясни его содержание и важные детали.';
          await analyzeVideoFrame(box,q.data.signedUrl,prompt);
        };
      }

      el.querySelector('.bubble')?.appendChild(box);
    }

    async function all(){
      for(const e of document.querySelectorAll('.msg[data-message-id]'))await decorate(e);
    }

    setTimeout(all,1400);
    new MutationObserver(()=>all()).observe(document.body,{childList:true,subtree:true});
  },1800);
})();
