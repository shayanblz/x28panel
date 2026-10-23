/* X28 Mobile — tab 8: modem control actions */
(function (global) {
  'use strict';
  const X28 = (global.X28 = global.X28 || {});
  const U = X28.util, F = X28.fmt, I = X28.icon, S = X28.store, W = X28.widgets, ui = X28.ui;

  const DEMO_ACTIONS = [
    { name: 'band_lock', label: 'قفل باند', plugin: 'zlt', danger: false, description: 'مودم را روی باند مشخص ثابت می‌کند.', params: [{ key: 'band', label: 'باند', type: 'select', options: ['B1', 'B3', 'B8', 'B20', 'B28', 'n78'], default: 'B3' }] },
    { name: 'band_unlock', label: 'آزادکردن باند', plugin: 'zlt', danger: false, description: 'انتخاب باند را به شبکه می‌سپارد.', params: [] },
    { name: 'network_mode', label: 'تعیین حالت شبکه', plugin: 'zlt', danger: false, description: 'خودکار، فقط 4G یا فقط 5G.', params: [{ key: 'mode', label: 'حالت', type: 'select', options: ['auto', '4g', '5g'], default: 'auto' }] },
    { name: 'set_apn', label: 'تنظیم APN', plugin: 'zlt', danger: false, description: 'نقطهٔ دسترسی اپراتور را تغییر می‌دهد.', params: [{ key: 'apn', label: 'APN', type: 'str', default: 'mcinet' }] },
    { name: 'rescan', label: 'اسکن شبکه', plugin: 'zlt', danger: false, description: 'سلول‌های در دسترس را پیدا می‌کند.', params: [] },
    { name: 'wifi_onoff', label: 'روشن/خاموش وای‌فای', plugin: 'wifi', danger: false, description: 'رادیوی وای‌فای را کنترل می‌کند.', params: [{ key: 'on', label: 'روشن باشد', type: 'bool', default: true }] },
    { name: 'wps_push', label: 'فعال‌سازی WPS', plugin: 'wifi', danger: false, description: 'اتصال سریع دستگاه بدون رمز.', params: [] },
    { name: 'wifi_guest', label: 'شبکهٔ مهمان', plugin: 'wifi', danger: false, description: 'شبکهٔ جدا برای مهمان‌ها.', params: [{ key: 'on', label: 'فعال باشد', type: 'bool', default: true }] },
    { name: 'ping_test', label: 'آزمون اتصال', plugin: 'netinfo', danger: false, description: 'تأخیر، نوسان و افت بسته را اندازه می‌گیرد.', params: [] },
    { name: 'discovery', label: 'شناسایی خودکار مودم', plugin: 'zlt', danger: false, description: 'مدل و فریم‌ور و مسیرهای پنل مودم را پیدا می‌کند.', params: [] },
    { name: 'backup', label: 'پشتیبان‌گیری پیکربندی', plugin: 'panel', danger: false, description: 'از تنظیمات فعلی مودم نسخهٔ پشتیبان می‌سازد.', params: [] },
    { name: 'reboot', label: 'ریبوت مودم', plugin: 'zlt', danger: true, description: 'مودم را ری‌استارت می‌کند؛ اتصال ~۲۰ ثانیه قطع می‌شود.', params: [] }
  ];

  const PLUGIN_TITLES = {
    zlt: 'کنترل مودم (ZLT)', wifi: 'وای‌فای', netinfo: 'شبکه', panel: 'پنل', system: 'سیستم',
    snmp: 'SNMP', ssh: 'SSH', tr069: 'TR-069', ai: 'دستیار'
  };

  X28.tabs.register('actions', {
    label: 'عملیات',
    icon: 'bolt',
    mount(root) {
      root.innerHTML = ui.pageHead('کنترل مودم', 'عملیات مستقیم روی مودم X28',
        '<button class="icon-btn" id="ac-refresh" aria-label="به‌روزرسانی">' + I('refresh', 20) + '</button>') +
        '<div class="stack">' +
        '<div class="alert warn">' + I('shield', 16) + '<span><b>عملیات حساس با تأیید اجرا می‌شوند.</b> قفل باند، ریبوت و تغییر APN قبل از اجرا بکاپ پیکربندی می‌گیرند و در Audit ثبت می‌شوند.</span></div>' +
        '<div id="ac-list" class="stack"></div>' +
        '<section class="card">' +
        '  <div class="sec-head"><div class="sec-title"><span class="bar"></span>عملیات اخیر</div>' +
        '  <span class="badge neutral" id="ac-count">—</span></div>' +
        '  <div id="ac-audit"></div>' +
        '</section>' +
        '</div>';

      X28.icons.mount(root);
      const listHost = root.querySelector('#ac-list');

      function actionList(state) {
        if (state.conn.mode === 'device' && state.actions && state.actions.length) return state.actions;
        return DEMO_ACTIONS;
      }

      function groupActions(actions) {
        const groups = {};
        actions.forEach((a) => {
          const key = a.plugin || 'panel';
          groups[key] = groups[key] || [];
          groups[key].push(a);
        });
        return groups;
      }

      function renderList(state) {
        const actions = actionList(state);
        if (state.conn.mode === 'device' && (!state.actions || !state.actions.length)) {
          listHost.innerHTML = W.loadingCard('در حال دریافت عملیات از پنل…') +
            '<div class="hint">' + I('info', 13) + '<span>اگر پنل عملیاتی برنگرداند، ارتباط را از تنظیمات بررسی کنید.</span></div>';
          return;
        }
        const groups = groupActions(actions);
        listHost.innerHTML = Object.keys(groups).map((key) => {
          const items = groups[key];
          return '<section class="card tight" style="padding:8px 6px">' +
            '<div class="sec-head" style="margin:4px 8px 6px"><div class="sec-title" style="font-size:12px">' +
            U.esc(PLUGIN_TITLES[key] || key) + '<span class="badge outline">' + F.num(items.length) + '</span></div></div>' +
            '<div class="action-list" style="gap:5px">' +
            items.map((a) => {
              const icon = a.danger ? 'power' : /band/i.test(a.name) ? 'layers' : /wifi/i.test(a.name) ? 'wifi' :
                /apn|net/i.test(a.name) ? 'globe' : /reboot|backup|discover/i.test(a.name) ? 'settings' :
                  /ping|speed/i.test(a.name) ? 'activity' : 'bolt';
              return '<button class="action-item ' + (a.danger ? 'danger' : '') + '" data-action="' + U.esc(a.name) + '" style="border:0;background:transparent;padding:9px 8px">' +
                '<span class="row-icon ' + (a.danger ? 'rose' : '') + '">' + I(icon, 18) + '</span>' +
                '<span class="grow"><span class="row-title" style="font-size:12.5px">' + U.esc(a.label) +
                (a.danger ? ' <span class="badge err">حساس</span>' : '') + '</span>' +
                (a.description ? '<span class="row-sub" style="font-size:10px">' + U.esc(a.description) + '</span>' : '') + '</span>' +
                '<span class="arrow">' + I('chevronLeft', 15) + '</span></button>';
            }).join('') +
            '</div></section>';
        }).join('');
      }

      function fieldHtml(p, value) {
        const id = 'pf-' + U.uid('');
        if (p.type === 'bool') {
          return '<div class="row-between" style="padding:4px 0"><span class="small">' + U.esc(p.label) + '</span>' +
            '<button class="switch ' + (value ? 'on' : '') + '" data-param-bool="' + U.esc(p.key) + '" role="switch"></button></div>';
        }
        if (p.type === 'select' || (p.options && p.options.length)) {
          const opts = p.options || [];
          return '<div class="field"><label>' + U.esc(p.label) + '</label><select class="select" data-param="' + U.esc(p.key) + '">' +
            opts.map((o) => {
              const val = typeof o === 'object' ? (o.value !== undefined ? o.value : o.key) : o;
              const lab = typeof o === 'object' ? (o.label || o.value || o.key) : o;
              return '<option value="' + U.esc(val) + '" ' + (String(val) === String(value) ? 'selected' : '') + '>' + U.esc(lab) + '</option>';
            }).join('') + '</select></div>';
        }
        return '<div class="field"><label>' + U.esc(p.label) + (p.help ? ' <span class="muted tiny">(' + U.esc(p.help) + ')</span>' : '') + '</label>' +
          '<input class="input" data-param="' + U.esc(p.key) + '" type="' + (p.type === 'int' || p.type === 'number' ? 'number' : 'text') + '" value="' + U.esc(value === undefined || value === null ? '' : value) + '" placeholder="' + U.esc(p.default || '') + '" /></div>';
      }

      function collectParams(body) {
        const params = {};
        body.querySelectorAll('[data-param]').forEach((el) => {
          let v = el.value;
          if (el.type === 'number') v = Number(v);
          params[el.getAttribute('data-param')] = v;
        });
        body.querySelectorAll('[data-param-bool]').forEach((el) => {
          params[el.getAttribute('data-param-bool')] = el.classList.contains('on');
        });
        return params;
      }

      function openAction(action) {
        const params = action.params || [];
        if (!params.length) {
          confirmAndRun(action, {});
          return;
        }
        const body = U.el('div', { class: 'stack' });
        body.innerHTML = (action.description ? '<div class="hint">' + I('info', 13) + '<span>' + U.esc(action.description) + '</span></div>' : '') +
          '<div class="form-grid">' + params.map((p) => fieldHtml(p, p.default)).join('') + '</div>';
        body.querySelectorAll('[data-param-bool]').forEach((el) => {
          el.addEventListener('click', () => { el.classList.toggle('on'); el.setAttribute('aria-checked', String(el.classList.contains('on'))); });
        });
        const sheet = ui.sheet({
          title: action.label,
          sub: 'تنظیم پارامترها و اجرا',
          icon: action.danger ? 'alert' : 'bolt',
          body,
          footer: '<button class="btn ' + (action.danger ? 'danger' : 'primary') + '" id="ac-run">' + I('play', 16) + ' اجرا</button>',
          onMount() {
            const runBtn = document.querySelector('#ac-run');
            runBtn.addEventListener('click', () => {
              const values = collectParams(body);
              sheet.close();
              setTimeout(() => confirmAndRun(action, values), 150);
            });
          }
        });
      }

      async function confirmAndRun(action, params) {
        if (action.danger || S.state.settings.confirmActions) {
          const ok = await ui.confirm({
            title: action.label + '؟',
            text: action.danger
              ? 'این عملیات اتصال را موقتاً قطع می‌کند. آیا مطمئن هستید؟'
              : 'این عملیات روی مودم واقعی اجرا می‌شود.',
            tone: action.danger ? 'danger' : 'warn',
            icon: action.danger ? 'power' : 'alert',
            confirmText: 'اجرا کن'
          });
          if (!ok) return;
        }
        const res = await S.runAction(action.name, params, { label: action.label });
        const ok = res && res.ok;
        ui.toast(ok ? (res.message || 'انجام شد') : (res.error || res.message || 'ناموفق بود'), ok ? 'ok' : 'err', 4200);
        ui.modal({
          title: ok ? 'عملیات انجام شد' : 'عملیات ناموفق',
          text: '<b>' + U.esc(action.label) + '</b><br>' + U.esc((res && (res.message || res.error)) || '—'),
          icon: ok ? 'check' : 'alert',
          tone: ok ? '' : 'danger',
          confirmText: 'باشه',
          cancelText: 'جزئیات',
          content: res && res.data ? U.el('pre', { class: 'code', text: JSON.stringify(res.data, null, 2) }) : null
        });
        renderAudit(S.state);
      }

      function renderAudit(state) {
        const host = root.querySelector('#ac-audit');
        const items = state.audit || [];
        root.querySelector('#ac-count').textContent = items.length ? F.num(items.length) + ' مورد' : '—';
        host.innerHTML = items.length ? items.slice(0, 8).map((a) =>
          '<div class="kv-row"><span class="k" style="display:flex;align-items:center;gap:6px">' +
          I(a.status === 'ok' ? 'check' : a.status === 'err' ? 'alert' : 'clock', 13) +
          U.esc(a.label) + '</span><span class="v" style="display:flex;align-items:center;gap:7px">' +
          '<span class="badge ' + (a.status === 'ok' ? 'ok' : a.status === 'err' ? 'err' : 'neutral') + '">' +
          (a.status === 'ok' ? 'موفق' : a.status === 'err' ? 'خطا' : 'در حال اجرا') + '</span>' +
          '<span class="tiny muted">' + U.esc(U.relTime(a.ts)) + '</span></span></div>').join('')
          : '<div class="tiny muted" style="padding:6px 0">عملیاتی اجرا نشده است.</div>';
      }

      U.on(listHost, 'click', '[data-action]', (e, btn) => {
        const name = btn.getAttribute('data-action');
        const action = actionList(S.state).find((a) => a.name === name);
        if (action) openAction(action);
      });

      root.querySelector('#ac-refresh').addEventListener('click', () => {
        if (S.state.conn.mode === 'device') S.loadDeviceMeta();
        else renderList(S.state);
        ui.toast('فهرست عملیات به‌روز شد', 'ok', 1600);
      });

      function render(state) {
        renderList(state);
        renderAudit(state);
      }

      render(S.state);
      return { update: render };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
