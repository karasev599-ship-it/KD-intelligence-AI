(()=>{
  setTimeout(()=>{
    if(!window.supabase)return;

    const sb=window.supabase.createClient(
      'https://qqofizfqkctycyeafgsa.supabase.co',
      'sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK'
    );
    const FN='https://qqofizfqkctycyeafgsa.supabase.co/functions/v1/kd-ai-agent';
    const $=s=>document.querySelector(s);
    const decorated=new WeakSet();
    const aiCache=new Map();
    let scanTimer=0;

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

    async function cached(key,producer){
      if(aiCache.has(key)){
        toast('KD AI: результат из кэша');
        return aiCache.get(key);
      }
      const value=await producer();
      if(value)aiCache.set(key,value);
      return value;
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
      r.querySelector('[data-a="copy"]').onclick=async()=>{
        try{
          await navigator.clipboard.writeText(text||'');
          toast('Скопировано');
        }catch{toast('Не удалось скопировать');}
      };
      r.querySelector('[data-a="remember"]').onclick=async()=>{
        if(!window.kdSaveMemory){toast('KD Memory пока недоступна');return;}
        try{
          await window.kdSaveMemory(text||'');
          toast('Сохранено в KD Memory');
        }catch{toast('Не удалось сохранить');}
      };
      return r;
    }

    async function loadVideoBlob(url){
      const r=await fetch(url,{mode:'cors',credentials:'omit'});
      if(!r.ok)throw Error('Не удалось загрузить видео');
      const blob=await r.blob();
      if(!blob.type.startsWith('video/'))throw Error('Файл не является видео');
      if(blob.size>40*1024*1024)throw Error('Видео слишком большое для AI (максимум 40 МБ)');
      return URL.createObjectURL(blob);
    }

    async function analyzeVideoFrame(box,url,prompt,cacheKey){
      const btns=[...box.querySelectorAll('button')];
      btns.forEach(b=>b.disabled=true);
      const r=result(box,'KD AI извлекает кадр…');
      let objectUrl='';
      try{
        const cachedAnswer=aiCache.get(cacheKey);
        if(cachedAnswer){
          r.querySelector('.body').textContent=cachedAnswer;
          toast('KD AI: результат из кэша');
          return;
        }

        objectUrl=await loadVideoBlob(url);
        const video=document.createElement('video');
        video.muted=true;
        video.playsInline=true;
        video.preload='metadata';
        video.src=objectUrl;

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
          video.onerror=()=>{clearTimeout(timer);reject(Error('Ошибка декодирования видео'))};
          video.currentTime=target;
        });

        if(!video.videoWidth||!video.videoHeight)throw Error('Видео не содержит доступного кадра');
        const canvas=document.createElement('canvas');
        const max=1280;
        const scale=Math.min(1,max/video.videoWidth);
        canvas.width=Math.max(1,Math.round(video.videoWidth*scale));
        canvas.height=Math.max(1,Math.round(video.videoHeight*scale));
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
        const text=answer.answer||'Нет ответа';
        aiCache.set(cacheKey,text);
        r.querySelector('.body').textContent=text;
        toast('KD AI готов');
      }catch(e){
        r.querySelector('.body').textContent='Ошибка KD AI: '+(e.message||'ошибка');
        toast('KD AI: ошибка');
      }finally{
        if(objectUrl)URL.revokeObjectURL(objectUrl);
        btns.forEach(b=>b.disabled=false);
      }
    }

    async function signedUrl(path){
      const q=await sb.storage.from('kd-messenger').createSignedUrl(path,600);
      if(q.error||!q.data?.signedUrl)throw Error('Не удалось получить доступ к медиа');
      return q.data.signedUrl;
    }

    async function decorate(el){
      if(decorated.has(el)||el.querySelector('.kd-media-ai'))return;
      const id=el.dataset.messageId;
      if(!id)return;
      decorated.add(el);

      const row=await sb.from('kd_messages')
        .select('attachment_path,attachment_type,message_type,attachment_name')
        .eq('id',id)
        .maybeSingle();
      if(row.error){decorated.delete(el);return;}
      const d=row.data;
      if(!d?.attachment_path)return;
      if(!['voice','video_note'].includes(d.message_type)&&!d.attachment_type?.startsWith('image/'))return;

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
            const cacheKey=id+':voice:'+k;
            const text=await cached(cacheKey,async()=>{
              const url=await signedUrl(d.attachment_path);
              const res=await call({
                mode:'transcribe',
                audio_url:url,
                text:k==='summary'?'Расшифруй и кратко перескажи голосовое.':k==='reply'?'Расшифруй голосовое и предложи естественный ответ.':k==='translate'?'Расшифруй голосовое и переведи содержание на русский.':'Точно расшифруй голосовое и расставь знаки препинания.'
              });
              return res.answer||'Нет ответа';
            });
            result(box,text);
            toast('KD AI готов');
          }catch(x){result(box,'Ошибка KD AI: '+x.message);toast('KD AI: ошибка')}
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
            const cacheKey=id+':image:'+k;
            const text=await cached(cacheKey,async()=>{
              const url=await signedUrl(d.attachment_path);
              const r=await fetch(url,{mode:'cors',credentials:'omit'});
              if(!r.ok)throw Error('Не удалось загрузить изображение');
              const b=await r.blob();
              if(b.size>15*1024*1024)throw Error('Изображение слишком большое для AI (максимум 15 МБ)');
              if(!b.type.startsWith('image/'))throw Error('Файл не является изображением');
              const res=await call({
                mode:'vision',
                image_base64:await b64(b),
                mime:b.type,
                text:k==='text'?'Распознай весь видимый текст на изображении. Если текста нет, так и скажи.':'Проанализируй изображение и опиши важные детали.'
              });
              return res.answer||'Нет ответа';
            });
            result(box,text);
            toast('KD AI готов');
          }catch(x){result(box,'Ошибка KD AI: '+x.message);toast('KD AI: ошибка')}
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
          try{
            const url=await signedUrl(d.attachment_path);
            await analyzeVideoFrame(box,url,prompt,id+':video:'+k);
          }catch(x){result(box,'Ошибка KD AI: '+x.message);toast('KD AI: ошибка')}
        };
      }

      el.querySelector('.bubble')?.appendChild(box);
    }

    function scheduleScan(){
      clearTimeout(scanTimer);
      scanTimer=setTimeout(all,180);
    }

    async function all(){
      const items=[...document.querySelectorAll('.msg[data-message-id]')].filter(e=>!decorated.has(e));
      if(!items.length)return;
      await Promise.all(items.map(decorate));
    }

    setTimeout(all,1400);
    new MutationObserver(scheduleScan).observe(document.body,{childList:true,subtree:true});
  },1800);
})();
