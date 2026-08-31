const chats=[
 {id:'ai',name:'KRIPTODANIK AI',handle:'@kriptodanik_ai',avatar:'KD',tone:'blue',time:'09:41',preview:'Сигнал: BTC/USDT • Лонг зона 26800 → 27000',unread:2,status:'онлайн'},
 {id:'traders',name:'Трейдеры KD',handle:'102 участника',avatar:'TK',tone:'green',time:'09:35',preview:'Артём: Забрал профит по BTC ✅',unread:12,status:'26 онлайн'},
 {id:'maria',name:'Мария',handle:'@maria',avatar:'М',tone:'pink',time:'09:21',preview:'📷 Фото',unread:0,status:'была недавно'},
 {id:'team',name:'KD Team',handle:'@kd_team',avatar:'KD',tone:'',time:'09:15',preview:'Обновление системы будет сегодня',unread:0,status:'5 участников'},
 {id:'vlad',name:'Владимир',handle:'@vlad',avatar:'В',tone:'green',time:'08:42',preview:'🎤 Голосовое сообщение',unread:0,status:'онлайн'}
];
const baseMessages={ai:[
 {side:'in',text:'Привет! Есть минутка?',time:'09:38'},
 {side:'out',text:'Привет! Конечно. Что случилось?',time:'09:39'},
 {side:'in',text:'Посмотри BTC. Кажется, формируется хороший вход.',time:'09:39'},
 {side:'out',text:'Вижу. Жду подтверждение и не лезу раньше времени 👌',time:'09:40'},
 {side:'in',text:'Согласен. Тогда держим зону под наблюдением.',time:'09:41'}
],traders:[{side:'in',text:'🔥 Забрал профит по BTC',time:'09:28'},{side:'in',text:'Отличная сделка, я тоже зафиксировал часть.',time:'09:29'},{side:'out',text:'Красиво. Главное — не отдавать профит обратным входом 😄',time:'09:30'}],maria:[{side:'in',text:'Смотри, что нашла 😄',time:'09:21'}],team:[{side:'in',text:'Обновление системы будет сегодня в 23:00.',time:'09:15'}],vlad:[{side:'in',text:'Записал голосовое, послушай когда будет время.',time:'08:42'}]};
let active='ai';
const $=s=>document.querySelector(s);
const chatList=$('#chatList'),messages=$('#messages'),input=$('#messageInput'),typing=$('#typing'),toast=$('#toast');
function escapeHtml(s){return s.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\\':'&#92;'}[c]));}
function renderChats(filter=''){chatList.innerHTML='';chats.filter(c=>(c.name+c.handle+c.preview).toLowerCase().includes(filter.toLowerCase())).forEach(c=>{const el=document.createElement('div');el.className='chat '+(c.id===active?'active':'');el.dataset.id=c.id;el.innerHTML=`<div class="chat-avatar ${c.tone}">${c.avatar}</div><div class="chat-copy"><b>${c.name}</b><p>${c.preview}</p></div><div class="chat-meta"><time>${c.time}</time>${c.unread?`<span class="unread">${c.unread}</span>`:''}</div>`;el.onclick=()=>selectChat(c.id);chatList.appendChild(el)})}
function renderMessages(){const c=chats.find(x=>x.id===active);const list=baseMessages[active]||[];messages.innerHTML='<div class="day-divider">СЕГОДНЯ</div>'+list.map(m=>`<div class="msg ${m.side}"><div class="bubble">${escapeHtml(m.text)}</div><div class="msg-meta">${m.time}${m.side==='out'?'  ✓✓':''}</div></div>`).join('');messages.scrollTop=messages.scrollHeight;$('#headerName').textContent=c.name;$('#headerStatus').textContent=c.status;$('#infoName').textContent=c.name;$('#infoHandle').textContent=c.handle}
function selectChat(id){active=id;const c=chats.find(x=>x.id===id);c.unread=0;renderChats($('#chatSearch').value);renderMessages();$('#unreadCount').textContent=chats.reduce((n,x)=>n+x.unread,0)||'';if(innerWidth<=720)$('#sidebar').classList.remove('open')}
function showToast(text){toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),1800)}
$('#composer').addEventListener('submit',e=>{e.preventDefault();const text=input.value.trim();if(!text)return;(baseMessages[active]??=[]).push({side:'out',text,time:new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})});input.value='';renderMessages();typing.hidden=false;setTimeout(()=>{typing.hidden=true;const replies=['Принял 👍','Ок, смотрю.','Хорошая идея.','Давай обсудим вечером.'];baseMessages[active].push({side:'in',text:replies[Math.floor(Math.random()*replies.length)],time:new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})});renderMessages()},900)});
$('#chatSearch').addEventListener('input',e=>renderChats(e.target.value));
$('#themeBtn').onclick=()=>{document.body.classList.toggle('light');showToast(document.body.classList.contains('light')?'Светлая тема':'Тёмная тема')};
$('#newChat').onclick=()=>showToast('Новый чат — подключим поиск пользователей в следующем этапе');
$('#attach').onclick=()=>showToast('Вложения — следующий этап');
$('#emoji').onclick=()=>{input.value+='🙂';input.focus()};
$('#profileBtn').onclick=()=>showToast('Настройки профиля — следующий этап');
$('#openSidebar').onclick=()=>$('#sidebar').classList.add('open');$('#closeSidebar').onclick=()=>$('#sidebar').classList.remove('open');
$('#send').addEventListener('mousedown',()=>input.focus());
document.querySelectorAll('.side-tabs button').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.side-tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');showToast(btn.dataset.tab==='chats'?'Чаты':btn.dataset.tab==='calls'?'Звонки':'Контакты')});
renderChats();renderMessages();
