/* X28 Mobile — app shell: navigation, sheets, modals, toasts, chrome */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util;
  const F = X28.fmt;
  const I = X28.icon;
  const S = X28.store;

  const ui = (X28.ui = {});
  const tabs = (X28.tabs = { registry: {}, order: [] });
  tabs.register = function (id, def) {
    tabs.registry[id] = def;
    if (tabs.order.indexOf(id) < 0) tabs.order.push(id);
  };

  const NAV = [
    { id: 'dashboard', label: 'داشبورد', icon: 'dashboard' },
    { id: 'signal', label: 'سیگنال', icon: 'signal' },
    { id: 'band', label: 'باند', icon: 'layers' },
    { id: 'network', label: 'شبکه', icon: 'globe' },
    { id: 'more', label: 'بیشتر', icon: 'more' }
  ];
  const MORE_ITEMS = [
    { id: 'wifi', label: 'وای‌فای', icon: 'wifi', tone: 'brand', desc: 'شبکهٔ ۲.۴ و ۵ گیگاهرتز' },
    { id: 'clients', label: 'کلاینت‌ها', icon: 'users', tone: 'violet', desc: 'دستگاه‌های متصل' },
    { id: 'events', label: 'رویدادها', icon: 'bell', tone: 'amber', desc: 'لاگ زندهٔ مودم' },
    { id: 'actions', label: 'عملیات', icon: 'bolt', tone: 'rose', desc: 'کنترل مستقیم مودم' },
    { id: 'plugins', label: 'پلاگین‌ها', icon: 'apps', tone: 'sky', desc: 'مدیریت افزونه‌ها' },
    { id: 'settings', label: 'تنظیمات', icon: 'gear', tone: 'brand', desc: 'اتصال، ظاهر و داده' }
  ];

  let activeTab = null;
  let currentInstance = null;
  let moreOpen = false;
  let sheetEl = null, backdropEl = null, sheetClose = null;

  ui.init = function () {
    /* header */
    const mark = document.getElementById('brand-mark');
    if (mark) {
      mark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" stroke="#04121A" stroke-width="2.5" stroke-linecap="round"/><circle cx="19.4" cy="4.9" r="1.5" fill="#04121A" opacity=".7"/></svg>';
    }
    renderTabbar();
    bindHeader();
    S.subscribe(() => {
      updateChrome();
      if (currentInstance && currentInstance.update) currentInstance.update(S.state);
    });
    S.state.ui.tab = S.state.ui.tab || 'dashboard';
    activate(S.state.ui.tab, { silent: true });
    updateChrome();
    updateTabbar();
  };

  function bindHeader() {
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const next = S.state.settings.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.classList.add('theme-anim');
        S.setSetting('theme', next);
        setTimeout(() => document.documentElement.classList.remove('theme-anim'), 420);
        themeBtn.innerHTML = '<span class="icon-slot" data-icon="' + (next === 'dark' ? 'moon' : 'sun') + '"></span>';
        X28.icons.mount(themeBtn);
        U.haptic('light');
      });
    }
    const refreshBtn = document.getElementById('btn-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('spinning');
        U.haptic('light');
        if (S.state.conn.mode === 'demo') {
          const engine = S.demoEngine();
          if (engine) engine.tick();
          setTimeout(() => ui.toast('داده‌های زنده به‌روزرسانی شد', 'ok', 1800), 250);
        } else {
          S.connectDevice({ force: true }).then(() => {
            if (S.state.conn.status === 'online') ui.toast('اطلاعات پنل دریافت شد', 'ok', 1800);
            else ui.toast(S.state.conn.error || 'اتصال برقرار نشد', 'err', 3800);
          });
        }
        setTimeout(() => refreshBtn.classList.remove('spinning'), 900);
      });
    }
  }

  /* ── chrome ────────────────────────────────────────────────────────── */
  function updateChrome() {
    const sub = document.getElementById('brand-sub');
    if (sub) {
      const st = S.state.conn;
      const dotTone = st.mode === 'demo' ? 'demo' : st.status === 'online' ? 'ok' : st.status === 'connecting' ? 'idle' : 'err';
      const label = st.mode === 'demo' ? 'حالت نمایشی' : st.status === 'online' ? (st.ms ? 'پنل · ' + F.num(st.ms) + 'ms' : 'پنل متصل') : st.status === 'connecting' ? 'در حال اتصال…' : 'قطع';
      sub.innerHTML = '<span class="status ' + dotTone + '" style="height:19px;padding:0 8px;font-size:10.5px"><span class="dot"></span>' + U.esc(label) + '</span>';
    }
    const themeBtn = document.getElementById('btn-theme');
    if (themeBtn) {
      themeBtn.innerHTML = '<span class="icon-slot" data-icon="' + (S.state.settings.theme === 'dark' ? 'moon' : 'sun') + '"></span>';
      X28.icons.mount(themeBtn);
    }
    const strip = document.getElementById('net-strip');
    if (!strip) return;
    const st = S.state.conn;
    let text = '', tone = '';
    if (st.mode === 'device' && st.status !== 'online') {
      text = st.status === 'connecting' ? 'در حال اتصال به پنل…' : (st.error || 'اتصال به پنل برقرار نیست');
      tone = st.status === 'connecting' ? 'warn' : 'err';
    }
    if (text) {
      strip.className = 'net-strip show ' + tone;
      strip.innerHTML = I('alert', 16) + '<span class="grow">' + U.esc(text) + '</span>' +
        (st.status !== 'connecting' ? '<button class="link-btn" id="strip-retry" style="flex:0 0 auto">تلاش دوباره</button>' : '');
      const retry = document.getElementById('strip-retry');
      if (retry) retry.addEventListener('click', () => S.connectDevice({ force: true }));
    } else {
      strip.className = 'net-strip';
      strip.innerHTML = '';
    }
    updateTabbar();
  }

  /* ── tabbar ────────────────────────────────────────────────────────── */
  function renderTabbar() {
    const bar = document.getElementById('tabbar');
    if (!bar) return;
    bar.innerHTML = NAV.map((n) => {
      return '<button class="tab-btn" data-nav="' + n.id + '" aria-label="' + U.esc(n.label) + '">' +
        '<span class="tab-ind"></span>' + I(n.icon, 22) +
        '<span class="tab-label">' + U.esc(n.label) + '</span>' +
        (n.id === 'more' ? '<span class="tab-badge hide" id="more-badge">0</span>' : '') +
        '</button>';
    }).join('');
    bar.querySelectorAll('[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-nav');
        U.haptic('light');
        if (id === 'more') openMore();
        else activate(id);
      });
    });
  }

  function isMore(tab) {
    return MORE_ITEMS.some((m) => m.id === tab);
  }

  function updateTabbar() {
    const bar = document.getElementById('tabbar');
    if (!bar) return;
    const tab = S.state.ui.tab;
    const showMore = isMore(tab) || moreOpen;
    bar.querySelectorAll('[data-nav]').forEach((btn) => {
      const id = btn.getAttribute('data-nav');
      const on = id === 'more' ? showMore : id === tab;
      btn.classList.toggle('active', on);
    });
    const badge = document.getElementById('more-badge');
    if (badge) {
      const offline = (S.state.live.clients || []).filter((c) => !c.online).length;
      if (offline > 0 && !showMore) {
        badge.textContent = String(offline);
        badge.classList.remove('hide');
      } else badge.classList.add('hide');
    }
  }

  /* ── routing ───────────────────────────────────────────────────────── */
  ui.activate = activate;
  function activate(id, opts) {
    opts = opts || {};
    const def = tabs.registry[id];
    if (!def) {
      if (id !== 'dashboard') return activate('dashboard');
      return;
    }
    if (activeTab === id && currentInstance && !opts.force) {
      S.state.ui.tab = id;
      S.notify();
      return;
    }
    ui.closeSheet();
    if (currentInstance && currentInstance.destroy) {
      try { currentInstance.destroy(); } catch (e) {}
    }
    currentInstance = null;
    activeTab = id;
    S.state.ui.tab = id;
    U.store.set('lastTab', id);
    const view = document.getElementById('view');
    if (!view) return;
    view.innerHTML = '';
    const page = U.el('section', { class: 'page' });
    view.appendChild(page);
    try {
      currentInstance = def.mount(page) || null;
    } catch (e) {
      page.innerHTML = '<div class="card empty"><div class="empty-art">' + I('alert', 30) + '</div><div class="empty-title">خطا در بارگذاری بخش</div><div class="empty-sub">' + U.esc(String(e && e.message || e)) + '</div></div>';
      if (global.console) console.error(e);
    }
    if (currentInstance && currentInstance.update) currentInstance.update(S.state);
    updateChrome();
    updateTabbar();
    global.scrollTo({ top: 0, behavior: opts.silent ? 'auto' : 'smooth' });
    if (!opts.silent) S.notify();
  }
  ui.activate = activate;
  ui.refresh = function () {
    if (activeTab) activate(activeTab, { force: true });
  };
  ui.currentTab = () => activeTab;

  /* ── more sheet ────────────────────────────────────────────────────── */
  function openMore() {
    moreOpen = true;
    updateTabbar();
    const body = U.el('div', { class: 'stack' });
    body.innerHTML =
      '<div class="grid2" style="gap:9px">' +
      MORE_ITEMS.map((m) => (
        '<button class="card tight" data-more="' + m.id + '" style="text-align:start;display:flex;gap:10px;align-items:center;padding:12px">' +
        '<span class="row-icon ' + m.tone + '">' + I(m.icon, 19) + '</span>' +
        '<span class="grow" style="min-width:0"><span class="row-title" style="font-size:12.5px">' + U.esc(m.label) + '</span>' +
        '<span class="row-sub" style="font-size:10px">' + U.esc(m.desc) + '</span></span>' +
        '</button>'
      )).join('') + '</div>' +
      '<div class="card tight" style="margin-top:2px">' +
      '<div class="row" style="gap:9px"><span class="row-icon brand">' + I('info', 18) + '</span>' +
      '<div class="grow"><div class="row-title" style="font-size:12.5px">دربارهٔ این برنامه</div>' +
      '<div class="row-sub" style="font-size:10.5px">X28 Mobile · نسخهٔ ' + U.esc(ui.version()) + ' · رابط موبایل پنل X28</div></div>' +
      '<button class="btn sm ghost" id="more-about">بیشتر</button></div></div>';

    const sheet = ui.sheet({
      title: 'همهٔ بخش‌ها',
      sub: 'دسترسی سریع به ابزارهای پنل',
      body,
      onClose() { moreOpen = false; updateTabbar(); }
    });
    moreOpen = true;
    updateTabbar();
    body.querySelectorAll('[data-more]').forEach((btn) => {
      btn.addEventListener('click', () => {
        ui.closeSheet();
        setTimeout(() => activate(btn.getAttribute('data-more')), 120);
      });
    });
    const about = body.querySelector('#more-about');
    if (about) about.addEventListener('click', () => { ui.closeSheet(); setTimeout(() => activate('settings'), 120); });
    return sheet;
  }

  /* ── toasts ────────────────────────────────────────────────────────── */
  ui.toast = function (msg, tone, ms) {
    tone = tone || 'info';
    const root = document.getElementById('toast-root');
    if (!root) return;
    const icons = { ok: 'check', err: 'alert', warn: 'alert', info: 'info' };
    const el = U.el('div', { class: 'toast ' + tone });
    el.innerHTML = I(icons[tone] || 'info', 16) + '<span>' + U.esc(msg) + '</span>';
    root.appendChild(el);
    while (root.children.length > 3) root.removeChild(root.firstChild);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 260);
    }, ms || 2800);
  };

  /* ── sheet ─────────────────────────────────────────────────────────── */
  ui.sheet = function (opts) {
    opts = opts || {};
    ui.closeSheet(true);
    const root = document.getElementById('sheet-root');
    root.innerHTML = '';
    const backdrop = U.el('div', { class: 'backdrop' });
    const sheet = U.el('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' });
    const bodyHtml = typeof opts.body === 'string' ? opts.body : '';
    sheet.innerHTML =
      '<div class="sheet-grab"></div>' +
      '<div class="sheet-head"><div class="grow"><div class="sheet-title">' + (opts.icon ? I(opts.icon, 18) : '') + U.esc(opts.title || '') + '</div>' +
      (opts.sub ? '<div class="sheet-sub">' + U.esc(opts.sub) + '</div>' : '') + '</div>' +
      '<button class="sheet-close" aria-label="بستن">' + I('close', 16) + '</button></div>' +
      '<div class="sheet-body"></div>' +
      (opts.footer ? '<div class="sheet-foot"></div>' : '');
    const body = sheet.querySelector('.sheet-body');
    if (opts.body && typeof opts.body !== 'string') body.appendChild(opts.body);
    else body.innerHTML = bodyHtml;
    if (opts.footer) {
      const foot = sheet.querySelector('.sheet-foot');
      if (typeof opts.footer === 'string') foot.innerHTML = opts.footer;
      else foot.appendChild(opts.footer);
    }
    root.appendChild(backdrop);
    root.appendChild(sheet);
    document.body.style.overflow = 'hidden';
    sheetEl = sheet; backdropEl = backdrop;
    requestAnimationFrame(() => { backdrop.classList.add('show'); sheet.classList.add('show'); });

    const close = () => ui.closeSheet();
    backdrop.addEventListener('click', close);
    sheet.querySelector('.sheet-close').addEventListener('click', close);
    U.enableSheetDrag(sheet, close);

    sheetClose = function (instant) {
      backdrop.classList.remove('show');
      sheet.classList.remove('show');
      document.body.style.overflow = '';
      if (instant) {
        root.innerHTML = '';
        sheetEl = null; backdropEl = null;
      } else {
        setTimeout(() => {
          if (sheet.parentNode) root.innerHTML = '';
          if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
          sheetEl = null; backdropEl = null;
        }, 320);
      }
      if (opts.onClose) try { opts.onClose(); } catch (e) {}
    };
    if (opts.onMount) try { opts.onMount(body, close); } catch (e) { console.error(e); }
    if (opts.footer && opts.onFooter) try { opts.onFooter(sheet.querySelector('.sheet-foot'), close); } catch (e) {}
    return { el: sheet, body, close, setSub(t) { const s = sheet.querySelector('.sheet-sub'); if (s) s.textContent = t; } };
  };

  ui.closeSheet = function (instant) {
    if (sheetClose) sheetClose(instant);
    sheetClose = null;
    moreOpen = false;
    updateTabbar();
  };
  ui.sheetOpen = () => !!sheetEl;

  /* ── modal / confirm ───────────────────────────────────────────────── */
  ui.modal = function (opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root');
    root.innerHTML = '';
    const backdrop = U.el('div', { class: 'backdrop show' });
    const card = U.el('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true' });
    card.innerHTML =
      '<div class="modal-icon ' + (opts.tone || '') + '">' + I(opts.icon || 'info', 24) + '</div>' +
      '<div class="modal-title">' + U.esc(opts.title || '') + '</div>' +
      (opts.text ? '<div class="modal-text">' + opts.text + '</div>' : '') +
      (opts.content ? '<div style="margin-top:12px;text-align:start"></div>' : '') +
      '<div class="modal-actions">' +
      '<button class="btn ghost" data-modal="cancel">' + U.esc(opts.cancelText || 'انصراف') + '</button>' +
      '<button class="btn ' + (opts.tone === 'danger' ? 'danger' : 'primary') + '" data-modal="ok">' + U.esc(opts.confirmText || 'تأیید') + '</button>' +
      '</div>';
    root.appendChild(backdrop);
    root.appendChild(card);
    if (opts.content) card.querySelector('div[style]').appendChild(opts.content);
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => card.classList.add('show'));

    return new Promise((resolve) => {
      const done = (value) => {
        card.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => { root.innerHTML = ''; }, 240);
        resolve(value);
      };
      card.querySelector('[data-modal="cancel"]').addEventListener('click', () => done(false));
      card.querySelector('[data-modal="ok"]').addEventListener('click', () => done(true));
      backdrop.addEventListener('click', () => done(false));
    });
  };

  ui.confirm = function (opts) {
    opts = opts || {};
    return ui.modal({
      title: opts.title || 'تأیید عملیات',
      text: opts.text || '',
      icon: opts.icon || 'alert',
      tone: opts.tone || 'warn',
      confirmText: opts.confirmText || 'بله، انجام بده',
      cancelText: 'انصراف'
    });
  };

  ui.modalOpen = () => !!document.querySelector('#modal-root .modal-card');

  /* ── helpers ───────────────────────────────────────────────────────── */
  ui.pageHead = function (title, sub, actionsHtml) {
    return '<div class="row-between" style="margin:2px 2px 14px">' +
      '<div style="min-width:0"><h1 style="font-size:20px;font-weight:700;line-height:1.4">' + U.esc(title) + '</h1>' +
      (sub ? '<div class="small muted" style="margin-top:1px">' + U.esc(sub) + '</div>' : '') + '</div>' +
      (actionsHtml || '') + '</div>';
  };

  ui.empty = function (opts) {
    opts = opts || {};
    return '<div class="empty"><div class="empty-art">' + I(opts.icon || 'info', 32) + '</div>' +
      '<div class="empty-title">' + U.esc(opts.title || 'چیزی نیست') + '</div>' +
      (opts.sub ? '<div class="empty-sub">' + U.esc(opts.sub) + '</div>' : '') +
      (opts.action ? opts.action : '') + '</div>';
  };

  ui.statusPill = function (st) {
    const map = {
      demo: ['demo', 'حالت نمایشی'], online: ['ok', 'متصل'], connecting: ['idle', 'در حال اتصال'],
      degraded: ['warn', 'اتصال ناپایدار'], offline: ['err', 'قطع'], boot: ['idle', 'در حال راه‌اندازی']
    };
    const m = map[st] || map.boot;
    return '<span class="status ' + m[0] + '"><span class="dot"></span>' + m[1] + '</span>';
  };

  ui.connLabel = function () {
    const c = S.state.conn;
    if (c.mode === 'demo') return 'حالت نمایشی';
    if (c.status === 'online') return 'پنل متصل';
    if (c.status === 'connecting') return 'در حال اتصال';
    return 'قطع';
  };

  ui.version = function () {
    return (global.Android && typeof global.Android.appVersion === 'function') ? String(global.Android.appVersion()) : '1.0.0';
  };

  ui.modeAction = function (fn) {
    return (global.Android && typeof global.Android[fn] === 'function') ? global.Android[fn]() : null;
  };

  /* Android hardware back */
  global.__x28Back = function () {
    if (ui.sheetOpen()) { ui.closeSheet(); return true; }
    if (ui.modalOpen()) { return true; }
    if (S.state.ui.tab !== 'dashboard') { activate('dashboard'); return true; }
    return false;
  };

  ui.tabsMeta = { NAV, MORE_ITEMS };
})(typeof window !== 'undefined' ? window : globalThis);
