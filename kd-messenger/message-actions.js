(()=>{
  if(window.__KD_MESSAGE_ACTIONS__)return;
  const waitForClient=(tries=0)=>{
    const client=window.__KD_SUPABASE_CLIENT__;
    if(!client){if(tries<40)setTimeout(()=>waitForClient(tries+1),250);else console.error('KD message actions: Supabase client not ready');return}
    window.__KD_MESSAGE_ACTIONS__=true;
    init(client);
  };
  const init=client=>{
  const STYLE=`
  .kd-msg-actions-menu{position:fixed;z-index:100000;min-width:190px;padding:6px;border:1px solid rgba(255,255,255,.12);border-radius:12px;background:rgba(25,23,34,.98);box-shadow:0 16px 48px rgba(0,0,0,.4);backdrop-filter:blur(16px);font:600 13px system-ui,sans-serif}
  .kd-msg-actions-menu button{display:block;width:100%;padding:10px 12px;border:0;border-radius:8px;background:transparent;color:#fff;text-align:left;cursor:pointer}
  .kd-msg-actions-menu button:hover{background:rgba(255,255,255,.08)}
  .kd-msg-actions-menu button.danger{color:#ff8f9b}
  .kd-msg-deleted{opacity:.58!important;filter:saturate(.35)}
  .kd-msg-deleted .kd-msg-deleted-label{display:block!important}
  .kd-msg-deleted-label{display:none;margin-top:4px;font-size:11px;font-style:italic;color:#aaa}
  `;
  let style=document.getElementById('kd-message-actions-css');
  if(!style){style=document.createElement('style');style.id='kd-message-actions-css';style.textContent=STYLE;document.head.appendChild(style)}

  let menu=null,longPressTimer=null,longPressTarget=null;
  const getId=el=>el?.dataset?.messageId||el?.closest?.('[data-message-id]')?.dataset?.messageId||null;
  const getNode=id=>document.querySelector(`[data-message-id="${CSS.escape(String(id))}"]`);
  const markDeleted=(id,label='Сообщение удалено')=>{
    const el=getNode(id);if(!el)return;
    el.classList.add('kd-msg-deleted');
    let l=el.querySelector('.kd-msg-deleted-label');
    if(!l){l=document.createElement('div');l.className='kd-msg-deleted-label';el.appendChild(l)}
    l.textContent=label;
    [...el.querySelectorAll('img,video,audio,iframe')].forEach(x=>{if(x.tagName==='IFRAME')x.remove();else{x.removeAttribute('src');x.style.display='none'}});
  };
  const ensureDeletedLabel=el=>{if(!el?.matches?.('[data-message-id]'))return;if(!el.querySelector('.kd-msg-deleted-label')){const l=document.createElement('div');l.className='kd-msg-deleted-label';el.appendChild(l)}};
  const clearLongPress=()=>{if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null}longPressTarget=null};
  const closeMenu=()=>{if(menu){menu.remove();menu=null}};
  const toast=msg=>{let t=document.getElementById('kd-delete-toast');if(!t){t=document.createElement('div');t.id='kd-delete-toast';Object.assign(t.style,{position:'fixed',left:'50%',bottom:'24px',transform:'translateX(-50%)',zIndex:'100001',padding:'10px 14px',borderRadius:'10px',background:'rgba(20,20,28,.96)',color:'#fff',font:'600 13px system-ui',boxShadow:'0 10px 30px rgba(0,0,0,.3)'});document.body.appendChild(t)}t.textContent=msg;t.style.display='block';clearTimeout(t.__timer);t.__timer=setTimeout(()=>t.style.display='none',2200)};
  const session=async()=>{const r=await client.auth.getSession();return r?.data?.session||null};
  const fetchMessage=async id=>{const r=await client.from('kd_messages').select('id,sender_id,conversation_id,deleted_at,deleted_for_sender,deleted_for_recipient,attachment_path').eq('id',id).maybeSingle();return r.error?null:r.data};

  const deleteForMe=async id=>{
    const s=await session();if(!s)throw new Error('Необходима авторизация');
    const r=await client.from('kd_message_deletions').upsert({user_id:s.user.id,message_id:id},{onConflict:'user_id,message_id'});
    if(r.error)throw r.error;
    markDeleted(id,'Сообщение удалено у вас');
  };
  const deleteForEveryone=async id=>{
    const s=await session();if(!s)throw new Error('Необходима авторизация');
    const msg=await fetchMessage(id);if(!msg)throw new Error('Сообщение уже удалено');
    if(String(msg.sender_id)!==String(s.user.id))throw new Error('Удалять у всех может только автор сообщения');
    const attachmentPath=msg.attachment_path;const r=await client.from('kd_messages').update({deleted_at:new Date().toISOString(),body:null,attachment_url:null,attachment_name:null,attachment_path:null}).eq('id',id).eq('sender_id',s.user.id);
    if(r.error)throw r.error;
    if(attachmentPath){const d=await client.storage.from('kd-messenger').remove([attachmentPath]);if(d.error)console.warn('KD message attachment cleanup:',d.error.message)}
    markDeleted(id,'Сообщение удалено у всех');
  };

  const openMenu=(target,x,y)=>{
    closeMenu();const id=getId(target);if(!id)return;
    const run=async(fn,label)=>{closeMenu();try{await fn(id);toast(label)}catch(e){console.error('KD message delete:',e);toast(e?.message||'Не удалось удалить сообщение')}};
    menu=document.createElement('div');menu.className='kd-msg-actions-menu';
    const msg=target.closest('[data-message-id]')||target;
    const sender=msg.dataset.senderId||msg.dataset.userId||msg.dataset.authorId;
    const s=window.__KD_MESSAGE_ACTIONS_SESSION__;
    const add=(text,fn,cls)=>{const b=document.createElement('button');b.textContent=text;if(cls)b.className=cls;b.onclick=fn;menu.appendChild(b)};
    add('Удалить у меня',()=>run(deleteForMe,'Сообщение удалено у вас'));
    if(!s||!sender||String(sender)===String(s.user.id))add('Удалить у всех',()=>run(deleteForEveryone,'Сообщение удалено у всех'),'danger');
    document.body.appendChild(menu);
    const w=innerWidth,h=innerHeight,r=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(x,w-r.width-8))+'px';menu.style.top=Math.max(8,Math.min(y,h-r.height-8))+'px';
  };

  const hydrate=async()=>{
    const s=await session();window.__KD_MESSAGE_ACTIONS_SESSION__=s;
    if(!s)return;
    const r=await client.from('kd_message_deletions').select('message_id').eq('user_id',s.user.id);
    if(!r.error)(r.data||[]).forEach(x=>markDeleted(x.message_id,'Сообщение удалено у вас'));
    document.querySelectorAll('[data-message-id]').forEach(ensureDeletedLabel);
  };

  const bind=()=>{
    if(window.__KD_MESSAGE_ACTIONS_BOUND__)return;window.__KD_MESSAGE_ACTIONS_BOUND__=true;
    document.addEventListener('contextmenu',e=>{const msg=e.target.closest?.('[data-message-id]');if(!msg)return;e.preventDefault();openMenu(msg,e.clientX,e.clientY)},{passive:false});
    document.addEventListener('pointerdown',e=>{
      const msg=e.target.closest?.('[data-message-id]');
      if(!msg||e.pointerType!=='touch')return;
      clearLongPress();longPressTarget=msg;
      longPressTimer=setTimeout(()=>{if(longPressTarget===msg)openMenu(msg,e.clientX,e.clientY);clearLongPress()},550);
    },{passive:true});
    document.addEventListener('pointerup',clearLongPress,{passive:true});
    document.addEventListener('pointercancel',clearLongPress,{passive:true});
    document.addEventListener('pointermove',e=>{if(!longPressTarget||e.pointerType!=='touch')return;if(Math.abs(e.movementX)>8||Math.abs(e.movementY)>8)clearLongPress()},{passive:true});
    document.addEventListener('scroll',clearLongPress,{passive:true,capture:true});
    document.addEventListener('click',e=>{if(menu&&!e.target.closest('.kd-msg-actions-menu'))closeMenu()},{passive:true});
    new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(node.nodeType!==1)continue;
          ensureDeletedLabel(node);
          node.querySelectorAll?.('[data-message-id]').forEach(ensureDeletedLabel);
        }
      }
    }).observe(document.body,{childList:true,subtree:true});
  };

  const realtime=()=>{
    const ch=client.channel('kd-message-deletion-sync')
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'kd_messages'},p=>{if(p.new?.id&&p.new?.deleted_at)markDeleted(p.new.id,'Сообщение удалено у всех')})
      .on('postgres_changes',{event:'INSERT',schema:'public',table:'kd_message_deletions'},p=>{if(p.new?.user_id&&window.__KD_MESSAGE_ACTIONS_SESSION__?.user?.id===p.new.user_id)markDeleted(p.new.message_id,'Сообщение удалено у вас')})
      .subscribe();
    window.__KD_MESSAGE_ACTIONS_CHANNEL__=ch;
  };

  const boot=async()=>{bind();await hydrate();realtime()};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.KDMessageActions={deleteForMe,deleteForEveryone,refresh:hydrate};
  };
  waitForClient();
})();