
(() => {
  const items = [
    { label: 'Overview', icon: 'lucide:layout-dashboard', route: '/overview' },
    { label: 'Workspace', icon: 'lucide:list-checks', route: '/my-workspace' },
    { label: 'CRM', icon: 'lucide:briefcase', route: '/crm-sales' },
    { label: 'Finance', icon: 'lucide:wallet', route: '/finance' },
    { label: 'Menu', icon: 'lucide:menu' }
  ];
  const nav = document.createElement('nav');
  nav.className = 'app-tabbar';
  nav.setAttribute('aria-label', 'Navigasi utama');
  nav.innerHTML = items.map((it) => '<button type="button" class="app-tabbar__item" ' + (it.route ? ('data-route="' + it.route + '"') : 'data-menu="1"') + '><iconify-icon noobserver icon="' + it.icon + '" aria-hidden="true"></iconify-icon><span>' + it.label + '</span></button>').join('');
  document.body.appendChild(nav);
  function sync() {
    const route = location.hash.slice(1);
    const active = document.querySelector('[data-prototype-page]:not([hidden])');
    const isLogin = !!active && active.dataset.pageId === 'login';
    nav.hidden = isLogin;
    nav.querySelectorAll('.app-tabbar__item').forEach((b) => { if (b.dataset.route === route) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }
  nav.addEventListener('click', (e) => {
    const b = e.target.closest('.app-tabbar__item'); if (!b) return;
    if (b.dataset.route) { location.hash = '#' + b.dataset.route; return; }
    const active = document.querySelector('[data-prototype-page]:not([hidden])');
    const burger = active && active.querySelector('[data-action="kravio:sidebar"]');
    if (burger) burger.click();
  });
  function setTitleToTab(tab) {
    const page = document.querySelector('[data-prototype-page]:not([hidden])'); if (!page) return;
    const head = page.querySelector('.page-region > .page-head'); if (!head) return;
    const h2 = head.querySelector('h2'); if (!h2) return;
    const label = tab.querySelector('span') ? tab.querySelector('span').textContent.trim() : tab.textContent.trim();
    const cid = tab.getAttribute('aria-controls');
    const panel = cid ? page.querySelector('#' + cid) : null;
    const title = (panel && (panel.dataset.title || panel.dataset.titleEn)) || label;
    if (title) h2.textContent = title;
  }
  document.addEventListener('click', (e) => { const tab = e.target.closest('.ws-tab'); if (!tab) return; setTimeout(() => setTitleToTab(tab), 0); });
  window.addEventListener('hashchange', sync);
  sync();
})();



(() => {
  const L = { id: { settings: 'Pengaturan', logout: 'Keluar' }, en: { settings: 'Settings', logout: 'Logout' } };
  const menu = document.createElement('div');
  menu.className = 'profile-menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;
  menu.innerHTML = '<div class="profile-menu__head"><strong>Aditya Pratama</strong><small>aditya.pratama@example.com</small></div>' +
    '<button type="button" role="menuitem" data-profile="settings"><iconify-icon noobserver icon="lucide:settings" aria-hidden="true"></iconify-icon><span>Pengaturan</span></button>' +
    '<button type="button" role="menuitem" data-profile="logout" class="danger"><iconify-icon noobserver icon="lucide:log-out" aria-hidden="true"></iconify-icon><span>Keluar</span></button>';
  document.body.appendChild(menu);
  function lang() { try { return localStorage.getItem('sop-lang') === 'en' ? 'en' : 'id'; } catch (e) { return 'id'; } }
  function syncLabels() { const d = L[lang()]; menu.querySelector('[data-profile="settings"] span').textContent = d.settings; menu.querySelector('[data-profile="logout"] span').textContent = d.logout; }
  syncLabels();
  document.addEventListener('nuvio:langchange', syncLabels);
  function close() { menu.hidden = true; }
  function open(btn) {
    const r = btn.getBoundingClientRect();
    menu.hidden = false;
    menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8)) + 'px';
    menu.style.bottom = (window.innerHeight - r.top + 8) + 'px';
    menu.style.top = 'auto';
    syncLabels();
    const first = menu.querySelector('button'); if (first) first.focus();
  }
  document.addEventListener('click', (e) => {
    const prof = e.target.closest('[data-action="kravio:profile"]');
    if (prof) { e.stopPropagation(); open(prof); return; }
    const item = e.target.closest('[data-profile]');
    if (item) { e.stopPropagation(); close(); if (item.dataset.profile === 'logout') location.hash = '#/login'; else location.hash = '#/settings'; return; }
    if (!e.target.closest('.profile-menu')) close();
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) close(); });
  window.addEventListener('hashchange', close);
  window.addEventListener('resize', close);
  window.addEventListener('scroll', close, true);
})();
