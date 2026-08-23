(() => {
  const $ = id => document.getElementById(id);
  const overlay=$('kdAuthOverlay'), accountBtn=$('kdAccountButton'), close=$('kdAuthClose');
  const loginForm=$('kdLoginForm'), signupForm=$('kdSignupForm'), accountPanel=$('kdAccountPanel'), error=$('kdAuthError');
  let me=null;
  const planLabel = u => u?.pro_active ? 'PRO' : (u?.trial_active ? 'FREE' : 'FREE EXPIRED');
  const planDetail = u => u?.pro_active ? (u?.pro_until ? `Pro до ${new Date(u.pro_until).toLocaleDateString('ru-RU')}` : 'PRO активен') : (u?.trial_active ? `FREE · осталось ${u.trial_days_left} дн.` : 'Free trial завершён');

  function ensureAdminShortcut(isAdmin){
    const bottom=document.querySelector('.sidebar-bottom'); if(!bottom) return;
    let btn=document.getElementById('kdAdminShortcut');
    if(isAdmin){
      if(!btn){
        btn=document.createElement('a'); btn.id='kdAdminShortcut'; btn.href='/admin/';
        btn.innerHTML='<span class="kd-admin-shortcut-icon">♛</span><span>ADMIN</span><span class="kd-admin-shortcut-arrow">›</span>';
        const style=document.createElement('style'); style.id='kdAdminShortcutStyles'; style.textContent=`
          #kdAdminShortcut{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin:0 0 10px;padding:11px 12px;border:1px solid rgba(168,85,247,.42);border-radius:12px;background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(245,158,11,.08));color:#e9d5ff;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:.08em;transition:.2s ease}
          #kdAdminShortcut:hover{transform:translateY(-1px);border-color:rgba(192,132,252,.75);background:linear-gradient(135deg,rgba(124,58,237,.28),rgba(245,158,11,.12))}.kd-admin-shortcut-icon{font-size:17px;color:#fbbf24;line-height:1}.kd-admin-shortcut-arrow{margin-left:auto;font-size:20px;color:#c4b5fd;line-height:1}`;
        document.head.appendChild(style); const account=bottom.querySelector('#kdAccountButton'); if(account) bottom.insertBefore(btn,account); else bottom.prepend(btn);
      }
      btn.hidden=false;
    }else if(btn) btn.hidden=true;
  }

  function injectPlanInfo(){
    if(!signupForm || document.getElementById('kdPlanInfo')) return;
    const box=document.createElement('div'); box.id='kdPlanInfo';
    box.innerHTML=`<div class="kd-plan-card">
      <div class="kd-plan-head"><span class="kd-plan-badge">FREE</span><strong>21 дней полного доступа</strong></div>
      <p>Начни бесплатно и получи полный доступ к KriptoDanik AI на время пробного периода.</p>
      <div class="kd-plan-divider"></div>
      <div class="kd-plan-head"><span class="kd-plan-badge kd-pro">PRO</span><strong>4,99 $ / месяц</strong></div>
      <p>После 21 дней все твои данные, журнал, настройки и история сохраняются и продолжаются в PRO.</p>
      <p class="kd-plan-note">PRO помогает оплачивать AI-инфраструктуру OpenAI, поддержку сервиса и дальнейшее развитие KriptoDanik AI — чтобы AI Coach мог работать в полноценном режиме.</p>
      <div class="kd-plan-features"><span>✓ AI Coach</span><span>✓ Журнал и аналитика</span><span>✓ PRO-инструменты</span></div>
    </div>`;
    const submit=signupForm.querySelector('button[type="submit"],input[type="submit"]'); if(submit) signupForm.insertBefore(box,submit); else signupForm.appendChild(box);
    const style=document.createElement('style'); style.id='kdPlanInfoStyles'; style.textContent=`
      #kdPlanInfo{margin:14px 0 16px}.kd-plan-card{padding:16px;border:1px solid rgba(139,92,246,.35);border-radius:18px;background:linear-gradient(145deg,rgba(139,92,246,.12),rgba(255,255,255,.025));color:#fff}.kd-plan-head{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px}.kd-plan-badge{display:inline-flex;align-items:center;padding:5px 9px;border-radius:999px;background:rgba(139,92,246,.2);color:#c4b5fd;font-size:11px;font-weight:800;letter-spacing:.08em}.kd-plan-badge.kd-pro{background:rgba(245,158,11,.15);color:#fbbf24}.kd-plan-card p{margin:8px 0;color:#b8b8c2;font-size:13px;line-height:1.45}.kd-plan-divider{height:1px;background:rgba(255,255,255,.08);margin:13px 0}.kd-plan-note{font-size:12px!important;color:#9696a3!important}.kd-plan-features{display:flex;flex-wrap:wrap;gap:7px;margin-top:11px}.kd-plan-features span{font-size:11px;padding:6px 8px;border-radius:9px;background:rgba(255,255,255,.055);color:#d6d3e8}`;
    document.head.appendChild(style);
  }

  function injectTrialBadge(u){
    let badge=document.getElementById('kdTrialBadge');
    if(!badge){
      badge=document.createElement('div'); badge.id='kdTrialBadge';
      const style=document.createElement('style'); style.id='kdTrialBadgeStyles'; style.textContent=`#kdTrialBadge{display:flex;align-items:center;gap:8px;margin:0 0 10px;padding:9px 11px;border:1px solid rgba(168,85,247,.32);border-radius:11px;background:linear-gradient(135deg,rgba(139,92,246,.13),rgba(255,255,255,.025));color:#cfc7e8;font-size:11px;line-height:1.35}#kdTrialBadge b{color:#d9b7ff}#kdTrialBadge .kd-trial-dot{width:7px;height:7px;border-radius:50%;background:#a855f7;box-shadow:0 0 10px #a855f7;flex:none}#kdTrialBadge.expired{border-color:rgba(245,158,11,.32)}#kdTrialBadge.expired .kd-trial-dot{background:#fbbf24;box-shadow:0 0 10px #fbbf24}`;
      document.head.appendChild(style); const bottom=document.querySelector('.sidebar-bottom'); const account=bottom?.querySelector('#kdAccountButton'); if(bottom&&account) bottom.insertBefore(badge,account); else if(bottom) bottom.prepend(badge);
    }
    if(!u){badge.hidden=true;return;} badge.hidden=false; badge.classList.toggle('expired',!u.trial_active&&!u.pro_active);
    badge.innerHTML=u.pro_active?'<span class="kd-trial-dot"></span><span><b>PRO</b> активен</span>':u.trial_active?`<span class="kd-trial-dot"></span><span><b>FREE</b> · ${u.trial_days_left} дн. осталось</span>`:'<span class="kd-trial-dot"></span><span><b>FREE</b> trial завершён · доступно PRO';
  }

  function syncAppProfile(u){
    try{const App=window.App;if(!App||!u)return;const identity=u.username||u.name||u.email?.split('@')[0]||'Трейдер';App.userData={...(App.userData||{}),name:identity,username:u.username||identity,email:u.email||'',plan:planLabel(u),memberSince:u.created_at?new Date(u.created_at).toLocaleDateString('ru-RU'):(App.userData?.memberSince||''),trialDaysLeft:u.trial_days_left,freeUntil:u.free_until};if(!App.onboardingDone&&App.onboardingOverlay){if(App.onboardingName)App.onboardingName.value=identity;if(typeof App.goToWizardStep==='function')App.goToWizardStep(2);App.onboardingOverlay.classList.add('active');App.saveState?.();}else App.applyUserData?.();}catch(e){console.warn('Could not sync account with Trading Profile:',e);}
  }

  function showTradingProfileAfterAuth(u){
    try{
      const App=window.App;
      if(!App || App.onboardingDone) return;
      const identity=u?.username||u?.name||u?.email?.split('@')[0]||'Трейдер';
      // Nickname is collected during registration. Never ask for it again.
      if(App.onboardingName) App.onboardingName.value=identity;
      if(App.onboardingOverlay){
        App.onboardingOverlay.classList.add('active');
        if(typeof App.goToWizardStep==='function') App.goToWizardStep(2);
      }else if(typeof App.showOnboarding==='function'){
        App.showOnboarding();
        if(App.onboardingName) App.onboardingName.value=identity;
        if(typeof App.goToWizardStep==='function') App.goToWizardStep(2);
      }
    }catch(e){console.warn('Could not open Trading Profile onboarding:',e);}
  }

  function open(){
    if(!overlay) return;
    const onboarding=$('onboardingOverlay');
    const coach=$('coachTourOverlay');
    if(onboarding) onboarding.classList.remove('active');
    if(coach){coach.classList.remove('active');coach.setAttribute('aria-hidden','true');}
    overlay.hidden=false; document.body.classList.add('kd-auth-open'); error.textContent=''; injectPlanInfo();
    if(me){loginForm.hidden=true;signupForm.hidden=true;accountPanel.hidden=false;$('kdAuthTitle').textContent='Твой аккаунт';$('kdPanelPlan').textContent=planLabel(me);$('kdPanelUntil').textContent=planDetail(me);const up=$('kdUpgradeButton');if(up){up.hidden=!!me.pro_active;up.textContent=me.trial_active?'Перейти на PRO · 4,99 $':'Подключить PRO · 4,99 $';}}else{
      const firstVisit=!localStorage.getItem('kd_auth_seen');
      loginForm.hidden=firstVisit;
      signupForm.hidden=!firstVisit;
      accountPanel.hidden=true;
      document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===(firstVisit?'signup':'login')));
      $('kdAuthTitle').textContent=firstVisit?'Регистрация в KriptoDanik AI':'Вход в KriptoDanik AI';
      $('kdAuthSubtitle').textContent=firstVisit?'Создай аккаунт, чтобы открыть торговый профиль и получить 21 день полного доступа.':'Войди, чтобы открыть свой торговый профиль.';
    }
  }
  function closeModal(){if(!overlay)return;overlay.hidden=true;document.body.classList.remove('kd-auth-open');}
  function update(u){
    me=u||null; const name=u?.username||u?.name||u?.email?.split('@')[0]||'Гость';
    $('kdAccountName').textContent=name;$('kdAccountPlan').textContent=planLabel(u);$('kdAccountAvatar').textContent=name[0].toUpperCase();$('kdAccountAvatar').classList.toggle('pro',u?.pro_active);
    const badge=document.getElementById('settingsPlan');if(badge){badge.textContent=planLabel(u);badge.classList.toggle('badge-pro',u?.pro_active);}const p=document.getElementById('settingsEmail');if(p)p.textContent=u?.email||'—';const n=document.getElementById('settingsUsername');if(n)n.textContent=name;const ms=document.getElementById('settingsMemberSince');if(ms)ms.textContent=u?.created_at?new Date(u.created_at).toLocaleDateString('ru-RU'):'—';const av=document.getElementById('settingsAvatar');if(av)av.textContent=name[0].toUpperCase();
    ensureAdminShortcut(Boolean(u?.is_admin));injectTrialBadge(u);if(u)syncAppProfile(u);
  }

  async function call(action,method='GET',body){const r=await fetch(`/api/auth?action=${action}`,{method,headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,credentials:'same-origin',cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Ошибка авторизации');return d;}
  async function billing(action,body){const r=await fetch(`/api/billing?action=${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{}),credentials:'same-origin',cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Ошибка оплаты');return d;}

  async function startCheckout(){
    const up=$('kdUpgradeButton'); if(up){up.disabled=true;up.textContent='Переходим к оплате…';}
    error.textContent='';
    try{const d=await billing('checkout');if(d.active){update(me);open();return;}if(!d.checkout_url)throw new Error('Не удалось создать платёжную сессию.');window.location.href=d.checkout_url;}
    catch(e){error.textContent=e.message; if(up){up.disabled=false;up.textContent=me?.trial_active?'Перейти на PRO · 4,99 $':'Подключить PRO · 4,99 $';}}
  }

  async function confirmCheckoutFromUrl(){
    const params=new URLSearchParams(window.location.search);const status=params.get('billing');const sessionId=params.get('session_id');
    if(status==='cancelled'){history.replaceState({},'',window.location.pathname);return;}
    if(status!=='success'||!sessionId)return;
    try{const d=await billing('confirm',{session_id:sessionId});if(d.user){update(d.user);open();error.textContent='🎉 PRO активирован. Все твои данные и история сохранены.';}}
    catch(e){open();error.textContent=`Оплата прошла, но подтверждение ещё не получено: ${e.message}`;}
    history.replaceState({},'',window.location.pathname);
  }

  accountBtn?.addEventListener('click',open);close?.addEventListener('click',closeModal);overlay?.addEventListener('click',e=>{if(e.target===overlay)closeModal();});
  document.querySelectorAll('[data-auth-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b===btn));const signup=btn.dataset.authTab==='signup';loginForm.hidden=signup;signupForm.hidden=!signup;accountPanel.hidden=true;error.textContent='';$('kdAuthTitle').textContent=signup?'Регистрация в KriptoDanik AI':'Вход в KriptoDanik AI';$('kdAuthSubtitle').textContent=signup?'Создай аккаунт, чтобы открыть торговый профиль и получить 21 день полного доступа.':'Войди, чтобы открыть свой торговый профиль.';if(signup)injectPlanInfo();}));
  loginForm?.addEventListener('submit',async e=>{e.preventDefault();error.textContent='';const fd=new FormData(loginForm);try{const d=await call('login','POST',Object.fromEntries(fd));localStorage.setItem('kd_auth_seen','1');update(d.user);closeModal();showTradingProfileAfterAuth(d.user);}catch(x){error.textContent=x.message;}});
  signupForm?.addEventListener('submit',async e=>{e.preventDefault();error.textContent='';const usernameInput=$('kdSignupUsername');const nameInput=$('kdSignupName');if(usernameInput&&nameInput)nameInput.value=usernameInput.value.trim();const fd=new FormData(signupForm);try{const d=await call('signup','POST',Object.fromEntries(fd));localStorage.setItem('kd_auth_seen','1');update(d.user);closeModal();showTradingProfileAfterAuth(d.user);}catch(x){error.textContent=x.message;}});
  $('kdLogoutButton')?.addEventListener('click',async()=>{try{await call('logout','POST',{});}catch{}update(null);closeModal();if(overlay){open();}});
  $('kdUpgradeButton')?.addEventListener('click',startCheckout);
  injectPlanInfo();

  // First visit: authentication is the real entry point again.
  // The account modal contains both Войти and Регистрация. Only after a
  // successful login/registration do we open the Trading Profile onboarding.
  (async()=>{
    try{
      const d=await call('me');
      if(d.user){
        update(d.user);
        await confirmCheckoutFromUrl();
        showTradingProfileAfterAuth(d.user);
      }else{
        update(null);
        await confirmCheckoutFromUrl();
        open();
      }
    }catch{
      update(null);
      await confirmCheckoutFromUrl();
      open();
    }
  })();
})();
