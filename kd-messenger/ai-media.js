(()=>{
  const CDN='https://cdn.jsdelivr.net/gh/karasev599-ship-it/KD-intelligence-AI@c524e436b4a1b68a29b4dde3032c92361626a3ab/kd-messenger/ai-media.js';
  const URL='https://qqofizfqkctycyeafgsa.supabase.co';
  const KEY=atob('c2JfcHVibGlzaGFibGVfTVRadU15dXpiMFhkdEJ5M0daSVFad19wSGJYYzl4Sw==');
  const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  const boot=async()=>{
    try{
      if(window.supabase&&!window.__KD_SUPABASE_CLIENT__)window.__KD_SUPABASE_CLIENT__=window.supabase.createClient(URL,KEY);
      await load(CDN);
      await load('./kd-messenger/profile-stories.js?v=1');
    }catch(e){console.error('KD Messenger modules failed to load',e)}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
