(()=>{
'use strict';
// Compatibility adapter: supports the canonical kd_memory schema and the older prototype name.
const U='https://qqofizfqkctycyeafgsa.supabase.co',K='sb_publishable_MTZuMyuzb0XdtBy3GZIQZw_pHbXc9xK';
const sb=window.supabase?.createClient(U,K); if(!sb)return;
window.kdMemoryStore={
 async list(conversationId){
  const {data,error}=await sb.from('kd_memory').select('id,memory,created_at').eq('conversation_id',conversationId).order('created_at',{ascending:false});
  if(!error)return data||[];
  const r=await sb.from('kd_chat_memory').select('id,memory_text,created_at').eq('conversation_id',conversationId).order('created_at',{ascending:false});
  return (r.data||[]).map(x=>({id:x.id,memory:x.memory_text,created_at:x.created_at}));
 },
 async add(conversationId,memory){const {data:u}=await sb.auth.getUser();if(!u?.user)throw Error('auth');const r=await sb.from('kd_memory').insert({user_id:u.user.id,conversation_id:conversationId,memory}).select().single();if(!r.error)return r.data;const q=await sb.from('kd_chat_memory').insert({user_id:u.user.id,conversation_id:conversationId,memory_text:memory});if(q.error)throw q.error;return q.data;},
 async remove(id){let r=await sb.from('kd_memory').delete().eq('id',id);if(!r.error)return;r=await sb.from('kd_chat_memory').delete().eq('id',id);if(r.error)throw r.error;},
 async clear(conversationId){let r=await sb.from('kd_memory').delete().eq('conversation_id',conversationId);if(!r.error)return;r=await sb.from('kd_chat_memory').delete().eq('conversation_id',conversationId);if(r.error)throw r.error;}
};
})();