const chats=[
 {id:'ai',name:'KRIPTODANIK AI',handle:'@kriptodanik_ai',avatar:'KD',tone:'blue',time:'09:41',preview:'Сигнал: BTC/USDT • Лонг зона 26800 → 27000',unread:2,status:'онлайн',verified:true},
 {id:'traders',name:'Трейдеры KD',handle:'102 участника',avatar:'TK',tone:'green',time:'09:35',preview:'Артём: Забрал профит по BTC ✅',unread:12,status:'26 онлайн',group:true},
 {id:'maria',name:'Мария',handle:'@maria',avatar:'М',tone:'pink',time:'09:21',preview:'📷 Фото',unread:0,status:'была недавно'},
 {id:'team',name:'KD Team',handle:'@kd_team',avatar:'KD',tone:'',time:'09:15',preview:'Обновление системы будет сегодня',unread:0,status:'5 участников',group:true},
 {id:'vlad',name:'Владимир',handle:'@vlad',avatar:'В',tone:'green',time:'08:42',preview:'🎤 Голосовое сообщение',unread:0,status:'онлайн'}
];
const defaultMessages={ai:[
 {id:1,side:'in',text:'Привет! Есть минутка?',time:'09:38'},
 {id:2,side:'out',text:'Привет! Конечно. Что случилось?',time:'09:39'},
 {id:3,side:'in',text:'Посмотри BTC. Кажется, формируется хороший вход.',time:'09:39'},
 {id:4,side:'out',text:'Вижу. Жду подтверждение и не лезу раньше времени 👌',time:'09:40',read:true},
 {id:5,side:'in',text:'Согласен. Тогда держим зону под наблюдением.',time:'09:41'}
],traders:[{id:10,side:'in',text:'🔥 Забрал профит по BTC',time:'09:28'},{id:11,side:'in',text:'Отличная сделка, я тоже зафиксировал часть.',time:'09:29'},{id:12,side:'out',text:'Красиво. Главное — не отдавать профит обратным входом 😄',time:'09:30',read:true}],maria:[{id:20,side:'in',text:'Смотри, что нашла 😄',time:'09:21'}],team:[{id:30,side:'in',text:'Обновление системы будет сегодня в 23:00.',time:'09:15'}],vlad:[{id:40,side:'in',text:'Записал голосовое, послушай когда будет время.',time:'08:42'}]};
let active=localStorage.getItem('kd_active_chat')||'ai';
let state=JSON.parse(localStorage.getItem('kd_demo_messages')||'null')||structuredClone(defaultMessages);
let pinned=JSON.parse(localStorage.getItem('kd_pinned')||'[]');
const $=s=>document.querySelector(s), chatList=$('#chatList'),messages=$('#messages'),input=$('#messageInput'),typing=$('#typing'),toast=$('#toast');
const timeNow=()=>new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
function save(){localStorage.setItem('kd_demo_messages',JSON.stringify(state));localStorage.setItem('kd_active_chat',active);localStorage.setItem('kd_pinned',JSON.stringify(pinned));}
function escapeHtml(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#92;'}[c]));}
function renderChats(filter=''){
 chatList.innerHTML='';
 const list=[...chats].sort((a,b)=>(pinned.includes(b.id)?1:0)-(pinned.includes(a.id)?1:0));
 list.filter(c=>(c.name+' '+c.handle+' '+c.preview).toLowerCase().includes(filter.toLowerCase())).forEach(c=>{
  const el=document.createElement('div');el.className='chat '+(c.id===active?'active':'');el.dataset.id=c.id;
  el.innerHTML=`<div class="chat-avatar ${c.tone}">${c.avatar}${c.verified?'<span class="verified">✓</span>':''}</div><div class="chat-copy"><b>${escapeHtml(c.name)}${pinned.includes(c.id)?'  📌':''}</b><p>${escapeHtml(c.preview)}</p></div><div class="chat-meta"><time>${c.time}</time>${c.unread?`<span class="unread">${c.unread}</span>`:''}</div>`;
  el.onclick=()=>selectChat(c.id);el.oncontextmenu=e=>{e.preventDefault();togglePin(c.id)};chatList.appendChild(el);
 });
 $('#unreadCount').textContent=chats.reduce((n,x)=>n+x.unread,0)||'';
}
function renderMessages(){
 const c=chats.find(x=>x.id===active), list=state[active]||[];
 messages.innerHTML='<div class="day-divider">СЕГОДНЯ</div>'+list.map(m=>`<div class="msg ${m.side}" data-msg="${m.id}"><div class="bubble-wrap"><div class="bubble">${escapeHtml(m.text)}</div>${m.reaction?`<button class="reaction" data-reaction="${m.id}">❤️ ${m.reaction}</button>`:''}</div><div class="msg-meta">${m.time}${m.side==='out'?`  <span class="checks">✓✓</span>`:''}</div></div>`).join('');
 messages.scrollTop=messages.scrollHeight;
 $('#headerName').textContent=c.name;$('#headerStatus').textContent=c.status;$('#infoName').textContent=c.name;$('#infoHandle').textContent=c.handle;
 $('#profileDescription').textContent=c.group?'Группа KD • рабочее пространство':'Трейдинг • аналитика • KD Intelligence';
 messages.querySelectorAll('.bubble').forEach(b=>b.addEventListener('dblclick',()=>{const id=Number(b.closest('.msg').dataset.msg);react(id)}));
}
function selectChat(id){active=id;const c=chats.find(x=>x.id===id);c.unread=0;renderChats($('#chatSearch').value);renderMessages();save();if(innerWidth<=720)$('#sidebar').classList.remove('open');}
function showToast(text){toast.textContent=text;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1800)}
function togglePin(id){pinned.includes(id)?pinned=pinned.filter(x=>x!==id):pinned.push(id);renderChats($('#chatSearch').value);save();showToast(pinned.includes(id)?'Чат закреплён 📌':'Чат откреплён')}
function react(id){const msg=(state[active]||[]).find(m=>m.id===id);if(!msg)return;msg.reaction=(msg.reaction||0)+1;renderMessages();save();showToast('Реакция добавлена ❤️')}
function sendMessage(text){if(!text)return;const msg={id:Date.now(),side:'out',text,time:timeNow(),read:true};(state[active]??=[]).push(msg);const c=chats.find(x=>x.id===active);c.preview=text;c.time=msg.time;input.value='';renderMessages();renderChats($('#chatSearch').value);save();typing.hidden=false;setTimeout(()=>{typing.hidden=true;const replies=['Принял 👍','Ок, смотрю.','Хорошая идея.','Давай обсудим вечером.'];const reply={id:Date.now()+1,side:'in',text:replies[Math.floor(Math.random()*replies.length)],time:timeNow()};state[active].push(reply);c.preview=reply.text;c.time=reply.time;renderMessages();renderChats($('#chatSearch').value);save()},850)}
$('#composer').addEventListener('submit',e=>{e.preventDefault();sendMessage(input.value.trim())});
$('#chatSearch').addEventListener('input',e=>renderChats(e.target.value));
$('#themeBtn').onclick=()=>{document.body.classList.toggle('light');localStorage.setItem('kd_theme',document.body.classList.contains('light')?'light':'dark');showToast(document.body.classList.contains('light')?'Светлая тема':'Тёмная тема')};
$('#newChat').onclick=()=>showToast('Поиск пользователей подключим после backend');
$('#attach').onclick=()=>showToast('Фото, файлы и голосовые — следующий этап');
$('#emoji').onclick=()=>{input.value+='🙂';input.focus()};
$('#profileBtn').onclick=()=>showToast('Профиль KD — следующий этап');
$('#openSidebar').onclick=()=>$('#sidebar').classList.add('open');$('#closeSidebar').onclick=()=>$('#sidebar').classList.remove('open');
['.top-actions .icon-btn:first-child','.top-actions .icon-btn:nth-child(2)','.top-actions .icon-btn:nth-child(3)'].forEach((sel,i)=>$(sel)?.addEventListener('click',()=>showToast(['Звонки подключим после backend','Поиск в чате — следующий этап','Меню чата — следующий этап'][i])));
document.querySelectorAll('.side-tabs button').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.side-tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');showToast(btn.dataset.tab==='chats'?'Чаты':btn.dataset.tab==='calls'?'Звонки':'Контакты')});
if(localStorage.getItem('kd_theme')==='light')document.body.classList.add('light');
renderChats();renderMessages();
